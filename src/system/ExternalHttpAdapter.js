// ============================================================
// ExternalHttpAdapter v1.0.0
// Disabled-by-default, read-only GAS web-app adapter
//
// Request flow:
// strict POST event -> rate limit -> Google token verification -> subject
// binding resolution -> fixed external action policy -> canonical J RPC.
// ============================================================

console.log("ExternalHttpAdapter v1.0.0");

const ExternalHttpAdapter = {
  version: "1.0.0",
  initialized: false,
  handled: 0,
  failed: 0,
  lastRequestAt: null,

  init() {
    if (this.initialized) {
      return true;
    }

    [
      "ExternalHttpConfig",
      "ExternalHttpContract",
      "ExternalHttpRateLimiter",
      "GoogleIdTokenAuthenticator",
      "ExternalUserResolver",
      "ExternalHttpPolicy",
      "ServerRequestBoundary",
      "SecurityContext",
    ].forEach((name) => {
      if (!globalThis[name]) {
        throw new Error(
          "ExternalHttpAdapter requires " +
            name
        );
      }
    });

    this.initialized = true;
    return true;
  },

  reset() {
    this.initialized = false;
    this.handled = 0;
    this.failed = 0;
    this.lastRequestAt = null;
    return true;
  },

  _assertSync(result, label) {
    if (
      result &&
      typeof result.then ===
        "function"
    ) {
      throw new Error(
        label +
          " must be synchronous in Google Apps Script"
      );
    }

    return result;
  },

  _ensureStarted() {
    if (
      typeof SystemInit !==
        "undefined" &&
      typeof SystemInit.isReady ===
        "function" &&
      SystemInit.isReady() === true
    ) {
      return true;
    }

    if (
      typeof Bootstrap !==
        "undefined" &&
      typeof Bootstrap
        .ensureStarted ===
        "function"
    ) {
      return this._assertSync(
        Bootstrap.ensureStarted(),
        "Bootstrap.ensureStarted"
      );
    }

    if (
      typeof startERP ===
        "function"
    ) {
      return this._assertSync(
        startERP(),
        "startERP"
      );
    }

    throw new Error(
      "ERP startup entry point unavailable"
    );
  },

  _safeLog(
    error,
    envelope
  ) {
    if (
      typeof Logger ===
        "undefined" ||
      typeof Logger.error !==
        "function"
    ) {
      return false;
    }

    const classified =
      ExternalHttpContract
        .classify(error);
    const request =
      envelope &&
      envelope.request &&
      typeof envelope.request ===
        "object"
        ? envelope.request
        : {};
    const safe = (value, length) =>
      String(value || "UNKNOWN")
        .replace(
          /[\u0000-\u001F\u007F]+/g,
          " "
        )
        .slice(0, length);

    Logger.error(
      "EXTERNAL HTTP FAILED" +
        " requestId=" +
        safe(
          request.requestId,
          96
        ) +
        " action=" +
        safe(
          request.action,
          80
        ) +
        " code=" +
        classified.code
    );

    return true;
  },

  handleEvent(event) {
    let envelope = null;

    try {
      /*
       * Disabled state, path, content type, body size and JSON shape are
       * checked before ERP startup or external network access.
       */
      envelope =
        ExternalHttpContract
          .parseEvent(event);

      ExternalHttpRateLimiter
        .check(
          envelope.credential
        );

      const identity =
        GoogleIdTokenAuthenticator
          .authenticate(
            envelope.credential
          );

      this._ensureStarted();

      if (!this.initialized) {
        this.init();
      }

      ExternalHttpPolicy
        .requireAllowed(
          envelope.request.action
        );

      const profile =
        ExternalUserResolver.resolve(
          identity,
          {
            organizationId:
              envelope
                .organizationId,
          }
        );
      const rpcResponse =
        ServerRequestBoundary
          .handleWithProfile(
            envelope.request,
            profile
          );

      this.handled++;
      this.lastRequestAt =
        new Date().toISOString();

      return ExternalHttpContract
        .textOutput(
          ExternalHttpContract
            .success(
              rpcResponse
            )
        );
    } catch (error) {
      this.failed++;
      this.lastRequestAt =
        new Date().toISOString();

      this._safeLog(
        error,
        envelope
      );

      return ExternalHttpContract
        .textOutput(
          ExternalHttpContract
            .failure(error)
        );
    }
  },

  health() {
    const config =
      ExternalHttpConfig.get();

    return {
      module:
        "ExternalHttpAdapter",
      version: this.version,
      status:
        this.initialized
          ? "OK"
          : "WARNING",
      initialized:
        this.initialized,
      enabled: config.enabled,
      mode:
        config.enabled
          ? config.mode
          : "DISABLED",
      readOnly: true,
      actions:
        ExternalHttpPolicy
          .initialized
          ? ExternalHttpPolicy
            .actions.length
          : 0,
      handled: this.handled,
      failed: this.failed,
      lastRequestAt:
        this.lastRequestAt,
      tokenInJsonBody: true,
      tokenPersisted: false,
      realHttpStatusControl:
        false,
      productionReady: false,
    };
  },
};

/*
 * The only HTTP entry point in Package K. It is fail-closed until the exact
 * ScriptProperties configuration in README.md is installed.
 */
function doPost(event) {
  return ExternalHttpAdapter
    .handleEvent(event);
}

globalThis.ExternalHttpAdapter =
  ExternalHttpAdapter;
