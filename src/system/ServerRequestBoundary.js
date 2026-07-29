// ============================================================
// ServerRequestBoundary v1.0.0
// Trusted server boundary for container-bound GAS RPC
//
// This component does not expose doGet/doPost and does not authenticate
// external mobile clients. Every request is resolved through the current
// Google account and Users directory by TrustedEntryPoints.
// ============================================================

console.log("ServerRequestBoundary v1.0.0");

const ServerRequestBoundary = {
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
      "ServerRequestContract",
      "ServerIdempotencyStore",
      "ServerActionRegistry",
      "TrustedEntryPoints",
      "SecurityContext",
      "SecurityGuard",
    ].forEach((name) => {
      if (!globalThis[name]) {
        throw new Error(
          "ServerRequestBoundary requires " +
            name
        );
      }
    });

    if (
      ServerRequestContract
        .initialized !== true ||
      ServerIdempotencyStore
        .initialized !== true ||
      ServerActionRegistry
        .initialized !== true ||
      TrustedEntryPoints
        .initialized !== true
    ) {
      throw new Error(
        "ServerRequestBoundary dependencies are not initialized"
      );
    }

    this.initialized = true;

    Logger.log(
      "ServerRequestBoundary READY v" +
        this.version
    );

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

  _logFailure(
    request,
    error,
    publicCode
  ) {
    const safeLogValue = (
      value,
      maximum
    ) =>
      String(value || "UNKNOWN")
        .replace(
          /[\u0000-\u001F\u007F]+/g,
          " "
        )
        .slice(0, maximum);
    const requestId =
      safeLogValue(
        request &&
        request.requestId,
        96
      );
    const action =
      safeLogValue(
        request &&
        request.action,
        80
      );
    const internalMessage =
      safeLogValue(
        error && error.message
          ? error.message
          : error,
        1000
      );

    if (
      typeof Logger !==
        "undefined" &&
      typeof Logger.error ===
        "function"
    ) {
      Logger.error(
        "SERVER REQUEST FAILED" +
          " requestId=" +
          requestId +
          " action=" +
          action +
          " code=" +
          publicCode +
          " internal=" +
          internalMessage
      );
    }

    return true;
  },

  _executeCommand(
    route,
    request,
    payload,
    context
  ) {
    const claim =
      ServerIdempotencyStore.claim(
        context,
        request,
        payload
      );

    if (claim.state === "REPLAY") {
      return ServerRequestContract
        .markReplayed(
          claim.response
        );
    }

    let data;

    try {
      data =
        ServerActionRegistry
          .execute(
            route,
            payload,
            context
          );
    } catch (error) {
      try {
        ServerIdempotencyStore
          .abort(claim);
      } catch (abortError) {
        if (
          typeof Logger !==
            "undefined" &&
          typeof Logger.warn ===
            "function"
        ) {
          Logger.warn(
            "Idempotency reservation cleanup failed requestId=" +
              request.requestId +
              " internal=" +
              abortError.message
          );
        }
      }

      throw error;
    }

    const response =
      ServerRequestContract.success(
        request,
        data
      );

    ServerIdempotencyStore
      .complete(
        claim,
        response
      );

    return response;
  },

  _executeRequest(
    request,
    context
  ) {
    const route =
      ServerActionRegistry.get(
        request.action
      );
    const payload =
      ServerActionRegistry
        .validatePayload(
          route,
          request.payload
        );

    /*
     * Permission belongs to the route. It is checked before an idempotency
     * reservation is written, so an unauthorized request leaves no state.
     */
    ServerActionRegistry
      .authorize(route);

    if (
      route.mode === "COMMAND"
    ) {
      return this._executeCommand(
        route,
        request,
        payload,
        context
      );
    }

    const data =
      ServerActionRegistry.execute(
        route,
        payload,
        context
      );

    return ServerRequestContract
      .success(
        request,
        data
      );
  },

  handle(rawRequest) {
    let request = null;

    try {
      /*
       * The bounded envelope is validated before ERP startup. Malformed input
       * therefore cannot force a full boot or reach identity resolution.
       */
      request =
        ServerRequestContract
          .normalize(
            rawRequest
          );

      this._ensureStarted();

      if (!this.initialized) {
        this.init();
      }

      const response =
        TrustedEntryPoints.run(
          {
            label:
              "Server RPC " +
              request.action,
          },
          (context) =>
            this._executeRequest(
              request,
              context
            )
        );

      this._assertSync(
        response,
        "Server RPC response"
      );

      this.handled++;
      this.lastRequestAt =
        new Date().toISOString();

      return response;
    } catch (error) {
      const classified =
        ServerRequestContract
          .classify(error);

      this.failed++;
      this.lastRequestAt =
        new Date().toISOString();

      this._logFailure(
        request || rawRequest,
        error,
        classified.code
      );

      return ServerRequestContract
        .failure(
          request || rawRequest,
          error
        );
    } finally {
      /*
       * TrustedEntryPoints.runAs() restores its previous context. This final
       * check is intentionally not a forced clear because a trusted nested
       * server call may have had an outer context which must be restored.
       */
    }
  },

  health() {
    return {
      module:
        "ServerRequestBoundary",
      version: this.version,
      status:
        this.initialized &&
        ServerActionRegistry
          .initialized === true &&
        ServerIdempotencyStore
          .initialized === true
          ? "OK"
          : "WARNING",
      initialized:
        this.initialized,
      protocol:
        ServerRequestContract
          .protocol,
      actions:
        ServerActionRegistry
          .initialized
          ? ServerActionRegistry
            .count()
          : 0,
      handled: this.handled,
      failed: this.failed,
      lastRequestAt:
        this.lastRequestAt,
      trustedRpcEnabled: true,
      publicHttpEnabled: false,
      externalTokenAuthEnabled:
        false,
      arbitraryPrincipalInput:
        false,
      arbitraryFunctionDispatch:
        false,
    };
  },
};

/*
 * The only new top-level callable server function in Package J.
 * It remains inaccessible over HTTP because no doGet/doPost is installed.
 */
function runERPServerRequest(
  request
) {
  return ServerRequestBoundary
    .handle(request);
}

globalThis.ServerRequestBoundary =
  ServerRequestBoundary;
