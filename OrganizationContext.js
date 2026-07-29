// ============================================================
// OrganizationContext v2.0.0
// Compatibility facade over SecurityContext
// ============================================================

console.log("OrganizationContext v2.0.0");

const OrganizationContext = {
  version: "2.0.0",
  initialized: false,

  init() {
    if (
      typeof SecurityContext ===
        "undefined"
    ) {
      throw new Error(
        "OrganizationContext requires SecurityContext"
      );
    }

    this.initialized = true;
    return true;
  },

  get() {
    return SecurityContext
      .getOrganizationId();
  },

  tryGet() {
    const context =
      SecurityContext.get();

    return context
      ? context.OrganizationID
      : null;
  },

  require(data) {
    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      throw new Error(
        "Invalid data object"
      );
    }

    const organizationId =
      this.get();

    if (!data.OrganizationID) {
      data.OrganizationID =
        organizationId;
    }

    if (
      String(data.OrganizationID) !==
      String(organizationId)
    ) {
      throw new Error(
        "CROSS_ORGANIZATION_ACCESS_DENIED"
      );
    }

    return data;
  },

  canAccess(organizationId) {
    return SecurityContext
      .canAccessOrganization(
        organizationId
      );
  },

  run(organizationId, callback) {
    return SecurityContext
      .withOrganization(
        organizationId,
        callback
      );
  },

  reset() {
    this.initialized = false;
    return true;
  },

  health() {
    const details = {
      version: this.version,
      initialized: this.initialized,
      organizationId:
        this.tryGet(),
    };

    if (
      typeof HealthContract !==
        "undefined" &&
      typeof HealthContract.create ===
        "function"
    ) {
      return HealthContract.create(
        "OrganizationContext",
        this.initialized
          ? "OK"
          : "WARNING",
        details
      );
    }

    return {
      module: "OrganizationContext",
      status:
        this.initialized
          ? "OK"
          : "WARNING",
      ...details,
    };
  },
};

globalThis.OrganizationContext =
  OrganizationContext;

