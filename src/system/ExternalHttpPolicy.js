// ============================================================
// ExternalHttpPolicy v1.0.0
// Fixed read-only action policy for the pilot external transport
// ============================================================

console.log("ExternalHttpPolicy v1.0.0");

const ExternalHttpPolicy = {
  version: "1.0.0",
  initialized: false,

  actions: [
    "IDENTITY.CURRENT",
    "SYSTEM.HEALTH",
    "USER.MEMBERSHIP.LIST",
    "USER.MEMBERSHIP.GET",
  ],

  init() {
    if (this.initialized) {
      return true;
    }

    if (
      !globalThis
        .ServerActionRegistry ||
      !globalThis
        .ExternalHttpContract
    ) {
      throw new Error(
        "ExternalHttpPolicy dependencies unavailable"
      );
    }

    this.actions.forEach(
      (action) => {
        const route =
          ServerActionRegistry
            .get(action);

        if (
          !route ||
          route.mode !== "QUERY" ||
          route
            .requiresIdempotency ===
            true
        ) {
          throw new Error(
            "External action is not read-only " +
              action
          );
        }
      }
    );

    this.initialized = true;
    return true;
  },

  reset() {
    this.initialized = false;
    return true;
  },

  allows(action) {
    return this.actions.includes(
      String(action || "")
        .trim()
        .toUpperCase()
    );
  },

  requireAllowed(action) {
    if (!this.initialized) {
      this.init();
    }

    const normalized =
      String(action || "")
        .trim()
        .toUpperCase();

    if (!this.allows(normalized)) {
      throw ExternalHttpContract
        .error(
          "EXTERNAL_ACTION_FORBIDDEN",
          "External action denied " +
            normalized
        );
    }

    return ServerActionRegistry
      .get(normalized);
  },

  list() {
    return this.actions.map(
      (name) => {
        const route =
          ServerActionRegistry
            .get(name);

        return {
          name,
          mode: route.mode,
          permission:
            route.permission,
        };
      }
    );
  },

  health() {
    return {
      module:
        "ExternalHttpPolicy",
      version: this.version,
      status:
        this.initialized
          ? "OK"
          : "WARNING",
      initialized:
        this.initialized,
      mode: "READ_ONLY",
      actions:
        this.actions.length,
      commands: 0,
      arbitraryDispatch: false,
    };
  },
};

globalThis.ExternalHttpPolicy =
  ExternalHttpPolicy;
