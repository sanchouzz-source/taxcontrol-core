// ============================================================
// ExternalHttpRateLimiter v1.0.0
// Fail-closed advisory limiter for the pilot GAS HTTP endpoint
//
// GAS web app events do not expose a trustworthy remote IP address. The
// limiter therefore applies both a script-wide window and a credential-hash
// window. It supplements, but does not replace, Google deployment quotas.
// ============================================================

console.log(
  "ExternalHttpRateLimiter v1.0.0"
);

const ExternalHttpRateLimiter = {
  version: "1.0.0",
  initialized: false,
  windowSeconds: 60,
  globalLimit: 120,
  credentialLimit: 30,

  init() {
    if (this.initialized) {
      return true;
    }

    [
      "ExternalHttpContract",
      "GoogleIdTokenAuthenticator",
    ].forEach((name) => {
      if (!globalThis[name]) {
        throw new Error(
          "ExternalHttpRateLimiter requires " +
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

  _cache() {
    if (
      typeof CacheService ===
        "undefined" ||
      typeof CacheService
        .getScriptCache !==
        "function"
    ) {
      throw this._error(
        "EXTERNAL_RATE_LIMIT_UNAVAILABLE",
        "CacheService unavailable"
      );
    }

    return CacheService
      .getScriptCache();
  },

  _lock() {
    if (
      typeof LockService ===
        "undefined" ||
      typeof LockService
        .getScriptLock !==
        "function"
    ) {
      throw this._error(
        "EXTERNAL_RATE_LIMIT_UNAVAILABLE",
        "LockService unavailable"
      );
    }

    return LockService
      .getScriptLock();
  },

  _increment(
    cache,
    key,
    limit
  ) {
    const current =
      Number(cache.get(key) || 0);
    const next =
      Number.isFinite(current)
        ? current + 1
        : 1;

    if (next > limit) {
      throw this._error(
        "EXTERNAL_RATE_LIMITED",
        "External rate limit exceeded"
      );
    }

    cache.put(
      key,
      String(next),
      this.windowSeconds + 10
    );

    return next;
  },

  check(credential) {
    if (!this.initialized) {
      this.init();
    }

    const fingerprint =
      GoogleIdTokenAuthenticator
        .fingerprint(credential);
    const window =
      Math.floor(
        Date.now() /
        (
          this.windowSeconds *
          1000
        )
      );
    const globalKey =
      "TAXCONTROL_HTTP_GLOBAL_" +
      window;
    const credentialKey =
      "TAXCONTROL_HTTP_CREDENTIAL_" +
      fingerprint +
      "_" +
      window;
    const cache = this._cache();
    const lock = this._lock();

    if (
      typeof lock.tryLock !==
        "function" ||
      lock.tryLock(1000) !== true
    ) {
      throw this._error(
        "EXTERNAL_RATE_LIMIT_UNAVAILABLE",
        "Rate limiter lock unavailable"
      );
    }

    try {
      return {
        global:
          this._increment(
            cache,
            globalKey,
            this.globalLimit
          ),
        credential:
          this._increment(
            cache,
            credentialKey,
            this.credentialLimit
          ),
        window,
      };
    } finally {
      if (
        typeof lock.releaseLock ===
          "function"
      ) {
        lock.releaseLock();
      }
    }
  },

  health() {
    return {
      module:
        "ExternalHttpRateLimiter",
      version: this.version,
      status:
        this.initialized
          ? "OK"
          : "WARNING",
      initialized:
        this.initialized,
      windowSeconds:
        this.windowSeconds,
      globalLimit:
        this.globalLimit,
      credentialLimit:
        this.credentialLimit,
      remoteIpAvailable: false,
      failClosed: true,
    };
  },
};

globalThis.ExternalHttpRateLimiter =
  ExternalHttpRateLimiter;
