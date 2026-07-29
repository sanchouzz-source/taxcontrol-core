// ============================================================
// ExternalHttpContract v1.0.0
// Strict JSON envelope for the pilot Google Apps Script web app
//
// Google Apps Script ContentService cannot reliably expose arbitrary request
// headers or set application-selected HTTP status codes. The adapter therefore
// accepts the short-lived Google ID token only in a bounded JSON body and
// repeats the application status in the JSON response.
// ============================================================

console.log("ExternalHttpContract v1.0.0");

const ExternalHttpContract = {
  version: "1.0.0",
  protocol:
    "taxcontrol.http.v1",
  initialized: false,

  limits: {
    bodyBytes: 49152,
    credentialLength: 8192,
    organizationIdLength: 128,
  },

  requestFields: [
    "protocol",
    "credential",
    "organizationId",
    "request",
  ],

  publicMessages: {
    EXTERNAL_HTTP_DISABLED:
      "Внешний доступ отключён.",
    EXTERNAL_HTTP_CONFIG_UNAVAILABLE:
      "Внешний доступ не настроен.",
    EXTERNAL_HTTP_MODE_INVALID:
      "Внешний доступ настроен некорректно.",
    EXTERNAL_HTTP_VERIFIER_INVALID:
      "Проверка внешней личности не настроена.",
    EXTERNAL_HTTP_CLIENT_IDS_REQUIRED:
      "Клиент внешней аутентификации не настроен.",
    EXTERNAL_AUTH_NOT_CONFIGURED:
      "Внешняя аутентификация не настроена.",
    HTTP_POST_REQUIRED:
      "Поддерживается только HTTPS POST.",
    HTTP_QUERY_FORBIDDEN:
      "Параметры URL запрещены.",
    HTTP_PATH_NOT_FOUND:
      "Запрошенный путь недоступен.",
    HTTP_CONTENT_TYPE_INVALID:
      "Требуется application/json.",
    HTTP_BODY_REQUIRED:
      "Тело запроса отсутствует.",
    HTTP_BODY_TOO_LARGE:
      "Тело запроса превышает допустимый размер.",
    HTTP_JSON_INVALID:
      "Некорректный JSON.",
    HTTP_ENVELOPE_INVALID:
      "Некорректный формат HTTP-запроса.",
    GOOGLE_CREDENTIAL_REQUIRED:
      "Требуется Google ID token.",
    GOOGLE_CREDENTIAL_INVALID:
      "Google ID token недействителен.",
    GOOGLE_TOKEN_VERIFICATION_UNAVAILABLE:
      "Сервис проверки Google временно недоступен.",
    GOOGLE_TOKEN_AUDIENCE_INVALID:
      "Google ID token выпущен для другого приложения.",
    GOOGLE_TOKEN_ISSUER_INVALID:
      "Недопустимый издатель Google ID token.",
    GOOGLE_TOKEN_EXPIRED:
      "Срок действия Google ID token истёк.",
    GOOGLE_TOKEN_TIME_INVALID:
      "Время выпуска Google ID token недопустимо.",
    GOOGLE_EMAIL_UNVERIFIED:
      "Google email не подтверждён.",
    GOOGLE_EMAIL_NOT_AUTHORITATIVE:
      "Этот тип Google-аккаунта нельзя использовать для входа.",
    GOOGLE_HOSTED_DOMAIN_INVALID:
      "Google-аккаунт не относится к разрешённому домену.",
    EXTERNAL_IDENTITY_NOT_LINKED:
      "Google-аккаунт не связан с пользователем ERP.",
    EXTERNAL_IDENTITY_EMAIL_MISMATCH:
      "Google-аккаунт не соответствует связанному пользователю ERP.",
    EXTERNAL_IDENTITY_AMBIGUOUS:
      "Связь Google-аккаунта с ERP неоднозначна.",
    ORGANIZATION_SELECTION_REQUIRED:
      "Необходимо выбрать доступную организацию.",
    CROSS_ORGANIZATION_ACCESS_DENIED:
      "Доступ к другой организации запрещён.",
    EXTERNAL_ACTION_FORBIDDEN:
      "Действие недоступно через внешний канал.",
    EXTERNAL_RATE_LIMITED:
      "Слишком много запросов; повторите позже.",
    EXTERNAL_RATE_LIMIT_UNAVAILABLE:
      "Внешний доступ временно недоступен.",
    EXTERNAL_PRINCIPAL_INVALID:
      "Внешняя личность не подтверждена.",
    EXTERNAL_BINDING_REQUIRES_INTERNAL_SESSION:
      "Привязка доступна только из доверенной сессии ERP.",
    EXTERNAL_BINDING_EMAIL_MISMATCH:
      "Google-аккаунт не совпадает с текущим пользователем ERP.",
    EXTERNAL_BINDING_CONFLICT:
      "Пользователь уже связан с другим Google-аккаунтом.",
    EXTERNAL_BINDING_DUPLICATE:
      "Google-аккаунт уже связан с другим пользователем.",
    INTERNAL_ERROR:
      "Запрос не удалось выполнить.",
  },

  statusByCode: {
    EXTERNAL_HTTP_DISABLED: 503,
    EXTERNAL_HTTP_CONFIG_UNAVAILABLE:
      503,
    EXTERNAL_HTTP_MODE_INVALID: 503,
    EXTERNAL_HTTP_VERIFIER_INVALID:
      503,
    EXTERNAL_HTTP_CLIENT_IDS_REQUIRED:
      503,
    EXTERNAL_AUTH_NOT_CONFIGURED:
      503,
    HTTP_POST_REQUIRED: 405,
    HTTP_QUERY_FORBIDDEN: 400,
    HTTP_PATH_NOT_FOUND: 404,
    HTTP_CONTENT_TYPE_INVALID: 415,
    HTTP_BODY_REQUIRED: 400,
    HTTP_BODY_TOO_LARGE: 413,
    HTTP_JSON_INVALID: 400,
    HTTP_ENVELOPE_INVALID: 400,
    GOOGLE_CREDENTIAL_REQUIRED: 401,
    GOOGLE_CREDENTIAL_INVALID: 401,
    GOOGLE_TOKEN_VERIFICATION_UNAVAILABLE:
      503,
    GOOGLE_TOKEN_AUDIENCE_INVALID: 401,
    GOOGLE_TOKEN_ISSUER_INVALID: 401,
    GOOGLE_TOKEN_EXPIRED: 401,
    GOOGLE_TOKEN_TIME_INVALID: 401,
    GOOGLE_EMAIL_UNVERIFIED: 401,
    GOOGLE_EMAIL_NOT_AUTHORITATIVE:
      401,
    GOOGLE_HOSTED_DOMAIN_INVALID: 403,
    EXTERNAL_IDENTITY_NOT_LINKED: 403,
    EXTERNAL_IDENTITY_EMAIL_MISMATCH:
      403,
    EXTERNAL_IDENTITY_AMBIGUOUS: 403,
    ORGANIZATION_SELECTION_REQUIRED: 409,
    CROSS_ORGANIZATION_ACCESS_DENIED:
      403,
    EXTERNAL_ACTION_FORBIDDEN: 403,
    EXTERNAL_RATE_LIMITED: 429,
    EXTERNAL_RATE_LIMIT_UNAVAILABLE:
      503,
    EXTERNAL_PRINCIPAL_INVALID: 401,
    EXTERNAL_BINDING_REQUIRES_INTERNAL_SESSION:
      403,
    EXTERNAL_BINDING_EMAIL_MISMATCH:
      403,
    EXTERNAL_BINDING_CONFLICT: 409,
    EXTERNAL_BINDING_DUPLICATE: 409,
    INTERNAL_ERROR: 500,
  },

  init() {
    this.initialized = true;
    return true;
  },

  reset() {
    this.initialized = false;
    return true;
  },

  _plainObject(value) {
    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.prototype
        .toString.call(value) ===
        "[object Object]"
    );
  },

  _error(code, internal) {
    const normalized =
      String(
        code || "INTERNAL_ERROR"
      )
        .trim()
        .toUpperCase();
    const error =
      new Error(
        internal || normalized
      );

    error.code = normalized;
    error.serverSafe = true;
    error.publicMessage =
      this.publicMessages[normalized] ||
      this.publicMessages.INTERNAL_ERROR;
    error.httpStatus =
      this.statusByCode[normalized] ||
      500;

    return error;
  },

  error(code, internal) {
    return this._error(
      code,
      internal
    );
  },

  _bytes(value) {
    const source =
      String(value || "");

    if (
      typeof Utilities !==
        "undefined" &&
      typeof Utilities.newBlob ===
        "function"
    ) {
      return Utilities
        .newBlob(source)
        .getBytes()
        .length;
    }

    if (
      typeof TextEncoder !==
        "undefined"
    ) {
      return new TextEncoder()
        .encode(source)
        .length;
    }

    return unescape(
      encodeURIComponent(source)
    ).length;
  },

  _hasRequestParameters(event) {
    if (
      String(
        event.queryString || ""
      ).trim()
    ) {
      return true;
    }

    return [
      event.parameter,
      event.parameters,
    ].some(
      (value) =>
        this._plainObject(value) &&
        Object.keys(value).length > 0
    );
  },

  _normalizeOrganization(value) {
    const organizationId =
      String(value || "").trim();

    if (!organizationId) {
      return null;
    }

    if (
      organizationId.length >
        this.limits
          .organizationIdLength ||
      !/^[A-Za-z0-9_-]+$/
        .test(organizationId)
    ) {
      throw this._error(
        "HTTP_ENVELOPE_INVALID",
        "Invalid organization selector"
      );
    }

    return organizationId;
  },

  parseEvent(event) {
    if (!this.initialized) {
      this.init();
    }

    if (!this._plainObject(event)) {
      throw this._error(
        "HTTP_POST_REQUIRED",
        "Missing doPost event"
      );
    }

    if (
      this._hasRequestParameters(
        event
      )
    ) {
      throw this._error(
        "HTTP_QUERY_FORBIDDEN",
        "Query parameters are forbidden"
      );
    }

    const settings =
      ExternalHttpConfig
        .assertEnabled();
    const path =
      String(
        event.pathInfo || ""
      )
        .trim()
        .replace(/^\/+|\/+$/g, "");

    if (path !== settings.path) {
      throw this._error(
        "HTTP_PATH_NOT_FOUND",
        "Unexpected path"
      );
    }

    const postData =
      event.postData;

    if (
      !postData ||
      typeof postData.contents !==
        "string" ||
      !postData.contents
    ) {
      throw this._error(
        "HTTP_BODY_REQUIRED",
        "Missing POST body"
      );
    }

    const type =
      String(
        postData.type || ""
      )
        .toLowerCase()
        .split(";")[0]
        .trim();

    if (type !== "application/json") {
      throw this._error(
        "HTTP_CONTENT_TYPE_INVALID",
        "Unexpected content type"
      );
    }

    const declaredLength =
      Number(
        event.contentLength ||
        postData.length ||
        0
      );
    const actualLength =
      this._bytes(
        postData.contents
      );

    if (
      actualLength >
        this.limits.bodyBytes ||
      (
        Number.isFinite(
          declaredLength
        ) &&
        declaredLength >
          this.limits.bodyBytes
      )
    ) {
      throw this._error(
        "HTTP_BODY_TOO_LARGE",
        "POST body limit exceeded"
      );
    }

    let decoded;

    try {
      decoded =
        JSON.parse(
          postData.contents
        );
    } catch (error) {
      throw this._error(
        "HTTP_JSON_INVALID",
        "JSON parse failed"
      );
    }

    if (!this._plainObject(decoded)) {
      throw this._error(
        "HTTP_ENVELOPE_INVALID",
        "HTTP body must be an object"
      );
    }

    const unknown =
      Object.keys(decoded)
        .filter(
          (key) =>
            !this.requestFields
              .includes(key)
        );

    if (unknown.length) {
      throw this._error(
        "HTTP_ENVELOPE_INVALID",
        "Unexpected HTTP fields"
      );
    }

    if (
      decoded.protocol !==
        this.protocol
    ) {
      throw this._error(
        "HTTP_ENVELOPE_INVALID",
        "Unsupported HTTP protocol"
      );
    }

    const credential =
      String(
        decoded.credential || ""
      ).trim();

    if (!credential) {
      throw this._error(
        "GOOGLE_CREDENTIAL_REQUIRED",
        "Missing Google credential"
      );
    }

    if (
      credential.length >
        this.limits
          .credentialLength ||
      credential.split(".").length !==
        3
    ) {
      throw this._error(
        "GOOGLE_CREDENTIAL_INVALID",
        "Malformed Google credential"
      );
    }

    if (!this._plainObject(
      decoded.request
    )) {
      throw this._error(
        "HTTP_ENVELOPE_INVALID",
        "Missing RPC request"
      );
    }

    let normalizedRequest;

    try {
      normalizedRequest =
        ServerRequestContract
          .normalize(
            decoded.request
          );
    } catch (error) {
      throw this._error(
        "HTTP_ENVELOPE_INVALID",
        "Nested RPC request invalid"
      );
    }

    return {
      protocol: this.protocol,
      credential,
      organizationId:
        this._normalizeOrganization(
          decoded.organizationId
        ),
      request:
        normalizedRequest,
    };
  },

  classify(error) {
    const code =
      error && error.code
        ? String(error.code)
          .trim()
          .toUpperCase()
        : "";

    if (
      code &&
      this.publicMessages[code]
    ) {
      return {
        code,
        message:
          this.publicMessages[code],
        status:
          this.statusByCode[code] ||
          500,
        retryable:
          [429, 503].includes(
            this.statusByCode[code]
          ),
      };
    }

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

    if (
      token &&
      this.publicMessages[token]
    ) {
      return {
        code: token,
        message:
          this.publicMessages[token],
        status:
          this.statusByCode[token] ||
          500,
        retryable:
          [429, 503].includes(
            this.statusByCode[token]
          ),
      };
    }

    return {
      code: "INTERNAL_ERROR",
      message:
        this.publicMessages
          .INTERNAL_ERROR,
      status: 500,
      retryable: false,
    };
  },

  success(rpcResponse) {
    const status =
      rpcResponse &&
      rpcResponse.ok === true
        ? 200
        : this._rpcStatus(
          rpcResponse
        );

    return {
      ok:
        !!(
          rpcResponse &&
          rpcResponse.ok === true
        ),
      protocol: this.protocol,
      status,
      result:
        rpcResponse || null,
      meta: {
        serverTime:
          new Date().toISOString(),
        transport:
          "GAS_CONTENT_SERVICE",
        actualHttpStatus:
          "PLATFORM_MANAGED",
      },
    };
  },

  _rpcStatus(response) {
    const code =
      response &&
      response.error &&
      response.error.code
        ? response.error.code
        : "INTERNAL_ERROR";

    if (
      code ===
        "AUTHENTICATION_REQUIRED"
    ) {
      return 401;
    }

    if (
      code === "ACCESS_DENIED" ||
      code ===
        "CROSS_ORGANIZATION_ACCESS_DENIED"
    ) {
      return 403;
    }

    if (
      code === "ACTION_NOT_FOUND"
    ) {
      return 404;
    }

    if (
      code ===
        "REQUEST_TOO_LARGE"
    ) {
      return 413;
    }

    if (
      code ===
        "REQUEST_IN_PROGRESS"
    ) {
      return 409;
    }

    return 400;
  },

  failure(error) {
    const classified =
      this.classify(error);

    return {
      ok: false,
      protocol: this.protocol,
      status: classified.status,
      error: {
        code: classified.code,
        message:
          classified.message,
        retryable:
          classified.retryable,
      },
      meta: {
        serverTime:
          new Date().toISOString(),
        transport:
          "GAS_CONTENT_SERVICE",
        actualHttpStatus:
          "PLATFORM_MANAGED",
      },
    };
  },

  textOutput(response) {
    const serialized =
      JSON.stringify(response);

    if (
      typeof ContentService !==
        "undefined" &&
      typeof ContentService
        .createTextOutput ===
        "function"
    ) {
      return ContentService
        .createTextOutput(serialized)
        .setMimeType(
          ContentService
            .MimeType.JSON
        );
    }

    return serialized;
  },

  health() {
    return {
      module:
        "ExternalHttpContract",
      version: this.version,
      status:
        this.initialized
          ? "OK"
          : "WARNING",
      initialized:
        this.initialized,
      protocol: this.protocol,
      bodyBytes:
        this.limits.bodyBytes,
      headersTrusted: false,
      applicationStatusInBody:
        true,
    };
  },
};

globalThis.ExternalHttpContract =
  ExternalHttpContract;
