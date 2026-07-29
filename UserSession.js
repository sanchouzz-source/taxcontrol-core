// ============================================================
// UserSession v1.0.0
// Compatibility facade over execution-local SecurityContext
// ============================================================

console.log("UserSession v1.0.0");

const UserSession = {
  version: "1.0.0",
  initialized: false,

  init() {
    if (
      typeof SecurityContext ===
        "undefined"
    ) {
      throw new Error(
        "UserSession requires SecurityContext"
      );
    }

    this.initialized = true;
    return true;
  },

  get current() {
    return this.getUser();
  },

  login(user) {
    if (!this.initialized) {
      this.init();
    }

    return SecurityContext.set(user);
  },

  logout() {
    return SecurityContext.clear();
  },

  getUser() {
    return SecurityContext.get();
  },

  getRole() {
    const user = this.getUser();
    return user ? user.Role : null;
  },

  getOrganizationID() {
    const user = this.getUser();
    return user
      ? user.OrganizationID
      : null;
  },

  isAuthenticated() {
    return SecurityContext
      .isAuthenticated();
  },

  runAs(user, callback) {
    return SecurityContext.runAs(
      user,
      callback
    );
  },

  reset() {
    SecurityContext.clear();
    this.initialized = false;
    return true;
  },

  health() {
    const details = {
      version: this.version,
      initialized: this.initialized,
      authenticated:
        this.isAuthenticated(),
    };

    if (
      typeof HealthContract !==
        "undefined" &&
      typeof HealthContract.create ===
        "function"
    ) {
      return HealthContract.create(
        "UserSession",
        this.initialized
          ? "OK"
          : "WARNING",
        details
      );
    }

    return {
      module: "UserSession",
      status:
        this.initialized
          ? "OK"
          : "WARNING",
      ...details,
    };
  },
};

globalThis.UserSession =
  UserSession;

