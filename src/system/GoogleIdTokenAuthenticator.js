// ============================================================
// GoogleIdTokenAuthenticator v1.0.0
// Pilot verifier for Google ID tokens
//
// IMPORTANT:
// - Google tokeninfo is used only for a controlled pilot.
// - Production must move verification to a backend with an official Google
//   authentication library or a standards-compliant local JWT verifier.
// - The raw credential is never logged, persisted or returned.
// ============================================================

console.log(
  "GoogleIdTokenAuthenticator v1.0.0"
);

const GoogleIdTokenAuthenticator = {
  version: "1.0.0",
  initialized: false,
  verificationEndpoint:
    "https://oauth2.googleapis.com/tokeninfo?id_token=",
  clockSkewSeconds: 60,
  maximumTokenAgeSeconds: 3900,
  cacheSeconds: 300,

  init() {
    if (this.initialized) {
      return true;
    }

    [
      "ExternalHttpConfig",
      "ExternalHttpContract",
    ].forEach((name) => {
      if (!globalThis[name]) {
        throw new Error(
          "GoogleIdTokenAuthenticator requires " +
            name
        );
      }
    });

    this.initialized = true;
    return true;
  },

  reset() {
    this.initialized = false;
    return true;
  },

  _error(code, internal) {
    return ExternalHttpContract
      .error(code, internal);
  },

  _digestHex(value) {
    if (
      typeof Utilities ===
        "undefined" ||
      typeof Utilities
        .computeDigest !==
        "function"
    ) {
      throw this._error(
        "GOOGLE_TOKEN_VERIFICATION_UNAVAILABLE",
        "Utilities.computeDigest unavailable"
      );
    }

    const algorithm =
      Utilities.DigestAlgorithm &&
      Utilities.DigestAlgorithm
        .SHA_256
        ? Utilities
          .DigestAlgorithm
          .SHA_256
        : "SHA_256";
    const charset =
      Utilities.Charset &&
      Utilities.Charset.UTF_8
        ? Utilities.Charset.UTF_8
        : undefined;
    const bytes =
      charset === undefined
        ? Utilities.computeDigest(
          algorithm,
          String(value)
        )
        : Utilities.computeDigest(
          algorithm,
          String(value),
          charset
        );

    return bytes
      .map((byte) =>
        (
          (byte + 256) % 256
        )
          .toString(16)
          .padStart(2, "0")
      )
      .join("");
  },

  fingerprint(credential) {
    return this
      ._digestHex(credential)
      .slice(0, 32);
  },

  _cache() {
    if (
      typeof CacheService ===
        "undefined" ||
      typeof CacheService
        .getScriptCache !==
        "function"
    ) {
      return null;
    }

    return CacheService
      .getScriptCache();
  },

  _cacheKey(credential) {
    return (
      "TAXCONTROL_GOOGLE_TOKEN_" +
      this.fingerprint(credential)
    );
  },

  _cached(credential) {
    const cache = this._cache();

    if (
      !cache ||
      typeof cache.get !==
        "function"
    ) {
      return null;
    }

    const value =
      cache.get(
        this._cacheKey(
          credential
        )
      );

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  },

  _storeCache(
    credential,
    identity
  ) {
    const cache = this._cache();

    if (
      !cache ||
      typeof cache.put !==
        "function"
    ) {
      return false;
    }

    const now =
      Math.floor(Date.now() / 1000);
    const lifetime =
      Math.max(
        1,
        Math.min(
          this.cacheSeconds,
          Number(identity.expiresAt) -
            now
        )
      );

    cache.put(
      this._cacheKey(credential),
      JSON.stringify(identity),
      lifetime
    );

    return true;
  },

  _fetchClaims(credential) {
    if (
      typeof UrlFetchApp ===
        "undefined" ||
      typeof UrlFetchApp.fetch !==
        "function"
    ) {
      throw this._error(
        "GOOGLE_TOKEN_VERIFICATION_UNAVAILABLE",
        "UrlFetchApp unavailable"
      );
    }

    let response;

    try {
      response = UrlFetchApp.fetch(
        this.verificationEndpoint +
          encodeURIComponent(
            credential
          ),
        {
          method: "get",
          muteHttpExceptions: true,
          followRedirects: false,
          validateHttpsCertificates:
            true,
        }
      );
    } catch (error) {
      throw this._error(
        "GOOGLE_TOKEN_VERIFICATION_UNAVAILABLE",
        "Google token verification request failed"
      );
    }

    const status =
      Number(
        response.getResponseCode()
      );

    if (status !== 200) {
      if (status >= 500) {
        throw this._error(
          "GOOGLE_TOKEN_VERIFICATION_UNAVAILABLE",
          "Google tokeninfo unavailable"
        );
      }

      throw this._error(
        "GOOGLE_CREDENTIAL_INVALID",
        "Google tokeninfo rejected credential"
      );
    }

    let claims;

    try {
      claims = JSON.parse(
        response.getContentText()
      );
    } catch (error) {
      throw this._error(
        "GOOGLE_TOKEN_VERIFICATION_UNAVAILABLE",
        "Google tokeninfo response invalid"
      );
    }

    if (
      !claims ||
      typeof claims !== "object" ||
      Array.isArray(claims)
    ) {
      throw this._error(
        "GOOGLE_CREDENTIAL_INVALID",
        "Google token claims unavailable"
      );
    }

    return claims;
  },

  _email(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  },

  _isTrue(value) {
    return (
      value === true ||
      String(value || "")
        .trim()
        .toLowerCase() ===
        "true" ||
      String(value || "").trim() ===
        "1"
    );
  },

  _authoritativeEmail(
    email,
    hostedDomain
  ) {
    return (
      email.endsWith(
        "@gmail.com"
      ) ||
      !!hostedDomain
    );
  },

  _validateClaims(claims) {
    const settings =
      ExternalHttpConfig
        .assertVerifierConfigured();
    const now =
      Math.floor(Date.now() / 1000);
    const issuer =
      String(claims.iss || "");
    const audience =
      String(claims.aud || "");
    const authorizedParty =
      String(claims.azp || "");
    const subject =
      String(claims.sub || "")
        .trim();
    const email =
      this._email(claims.email);
    const hostedDomain =
      String(claims.hd || "")
        .trim()
        .toLowerCase();
    const expiresAt =
      Number(claims.exp);
    const issuedAt =
      Number(claims.iat);

    if (
      ![
        "accounts.google.com",
        "https://accounts.google.com",
      ].includes(issuer)
    ) {
      throw this._error(
        "GOOGLE_TOKEN_ISSUER_INVALID",
        "Unexpected Google issuer"
      );
    }

    if (
      !settings.clientIds
        .includes(audience) ||
      (
        authorizedParty &&
        !settings.clientIds
          .includes(
            authorizedParty
          )
      )
    ) {
      throw this._error(
        "GOOGLE_TOKEN_AUDIENCE_INVALID",
        "Unexpected Google audience"
      );
    }

    if (
      !subject ||
      subject.length > 255 ||
      !/^[A-Za-z0-9._:-]+$/
        .test(subject)
    ) {
      throw this._error(
        "GOOGLE_CREDENTIAL_INVALID",
        "Invalid Google subject"
      );
    }

    if (
      !Number.isFinite(expiresAt) ||
      expiresAt <=
        now + this.clockSkewSeconds
    ) {
      throw this._error(
        "GOOGLE_TOKEN_EXPIRED",
        "Google token expired"
      );
    }

    if (
      !Number.isFinite(issuedAt) ||
      issuedAt >
        now + this.clockSkewSeconds ||
      now - issuedAt >
        this.maximumTokenAgeSeconds
    ) {
      throw this._error(
        "GOOGLE_TOKEN_TIME_INVALID",
        "Google token issued-at invalid"
      );
    }

    if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email)
    ) {
      throw this._error(
        "GOOGLE_CREDENTIAL_INVALID",
        "Google email invalid"
      );
    }

    if (!this._isTrue(
      claims.email_verified
    )) {
      throw this._error(
        "GOOGLE_EMAIL_UNVERIFIED",
        "Google email is not verified"
      );
    }

    if (
      !this._authoritativeEmail(
        email,
        hostedDomain
      )
    ) {
      throw this._error(
        "GOOGLE_EMAIL_NOT_AUTHORITATIVE",
        "Google is not authoritative for email"
      );
    }

    if (
      settings.hostedDomain &&
      hostedDomain !==
        settings.hostedDomain
    ) {
      throw this._error(
        "GOOGLE_HOSTED_DOMAIN_INVALID",
        "Hosted domain mismatch"
      );
    }

    return {
      provider: "GOOGLE",
      subject,
      email,
      hostedDomain:
        hostedDomain || null,
      audience,
      issuer,
      issuedAt,
      expiresAt,
      verifiedAt:
        new Date().toISOString(),
    };
  },

  authenticate(credential) {
    if (!this.initialized) {
      this.init();
    }

    ExternalHttpConfig
      .assertVerifierConfigured();

    const token =
      String(credential || "")
        .trim();

    if (
      !token ||
      token.length >
        ExternalHttpContract
          .limits.credentialLength ||
      token.split(".").length !== 3
    ) {
      throw this._error(
        "GOOGLE_CREDENTIAL_INVALID",
        "Malformed Google ID token"
      );
    }

    const cached =
      this._cached(token);

    if (cached) {
      return this._validateClaims({
        iss: cached.issuer,
        aud: cached.audience,
        sub: cached.subject,
        email: cached.email,
        email_verified: true,
        hd:
          cached.hostedDomain || "",
        iat: cached.issuedAt,
        exp: cached.expiresAt,
      });
    }

    const identity =
      this._validateClaims(
        this._fetchClaims(token)
      );

    this._storeCache(
      token,
      identity
    );

    return {
      ...identity,
    };
  },

  health() {
    const configuration =
      ExternalHttpConfig.get();

    return {
      module:
        "GoogleIdTokenAuthenticator",
      version: this.version,
      status:
        this.initialized
          ? "OK"
          : "WARNING",
      initialized:
        this.initialized,
      provider: "GOOGLE",
      verifier:
        "TOKENINFO_PILOT",
      productionReady: false,
      rawTokenPersisted: false,
      rawTokenLogged: false,
      clientIdCount:
        configuration
          .clientIds.length,
    };
  },
};

globalThis.GoogleIdTokenAuthenticator =
  GoogleIdTokenAuthenticator;
