// ============================================================
// ServerIdempotencyStore v1.0.0
// Persistent replay protection for trusted GAS RPC commands
//
// The store keeps only hashed principal/action keys. A short ScriptLock
// protects reservation and completion records; the lock is released before
// the business service runs so nested service locks cannot deadlock.
// Runtime reset never deletes valid replay records.
// ============================================================

console.log("ServerIdempotencyStore v1.0.0");

const ServerIdempotencyStore = {
  version: "1.0.0",
  initialized: false,
  prefix:
    "TAXCONTROL_RPC_IDEMPOTENCY_V1_",
  lockTimeoutMs: 5000,
  inProgressTtlMs: 5 * 60 * 1000,
  completedTtlMs:
    24 * 60 * 60 * 1000,
  maxRecordBytes: 8000,

  init() {
    if (this.initialized) {
      return true;
    }

    if (
      typeof ServerRequestContract ===
        "undefined" ||
      typeof ServerRequestContract
        .stableStringify !==
        "function"
    ) {
      throw new Error(
        "ServerIdempotencyStore requires ServerRequestContract"
      );
    }

    if (
      typeof PropertiesService ===
        "undefined" ||
      typeof PropertiesService
        .getScriptProperties !==
        "function"
    ) {
      throw new Error(
        "ServerIdempotencyStore requires PropertiesService"
      );
    }

    if (
      typeof LockService ===
        "undefined" ||
      typeof LockService
        .getScriptLock !==
        "function"
    ) {
      throw new Error(
        "ServerIdempotencyStore requires LockService"
      );
    }

    if (
      typeof Utilities ===
        "undefined" ||
      typeof Utilities
        .computeDigest !==
        "function"
    ) {
      throw new Error(
        "ServerIdempotencyStore requires Utilities.computeDigest"
      );
    }

    this.initialized = true;
    return true;
  },

  reset() {
    /*
     * Persisted reservations intentionally survive resetERP(). Otherwise a
     * transport retry after reset could execute the same command twice.
     */
    this.initialized = false;
    return true;
  },

  _assertReady() {
    if (!this.initialized) {
      this.init();
    }

    return true;
  },

  _store() {
    this._assertReady();

    return PropertiesService
      .getScriptProperties();
  },

  _lock() {
    this._assertReady();

    return LockService
      .getScriptLock();
  },

  _withLock(callback) {
    const lock = this._lock();

    if (
      !lock ||
      typeof lock.tryLock !==
        "function" ||
      !lock.tryLock(
        this.lockTimeoutMs
      )
    ) {
      throw ServerRequestContract.error(
        "REQUEST_IN_PROGRESS",
        "Idempotency lock unavailable",
        {
          retryable: true,
        }
      );
    }

    try {
      return callback();
    } finally {
      if (
        typeof lock.releaseLock ===
          "function"
      ) {
        lock.releaseLock();
      }
    }
  },

  _hash(value) {
    const algorithm =
      Utilities.DigestAlgorithm
        ? Utilities
          .DigestAlgorithm
          .SHA_256
        : "SHA_256";
    const charset =
      Utilities.Charset
        ? Utilities.Charset.UTF_8
        : undefined;
    const digest =
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

    return digest
      .map((byte) => {
        const normalized =
          (Number(byte) + 256) %
          256;

        return normalized
          .toString(16)
          .padStart(2, "0");
      })
      .join("");
  },

  _identity(context) {
    if (
      !context ||
      typeof context !== "object" ||
      context.System === true ||
      context.Role === "SYSTEM"
    ) {
      throw ServerRequestContract.error(
        "AUTHENTICATION_REQUIRED",
        "Human principal required"
      );
    }

    const userId =
      String(
        context.UserID || ""
      ).trim();
    const organizationId =
      String(
        context.OrganizationID || ""
      ).trim();

    if (!userId || !organizationId) {
      throw ServerRequestContract.error(
        "AUTHENTICATION_REQUIRED",
        "Principal identifiers missing"
      );
    }

    return {
      userId,
      organizationId,
    };
  },

  _fingerprint(request, payload) {
    return this._hash(
      ServerRequestContract
        .stableStringify({
          protocol:
            request.protocol,
          action: request.action,
          payload,
        })
    );
  },

  _key(context, request) {
    const identity =
      this._identity(context);
    const source = [
      identity.userId,
      identity.organizationId,
      request.action,
      request.idempotencyKey,
    ].join("\n");

    return (
      this.prefix +
      this._hash(source)
    );
  },

  _read(store, key) {
    const raw =
      store.getProperty(key);

    if (!raw) {
      return null;
    }

    try {
      const parsed =
        JSON.parse(raw);

      if (
        !parsed ||
        typeof parsed !== "object"
      ) {
        return null;
      }

      return parsed;
    } catch (error) {
      return null;
    }
  },

  _write(store, key, record) {
    const serialized =
      JSON.stringify(record);

    if (
      ServerRequestContract
        .byteLength(serialized) >
      this.maxRecordBytes
    ) {
      return false;
    }

    store.setProperty(
      key,
      serialized
    );

    return true;
  },

  claim(
    context,
    request,
    payload
  ) {
    this._assertReady();

    if (!request.idempotencyKey) {
      throw ServerRequestContract.error(
        "IDEMPOTENCY_REQUIRED",
        "Mutation requires idempotencyKey"
      );
    }

    const key =
      this._key(context, request);
    const fingerprint =
      this._fingerprint(
        request,
        payload
      );
    const now = Date.now();

    return this._withLock(() => {
      const store = this._store();
      let existing =
        this._read(store, key);

      if (
        existing &&
        Number(
          existing.expiresAt || 0
        ) <= now
      ) {
        store.deleteProperty(key);
        existing = null;
      }

      if (existing) {
        if (
          existing.fingerprint !==
          fingerprint
        ) {
          throw ServerRequestContract.error(
            "IDEMPOTENCY_CONFLICT",
            "Idempotency payload fingerprint mismatch"
          );
        }

        if (
          existing.status ===
            "COMPLETED" &&
          existing.response
        ) {
          return {
            state: "REPLAY",
            key,
            fingerprint,
            response:
              ServerRequestContract
                .sanitize(
                  existing.response,
                  "storedResponse"
                ),
          };
        }

        if (
          existing.status ===
            "COMPLETED_NO_RESPONSE"
        ) {
          throw ServerRequestContract.error(
            "IDEMPOTENCY_REPLAY_UNAVAILABLE",
            "Mutation completed without replayable response"
          );
        }

        throw ServerRequestContract.error(
          "REQUEST_IN_PROGRESS",
          "Idempotent request already in progress",
          {
            retryable: true,
          }
        );
      }

      const record = {
        status: "IN_PROGRESS",
        fingerprint,
        createdAt: now,
        expiresAt:
          now +
          this.inProgressTtlMs,
      };

      if (
        !this._write(
          store,
          key,
          record
        )
      ) {
        throw new Error(
          "Idempotency reservation is too large"
        );
      }

      return {
        state: "CLAIMED",
        key,
        fingerprint,
      };
    });
  },

  complete(claim, response) {
    if (
      !claim ||
      claim.state !== "CLAIMED"
    ) {
      throw new Error(
        "Invalid idempotency claim"
      );
    }

    const now = Date.now();

    return this._withLock(() => {
      const store = this._store();
      const existing =
        this._read(
          store,
          claim.key
        );

      if (
        !existing ||
        existing.status !==
          "IN_PROGRESS" ||
        existing.fingerprint !==
          claim.fingerprint
      ) {
        throw new Error(
          "Idempotency reservation lost"
        );
      }

      const completed = {
        status: "COMPLETED",
        fingerprint:
          claim.fingerprint,
        createdAt:
          existing.createdAt ||
          now,
        completedAt: now,
        expiresAt:
          now +
          this.completedTtlMs,
        response:
          ServerRequestContract
            .sanitize(
              response,
              "idempotentResponse"
            ),
      };

      if (
        this._write(
          store,
          claim.key,
          completed
        )
      ) {
        return {
          stored: true,
          replayable: true,
        };
      }

      const marker = {
        status:
          "COMPLETED_NO_RESPONSE",
        fingerprint:
          claim.fingerprint,
        createdAt:
          existing.createdAt ||
          now,
        completedAt: now,
        expiresAt:
          now +
          this.completedTtlMs,
      };

      store.setProperty(
        claim.key,
        JSON.stringify(marker)
      );

      return {
        stored: true,
        replayable: false,
      };
    });
  },

  abort(claim) {
    if (
      !claim ||
      claim.state !== "CLAIMED"
    ) {
      return false;
    }

    return this._withLock(() => {
      const store = this._store();
      const existing =
        this._read(
          store,
          claim.key
        );

      if (
        existing &&
        existing.status ===
          "IN_PROGRESS" &&
        existing.fingerprint ===
          claim.fingerprint
      ) {
        store.deleteProperty(
          claim.key
        );
        return true;
      }

      return false;
    });
  },

  purgeExpired(limit = 50) {
    const maximum =
      Math.max(
        1,
        Math.min(
          Number(limit) || 50,
          200
        )
      );
    const now = Date.now();

    return this._withLock(() => {
      const store = this._store();
      const properties =
        store.getProperties();
      let removed = 0;

      Object.keys(properties)
        .filter(
          (key) =>
            key.indexOf(
              this.prefix
            ) === 0
        )
        .forEach((key) => {
          if (removed >= maximum) {
            return;
          }

          let record = null;

          try {
            record =
              JSON.parse(
                properties[key]
              );
          } catch (error) {
            // Invalid records are safe to remove.
          }

          if (
            !record ||
            Number(
              record.expiresAt || 0
            ) <= now
          ) {
            store.deleteProperty(
              key
            );
            removed++;
          }
        });

      return removed;
    });
  },

  health() {
    return {
      module:
        "ServerIdempotencyStore",
      version: this.version,
      status:
        this.initialized
          ? "OK"
          : "WARNING",
      initialized:
        this.initialized,
      persistence:
        "ScriptProperties",
      lock:
        "ScriptLock",
      completedTtlHours:
        this.completedTtlMs /
        (60 * 60 * 1000),
      resetPreservesRecords: true,
    };
  },
};

globalThis.ServerIdempotencyStore =
  ServerIdempotencyStore;
