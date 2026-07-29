// ============================================================
// ServerRequestContract v1.0.0
// Canonical request/response contract for trusted GAS RPC
//
// Security rules:
// - one fixed protocol version;
// - strict top-level and payload shapes;
// - bounded depth, key count, string length and serialized size;
// - prototype-pollution keys and executable values are rejected;
// - errors returned to a client never contain stack traces or raw internals.
// ============================================================

console.log("ServerRequestContract v1.0.0");

const ServerRequestContract = {
  version: "1.0.0",
  protocol: "taxcontrol.rpc.v1",
  initialized: false,

  limits: {
    requestBytes: 32768,
    responseBytes: 65536,
    maxDepth: 8,
    maxKeys: 256,
    maxArrayLength: 100,
    maxStringLength: 16000,
    maxKeyLength: 64,
  },

  requestFields: [
    "protocol",
    "requestId",
    "action",
    "payload",
    "idempotencyKey",
  ],

  forbiddenKeys: [
    "__proto__",
    "prototype",
    "constructor",
  ],

  publicMessages: {
    AUTHENTICATION_REQUIRED:
      "Требуется вход через разрешённый Google-аккаунт.",
    ACCESS_DENIED:
      "Недостаточно прав для выполнения действия.",
    ACTION_NOT_FOUND:
      "Запрошенное действие недоступно.",
    REQUEST_INVALID:
      "Некорректный формат запроса.",
    REQUEST_TOO_LARGE:
      "Запрос превышает допустимый размер.",
    RESPONSE_TOO_LARGE:
      "Ответ превышает допустимый размер.",
    PAYLOAD_INVALID:
      "Некорректные данные запроса.",
    PAYLOAD_FIELDS_FORBIDDEN:
      "Запрос содержит недопустимые поля.",
    IDEMPOTENCY_REQUIRED:
      "Для изменяющего действия требуется ключ идемпотентности.",
    IDEMPOTENCY_CONFLICT:
      "Ключ идемпотентности уже использован для другого запроса.",
    REQUEST_IN_PROGRESS:
      "Запрос с этим ключом уже выполняется.",
    IDEMPOTENCY_REPLAY_UNAVAILABLE:
      "Действие уже выполнено; проверьте текущее состояние данных.",
    USER_EMAIL_INVALID:
      "Указан некорректный email.",
    USER_NAME_TOO_LONG:
      "Имя пользователя слишком длинное.",
    USER_ROLE_INVALID:
      "Указана недопустимая роль.",
    USER_ID_REQUIRED:
      "Не указан идентификатор пользователя.",
    USER_MEMBERSHIP_NOT_FOUND:
      "Членство пользователя не найдено.",
    USER_MEMBERSHIP_ADMIN_REQUIRED:
      "Управление пользователями доступно только администратору или директору.",
    HUMAN_ADMIN_CONTEXT_REQUIRED:
      "Для операции требуется личный административный доступ.",
    CROSS_ORGANIZATION_ACCESS_DENIED:
      "Доступ к другой организации запрещён.",
    ACTOR_MEMBERSHIP_STALE:
      "Права текущего администратора изменились; повторите вход.",
    SELF_ROLE_CHANGE_DENIED:
      "Нельзя изменить собственную роль.",
    SELF_DEACTIVATION_DENIED:
      "Нельзя отключить собственное членство.",
    LAST_PRIVILEGED_MEMBERSHIP_PROTECTED:
      "Нельзя отключить или понизить последнего администратора организации.",
    MEMBERSHIP_ALREADY_EXISTS:
      "Членство с таким email уже существует.",
    ACTIVE_MEMBERSHIP_DUPLICATE:
      "Активное членство с таким email уже существует.",
    MEMBERSHIP_UPDATE_EMPTY:
      "Не указаны изменения пользователя.",
    MEMBERSHIP_DELETED_USE_REACTIVATE:
      "Удалённое членство следует восстановить.",
    USER_MEMBERSHIP_LOCK_UNAVAILABLE:
      "Данные пользователей временно заняты; повторите запрос.",
    INTERNAL_ERROR:
      "Запрос не удалось выполнить.",
  },

  init() {
    this.initialized = true;
    return true;
  },

  reset() {
    this.initialized = false;
    return true;
  },

  _assertReady() {
    if (!this.initialized) {
      this.init();
    }

    return true;
  },

  _utf8Bytes(value) {
    const source = String(value || "");

    if (
      typeof Utilities !== "undefined" &&
      typeof Utilities.newBlob === "function"
    ) {
      return Utilities
        .newBlob(source)
        .getBytes()
        .length;
    }

    /*
     * Node-based contract tests use TextEncoder. The final fallback is
     * conservative for ASCII protocol fields and never undercounts UTF-16
     * surrogate pairs in normal request data.
     */
    if (typeof TextEncoder !== "undefined") {
      return new TextEncoder()
        .encode(source)
        .length;
    }

    return unescape(
      encodeURIComponent(source)
    ).length;
  },

  byteLength(value) {
    return this._utf8Bytes(
      value
    );
  },

  _isObject(value) {
    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.prototype
        .toString.call(value) ===
        "[object Object]"
    );
  },

  _error(
    code,
    internalMessage,
    options = {}
  ) {
    const normalized =
      String(code || "INTERNAL_ERROR")
        .trim()
        .toUpperCase();
    const error = new Error(
      internalMessage ||
      normalized
    );

    error.code = normalized;
    error.serverSafe =
      true;
    error.publicMessage =
      options.publicMessage ||
      this.publicMessages[normalized] ||
      this.publicMessages.INTERNAL_ERROR;
    error.retryable =
      options.retryable === true;

    if (
      options.details &&
      this._isObject(options.details)
    ) {
      error.publicDetails =
        options.details;
    }

    return error;
  },

  error(
    code,
    internalMessage,
    options = {}
  ) {
    return this._error(
      code,
      internalMessage,
      options
    );
  },

  _assertAllowedKeys(
    value,
    allowed,
    label,
    code
  ) {
    const unknown =
      Object.keys(value)
        .filter(
          (key) =>
            !allowed.includes(key)
        );

    if (unknown.length) {
      throw this._error(
        code ||
          "PAYLOAD_FIELDS_FORBIDDEN",
        label +
          " contains forbidden fields: " +
          unknown.join(", ")
      );
    }

    return true;
  },

  _sanitize(
    value,
    path,
    depth,
    state
  ) {
    if (depth > this.limits.maxDepth) {
      throw this._error(
        "REQUEST_INVALID",
        "Maximum object depth exceeded at " +
          path
      );
    }

    if (
      value === null ||
      typeof value === "boolean"
    ) {
      return value;
    }

    if (typeof value === "string") {
      if (
        value.length >
        this.limits.maxStringLength
      ) {
        throw this._error(
          "REQUEST_INVALID",
          "String too long at " + path
        );
      }

      return value;
    }

    if (typeof value === "number") {
      if (!Number.isFinite(value)) {
        throw this._error(
          "REQUEST_INVALID",
          "Non-finite number at " + path
        );
      }

      return value;
    }

    if (
      typeof value === "undefined" ||
      typeof value === "function" ||
      typeof value === "symbol" ||
      typeof value === "bigint"
    ) {
      throw this._error(
        "REQUEST_INVALID",
        "Unsupported value at " + path
      );
    }

    if (
      Object.prototype
        .toString.call(value) ===
        "[object Date]"
    ) {
      if (
        typeof value.getTime !==
          "function" ||
        !Number.isFinite(value.getTime())
      ) {
        throw this._error(
          "REQUEST_INVALID",
          "Invalid date at " + path
        );
      }

      return value.toISOString();
    }

    if (
      state.seen.indexOf(value) !== -1
    ) {
      throw this._error(
        "REQUEST_INVALID",
        "Circular value at " + path
      );
    }

    state.seen.push(value);

    try {
      if (Array.isArray(value)) {
        if (
          value.length >
          this.limits.maxArrayLength
        ) {
          throw this._error(
            "REQUEST_INVALID",
            "Array too long at " + path
          );
        }

        return value.map(
          (item, index) =>
            this._sanitize(
              item,
              path + "[" + index + "]",
              depth + 1,
              state
            )
        );
      }

      if (!this._isObject(value)) {
        throw this._error(
          "REQUEST_INVALID",
          "Non-plain object at " + path
        );
      }

      const result = {};

      Object.keys(value).forEach((key) => {
        state.keys++;

        if (
          state.keys >
          this.limits.maxKeys
        ) {
          throw this._error(
            "REQUEST_INVALID",
            "Maximum key count exceeded"
          );
        }

        if (
          !key ||
          key.length >
            this.limits.maxKeyLength ||
          /[\u0000-\u001F\u007F]/.test(
            key
          ) ||
          this.forbiddenKeys.includes(
            key
          )
        ) {
          throw this._error(
            "REQUEST_INVALID",
            "Forbidden key at " +
              path
          );
        }

        result[key] =
          this._sanitize(
            value[key],
            path + "." + key,
            depth + 1,
            state
          );
      });

      return result;
    } finally {
      state.seen.pop();
    }
  },

  sanitize(value, label = "value") {
    this._assertReady();

    return this._sanitize(
      value,
      label,
      0,
      {
        keys: 0,
        seen: [],
      }
    );
  },

  _validateRequestId(value) {
    const requestId =
      String(value || "").trim();

    if (
      !/^[A-Za-z0-9][A-Za-z0-9._:-]{7,95}$/
        .test(requestId)
    ) {
      throw this._error(
        "REQUEST_INVALID",
        "Invalid requestId"
      );
    }

    return requestId;
  },

  _validateAction(value) {
    const action =
      String(value || "")
        .trim()
        .toUpperCase();

    if (
      !/^[A-Z][A-Z0-9_.]{2,79}$/
        .test(action)
    ) {
      throw this._error(
        "REQUEST_INVALID",
        "Invalid action"
      );
    }

    return action;
  },

  _validateIdempotencyKey(value) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return null;
    }

    const key =
      String(value).trim();

    if (
      !/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/
        .test(key)
    ) {
      throw this._error(
        "REQUEST_INVALID",
        "Invalid idempotencyKey"
      );
    }

    return key;
  },

  normalize(request) {
    this._assertReady();

    if (!this._isObject(request)) {
      throw this._error(
        "REQUEST_INVALID",
        "Request must be a plain object"
      );
    }

    this._assertAllowedKeys(
      request,
      this.requestFields,
      "Request",
      "REQUEST_INVALID"
    );

    if (
      request.protocol !==
        this.protocol
    ) {
      throw this._error(
        "REQUEST_INVALID",
        "Unsupported protocol"
      );
    }

    const normalized = {
      protocol: this.protocol,
      requestId:
        this._validateRequestId(
          request.requestId
        ),
      action:
        this._validateAction(
          request.action
        ),
      payload:
        request.payload ===
          undefined
          ? {}
          : this.sanitize(
            request.payload,
            "payload"
          ),
      idempotencyKey:
        this._validateIdempotencyKey(
          request.idempotencyKey
        ),
    };

    if (!this._isObject(
      normalized.payload
    )) {
      throw this._error(
        "PAYLOAD_INVALID",
        "Payload must be a plain object"
      );
    }

    const serialized =
      JSON.stringify(normalized);

    if (
      this._utf8Bytes(serialized) >
      this.limits.requestBytes
    ) {
      throw this._error(
        "REQUEST_TOO_LARGE",
        "Request byte limit exceeded"
      );
    }

    return normalized;
  },

  stableStringify(value) {
    const normalized =
      this.sanitize(
        value,
        "fingerprint"
      );

    const encode = (item) => {
      if (Array.isArray(item)) {
        return (
          "[" +
          item.map(encode).join(",") +
          "]"
        );
      }

      if (this._isObject(item)) {
        return (
          "{" +
          Object.keys(item)
            .sort()
            .map(
              (key) =>
                JSON.stringify(key) +
                ":" +
                encode(item[key])
            )
            .join(",") +
          "}"
        );
      }

      return JSON.stringify(item);
    };

    return encode(normalized);
  },

  success(
    request,
    data,
    meta = {}
  ) {
    const response = {
      ok: true,
      protocol: this.protocol,
      requestId:
        request.requestId,
      action: request.action,
      data:
        data === undefined
          ? null
          : this.sanitize(
            data,
            "response.data"
          ),
      meta: this.sanitize(
        {
          serverTime:
            new Date().toISOString(),
          replayed:
            meta.replayed === true,
        },
        "response.meta"
      ),
    };

    if (
      this._utf8Bytes(
        JSON.stringify(response)
      ) >
      this.limits.responseBytes
    ) {
      throw this._error(
        "RESPONSE_TOO_LARGE",
        "Response byte limit exceeded"
      );
    }

    return response;
  },

  _safeEcho(request, field, validator) {
    try {
      if (
        !request ||
        typeof request !== "object"
      ) {
        return null;
      }

      return validator.call(
        this,
        request[field]
      );
    } catch (error) {
      return null;
    }
  },

  _serviceCode(error) {
    const message =
      error && error.message
        ? String(error.message)
        : "";
    const token =
      (
        message.match(
          /^([A-Z][A-Z0-9_]+)/
        ) || []
      )[1] || "";
    const allowed = [
      "USER_EMAIL_INVALID",
      "USER_NAME_TOO_LONG",
      "USER_ROLE_INVALID",
      "USER_ID_REQUIRED",
      "USER_MEMBERSHIP_NOT_FOUND",
      "USER_MEMBERSHIP_ADMIN_REQUIRED",
      "HUMAN_ADMIN_CONTEXT_REQUIRED",
      "CROSS_ORGANIZATION_ACCESS_DENIED",
      "ACTOR_MEMBERSHIP_STALE",
      "SELF_ROLE_CHANGE_DENIED",
      "SELF_DEACTIVATION_DENIED",
      "LAST_PRIVILEGED_MEMBERSHIP_PROTECTED",
      "MEMBERSHIP_ALREADY_EXISTS",
      "ACTIVE_MEMBERSHIP_DUPLICATE",
      "MEMBERSHIP_UPDATE_EMPTY",
      "MEMBERSHIP_DELETED_USE_REACTIVATE",
      "USER_MEMBERSHIP_LOCK_UNAVAILABLE",
    ];

    return allowed.includes(token)
      ? token
      : "";
  },

  classify(error) {
    if (
      error &&
      error.code &&
      this.publicMessages[
        String(error.code)
          .toUpperCase()
      ]
    ) {
      return {
        code:
          String(error.code)
            .toUpperCase(),
        message:
          error.serverSafe === true &&
          error.publicMessage
            ? error.publicMessage
            :
          this.publicMessages[
            String(error.code)
              .toUpperCase()
          ],
        retryable:
          error.retryable === true,
        details:
          error.serverSafe === true
            ? error.publicDetails ||
              null
            : null,
      };
    }

    const message =
      error && error.message
        ? String(error.message)
        : String(error || "");
    const serviceCode =
      this._serviceCode(error);

    if (serviceCode) {
      return {
        code: serviceCode,
        message:
          this.publicMessages[
            serviceCode
          ],
        retryable:
          serviceCode ===
          "USER_MEMBERSHIP_LOCK_UNAVAILABLE",
        details: null,
      };
    }

    if (
      /AUTHENTICATION REQUIRED|TRUSTED_IDENTITY_UNAVAILABLE|ACCESS_DENIED: no active USER/i
        .test(message)
    ) {
      return {
        code:
          "AUTHENTICATION_REQUIRED",
        message:
          this.publicMessages
            .AUTHENTICATION_REQUIRED,
        retryable: false,
        details: null,
      };
    }

    if (
      /ACCESS DENIED|CROSS_ORGANIZATION|HUMAN_ADMIN_CONTEXT_REQUIRED|USER_MEMBERSHIP_ADMIN_REQUIRED/i
        .test(message)
    ) {
      return {
        code: "ACCESS_DENIED",
        message:
          this.publicMessages
            .ACCESS_DENIED,
        retryable: false,
        details: null,
      };
    }

    return {
      code: "INTERNAL_ERROR",
      message:
        this.publicMessages
          .INTERNAL_ERROR,
      retryable: false,
      details: null,
    };
  },

  failure(request, error) {
    const classified =
      this.classify(error);
    const details =
      classified.details
        ? this.sanitize(
          classified.details,
          "error.details"
        )
        : undefined;
    const response = {
      ok: false,
      protocol: this.protocol,
      requestId:
        this._safeEcho(
          request,
          "requestId",
          this._validateRequestId
        ),
      action:
        this._safeEcho(
          request,
          "action",
          this._validateAction
        ),
      error: {
        code: classified.code,
        message:
          classified.message,
        retryable:
          classified.retryable ===
          true,
        ...(details
          ? { details }
          : {}),
      },
      meta: {
        serverTime:
          new Date().toISOString(),
      },
    };

    return response;
  },

  markReplayed(response) {
    const clone =
      this.sanitize(
        response,
        "replayedResponse"
      );

    clone.meta =
      clone.meta || {};
    clone.meta.replayed = true;
    clone.meta.replayedAt =
      new Date().toISOString();

    return clone;
  },

  health() {
    return {
      module:
        "ServerRequestContract",
      version: this.version,
      status:
        this.initialized
          ? "OK"
          : "WARNING",
      initialized:
        this.initialized,
      protocol: this.protocol,
      requestBytes:
        this.limits.requestBytes,
      responseBytes:
        this.limits.responseBytes,
    };
  },
};

globalThis.ServerRequestContract =
  ServerRequestContract;
