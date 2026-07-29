// ============================================================
// Auth v2.0.0
// Compatibility facade over SecurityContext and SecurityGuard
// ============================================================

console.log("Auth v2.0.0");

const Auth = {
  version: "2.0.0",
  initialized: false,

  get roles() {
    return {
      ...RoleConstants.ROLES,
    };
  },

  init() {
    if (
      typeof SecurityContext ===
        "undefined" ||
      typeof SecurityGuard ===
        "undefined"
    ) {
      throw new Error(
        "Auth security dependencies unavailable"
      );
    }

    this.initialized = true;
    return true;
  },

  getCurrentUser() {
    return SecurityContext.get();
  },

  hasPermission(permission) {
    return SecurityGuard.check(
      permission
    );
  },

  requirePermission(permission) {
    return SecurityGuard.require(
      permission
    );
  },

  runAs(user, callback) {
    return SecurityContext.runAs(
      user,
      callback
    );
  },

  reset() {
    this.initialized = false;
    return true;
  },

  health() {
    return {
      module: "Auth",
      version: this.version,
      status:
        this.initialized
          ? "OK"
          : "WARNING",
      initialized: this.initialized,
      authenticated:
        SecurityContext
          .isAuthenticated(),
    };
  },
};

globalThis.Auth = Auth;

