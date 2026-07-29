// ============================================================
// RoleConstants v1.0.0
// Canonical TaxControl ERP roles
// ============================================================

console.log("RoleConstants v1.0.0");

const RoleConstants = {
  version: "1.0.0",
  initialized: false,

  ROLES: {
    SYSTEM: "SYSTEM",
    ADMIN: "ADMIN",
    DIRECTOR: "DIRECTOR",
    MANAGER: "MANAGER",
    ACCOUNTANT: "ACCOUNTANT",
    DISPATCHER: "DISPATCHER",
    DRIVER: "DRIVER",
    VIEWER: "VIEWER",
  },

  init() {
    this.initialized = true;
    return true;
  },

  normalize(role) {
    return String(role || "")
      .trim()
      .toUpperCase();
  },

  has(role) {
    return Object.prototype
      .hasOwnProperty.call(
        this.ROLES,
        this.normalize(role)
      );
  },

  list() {
    return Object.keys(this.ROLES);
  },

  reset() {
    this.initialized = false;
    return true;
  },

  health() {
    const details = {
      version: this.version,
      initialized: this.initialized,
      roles: this.list(),
    };

    if (
      typeof HealthContract !==
        "undefined" &&
      typeof HealthContract.create ===
        "function"
    ) {
      return HealthContract.create(
        "RoleConstants",
        this.initialized
          ? "OK"
          : "WARNING",
        details
      );
    }

    return {
      module: "RoleConstants",
      status:
        this.initialized
          ? "OK"
          : "WARNING",
      ...details,
    };
  },
};

globalThis.RoleConstants =
  RoleConstants;

