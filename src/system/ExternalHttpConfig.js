// ============================================================
// ExternalHttpConfig v1.0.0
// Fail-closed configuration for the pilot external HTTP adapter
//
// ScriptProperties are used only for system configuration. They never store
// a current user, role, organization, Google ID token or resolved principal.
// ============================================================

console.log("ExternalHttpConfig v1.0.0");

const ExternalHttpConfig = {
  version: "1.0.0",
  initialized: false,
  settings: null,

  keys: {
    enabled:
      "TAXCONTROL_EXTERNAL_HTTP_ENABLED",
    mode:
      "TAXCONTROL_EXTERNAL_HTTP_MODE",
    path:
      "TAXCONTROL_EXTERNAL_HTTP_PATH",
    clientIds:
      "TAXCONTROL_GOOGLE_CLIENT_IDS",
    hostedDomain:
      "TAXCONTROL_GOOGLE_HOSTED_DOMAIN",
    verifier:
      "TAXCONTROL_EXTERNAL_TOKEN_VERIFIER",
  },

  requiredMode: "PILOT_READ_ONLY",
  requiredVerifier:
    "GOOGLE_TOKENINFO_PILOT",
  defaultPath: "api/v1",

  _properties() {
    if (
      typeof PropertiesService ===
        "undefined" ||
      typeof PropertiesService
        .getScriptProperties !==
        "function"
    ) {
      throw new Error(
        "EXTERNAL_HTTP_CONFIG_UNAVAILABLE"
      );
    }

    return PropertiesService
      .getScriptProperties();
  },

  _read(key) {
    const properties =
      this._properties();

    return String(
      properties.getProperty(key) ||
      ""
    ).trim();
  },

  _isTrue(value) {
    return String(value || "")
      .trim()
      .toUpperCase() === "TRUE";
  },

  _normalizePath(value) {
    return String(
      value || this.defaultPath
    )
      .trim()
      .replace(/^\/+|\/+$/g, "");
  },

  _parseClientIds(value) {
    const source =
      String(value || "").trim();

    if (!source) {
      return [];
    }

    let values = [];

    if (
      source.startsWith("[") &&
      source.endsWith("]")
    ) {
      try {
        const parsed =
          JSON.parse(source);

        values =
          Array.isArray(parsed)
            ? parsed
            : [];
      } catch (error) {
        throw new Error(
          "EXTERNAL_HTTP_CLIENT_IDS_INVALID"
        );
      }
    } else {
      values = source.split(/[,\n;]/);
    }

    return Array.from(
      new Set(
        values
          .map((item) =>
            String(item || "")
              .trim()
          )
          .filter(Boolean)
      )
    );
  },

  _validate(settings) {
    if (
      !settings.path ||
      settings.path.length > 160 ||
      !/^[A-Za-z0-9_/-]+$/
        .test(settings.path)
    ) {
      throw new Error(
        "EXTERNAL_HTTP_PATH_INVALID"
      );
    }

    if (!settings.enabled) {
      return true;
    }

    if (
      settings.mode !==
        this.requiredMode
    ) {
      throw new Error(
        "EXTERNAL_HTTP_MODE_INVALID"
      );
    }

    if (
      settings.verifier !==
        this.requiredVerifier
    ) {
      throw new Error(
        "EXTERNAL_HTTP_VERIFIER_INVALID"
      );
    }

    if (!settings.clientIds.length) {
      throw new Error(
        "EXTERNAL_HTTP_CLIENT_IDS_REQUIRED"
      );
    }

    settings.clientIds.forEach(
      (clientId) => {
        if (
          clientId.length > 512 ||
          !/^[A-Za-z0-9._:-]+$/
            .test(clientId)
        ) {
          throw new Error(
            "EXTERNAL_HTTP_CLIENT_ID_INVALID"
          );
        }
      }
    );

    if (
      settings.hostedDomain &&
      (
        settings.hostedDomain.length >
          253 ||
        !/^[a-z0-9.-]+$/
          .test(
            settings.hostedDomain
          )
      )
    ) {
      throw new Error(
        "EXTERNAL_HTTP_HOSTED_DOMAIN_INVALID"
      );
    }

    return true;
  },

  init() {
    if (this.initialized) {
      return true;
    }

    const enabled =
      this._isTrue(
        this._read(
          this.keys.enabled
        )
      );
    let clientIds = [];
    let configurationError =
      null;

    try {
      clientIds =
        this._parseClientIds(
          this._read(
            this.keys.clientIds
          )
        );
    } catch (error) {
      if (enabled) {
        throw error;
      }

      configurationError =
        error.message;
    }

    const settings = {
      enabled,
      mode:
        this._read(
          this.keys.mode
        ).toUpperCase(),
      path:
        this._normalizePath(
          this._read(
            this.keys.path
          )
        ),
      clientIds,
      hostedDomain:
        this._read(
          this.keys.hostedDomain
        ).toLowerCase(),
      verifier:
        this._read(
          this.keys.verifier
        ).toUpperCase(),
      configurationError,
    };

    try {
      this._validate(settings);
    } catch (error) {
      if (enabled) {
        throw error;
      }

      settings.configurationError =
        settings.configurationError ||
        error.message;
      settings.path =
        this.defaultPath;
      settings.clientIds = [];
      settings.hostedDomain = "";
    }

    this.settings = settings;
    this.initialized = true;

    return true;
  },

  reset() {
    this.initialized = false;
    this.settings = null;
    return true;
  },

  get() {
    if (!this.initialized) {
      this.init();
    }

    return {
      enabled:
        this.settings.enabled,
      mode: this.settings.mode,
      path: this.settings.path,
      clientIds: [
        ...this.settings.clientIds,
      ],
      hostedDomain:
        this.settings.hostedDomain,
      verifier:
        this.settings.verifier,
      configurationValid:
        !this.settings
          .configurationError,
    };
  },

  isEnabled() {
    return this.get().enabled ===
      true;
  },

  assertEnabled() {
    const settings = this.get();

    if (!settings.enabled) {
      throw new Error(
        "EXTERNAL_HTTP_DISABLED"
      );
    }

    this._validate(settings);
    return settings;
  },

  assertVerifierConfigured() {
    const settings = this.get();

    if (
      settings.verifier !==
        this.requiredVerifier ||
      !settings.clientIds.length ||
      settings.configurationValid ===
        false
    ) {
      throw new Error(
        "EXTERNAL_AUTH_NOT_CONFIGURED"
      );
    }

    return settings;
  },

  health() {
    const settings = this.get();

    return {
      module:
        "ExternalHttpConfig",
      version: this.version,
      status: "OK",
      initialized:
        this.initialized,
      enabled: settings.enabled,
      mode:
        settings.enabled
          ? settings.mode
          : "DISABLED",
      pathConfigured:
        !!settings.path,
      clientIdCount:
        settings.clientIds.length,
      hostedDomainRestricted:
        !!settings.hostedDomain,
      configurationValid:
        settings
          .configurationValid,
      credentialsStored: false,
      principalStored: false,
    };
  },
};

globalThis.ExternalHttpConfig =
  ExternalHttpConfig;
