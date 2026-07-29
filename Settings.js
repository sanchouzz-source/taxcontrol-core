// ============================================================
// Settings v2.0.0
// Execution-local organization selection
// ============================================================

const Settings = {
  version: "2.0.0",
  initialized: false,

  init() {
    if (
      typeof SecurityContext ===
        "undefined"
    ) {
      throw new Error(
        "Settings requires SecurityContext"
      );
    }

    this.initialized = true;
    return true;
  },

  setCurrentOrganization(
    organizationId
  ) {
    return SecurityContext
      .switchOrganization(
        organizationId
      );
  },

  getCurrentOrganization() {
    return SecurityContext
      .getOrganizationId();
  },

  reset() {
    this.initialized = false;
    return true;
  },

  health() {
    return {
      module: "Settings",
      version: this.version,
      status:
        this.initialized
          ? "OK"
          : "WARNING",
      initialized: this.initialized,
      organizationId:
        OrganizationContext.tryGet(),
    };
  },
};

globalThis.Settings = Settings;

