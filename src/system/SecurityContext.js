// ============================================================
// SecurityContext v1.0.0
// Execution-local authenticated request context
//
// Package G contract:
// - never stored in ScriptProperties
// - no implicit ADMIN or SYSTEM identity
// - every request supplies a trusted user context
// - one user may explicitly switch only between allowed organizations
// - system bypass exists only inside runAsSystem()
// - callbacks must remain synchronous in Google Apps Script
// ============================================================

console.log("SecurityContext v1.0.0");

const SecurityContext = {
  version: "1.0.0",
  initialized: false,
  _current: null,
  _stack: [],

  init() {
    if (this.initialized) {
      return true;
    }

    if (
      typeof RoleConstants ===
        "undefined" ||
      typeof RoleConstants.has !==
        "function"
    ) {
      throw new Error(
        "SecurityContext requires RoleConstants"
      );
    }

    this.initialized = true;
    return true;
  },

  _assertSync(result, label) {
    if (
      result &&
      typeof result.then === "function"
    ) {
      throw new Error(
        label +
          " must be synchronous in Google Apps Script"
      );
    }

    return result;
  },

  _array(value) {
    if (Array.isArray(value)) {
      return value;
    }

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return [];
    }

    return [value];
  },

  normalize(user, options = {}) {
    if (
      !user ||
      typeof user !== "object" ||
      Array.isArray(user)
    ) {
      throw new Error(
        "AUTHENTICATION REQUIRED: user context missing"
      );
    }

    const userId =
      user.UserID ||
      user.userId ||
      user.id ||
      "";
    const role =
      RoleConstants.normalize(
        user.Role ||
        user.role
      );
    const organizationId =
      user.OrganizationID ||
      user.organizationId ||
      "";
    const system =
      user.System === true ||
      user.system === true;

    if (!userId) {
      throw new Error(
        "AUTHENTICATION REQUIRED: UserID missing"
      );
    }

    if (!role || !RoleConstants.has(role)) {
      throw new Error(
        "AUTHENTICATION REQUIRED: invalid role"
      );
    }

    if (
      role === "SYSTEM" &&
      (
        !system ||
        options.allowSystem !== true
      )
    ) {
      throw new Error(
        "SYSTEM context requires runAsSystem()"
      );
    }

    if (
      role !== "SYSTEM" &&
      system
    ) {
      throw new Error(
        "SYSTEM flag requires SYSTEM role"
      );
    }

    if (!organizationId) {
      throw new Error(
        "AUTHENTICATION REQUIRED: OrganizationID missing"
      );
    }

    const allowedOrganizations =
      this._array(
        user.AllowedOrganizationIDs ||
        user.allowedOrganizationIds ||
        user.OrganizationIDs ||
        user.organizationIds
      )
        .concat(organizationId)
        .map((value) =>
          String(value || "").trim()
        )
        .filter(Boolean);
    const uniqueOrganizations =
      [...new Set(allowedOrganizations)];

    if (
      !uniqueOrganizations.includes(
        String(organizationId)
      )
    ) {
      throw new Error(
        "Active organization is not allowed"
      );
    }

    return {
      UserID: String(userId),
      Name:
        user.Name ||
        user.name ||
        "",
      Email:
        user.Email ||
        user.email ||
        "",
      Role: role,
      OrganizationID:
        String(organizationId),
      AllowedOrganizationIDs:
        uniqueOrganizations,
      Permissions:
        this._array(
          user.Permissions ||
          user.permissions
        )
          .map((permission) =>
            String(permission)
              .trim()
              .toUpperCase()
          )
          .filter(Boolean),
      DeniedPermissions:
        this._array(
          user.DeniedPermissions ||
          user.deniedPermissions
        )
          .map((permission) =>
            String(permission)
              .trim()
              .toUpperCase()
          )
          .filter(Boolean),
      System: system,
      BypassOrganizationScope:
        system &&
        (
          user.BypassOrganizationScope ===
            true ||
          user.bypassOrganizationScope ===
            true
        ),
      AuthenticatedAt:
        new Date().toISOString(),
      Source:
        user.Source ||
        user.source ||
        "REQUEST",
    };
  },

  _set(user, options = {}) {
    if (!this.initialized) {
      this.init();
    }

    const normalized =
      this.normalize(user, options);

    this._current = normalized;

    return {
      ...normalized,
      AllowedOrganizationIDs: [
        ...normalized
          .AllowedOrganizationIDs,
      ],
      Permissions: [
        ...normalized.Permissions,
      ],
      DeniedPermissions: [
        ...normalized
          .DeniedPermissions,
      ],
    };
  },

  set(user) {
    return this._set(user, {
      allowSystem: false,
    });
  },

  clear() {
    this._current = null;
    return true;
  },

  get() {
    if (!this._current) {
      return null;
    }

    return {
      ...this._current,
      AllowedOrganizationIDs: [
        ...this._current
          .AllowedOrganizationIDs,
      ],
      Permissions: [
        ...this._current.Permissions,
      ],
      DeniedPermissions: [
        ...this._current
          .DeniedPermissions,
      ],
    };
  },

  require() {
    const current = this.get();

    if (!current) {
      throw new Error(
        "AUTHENTICATION REQUIRED"
      );
    }

    return current;
  },

  isAuthenticated() {
    return !!this._current;
  },

  isSystem() {
    return !!(
      this._current &&
      this._current.System === true &&
      this._current.Role === "SYSTEM"
    );
  },

  getUserId() {
    return this.require().UserID;
  },

  getRole() {
    return this.require().Role;
  },

  getOrganizationId() {
    return this.require()
      .OrganizationID;
  },

  canAccessOrganization(
    organizationId
  ) {
    if (!this._current) {
      return false;
    }

    const target =
      String(organizationId || "");

    if (
      this.isSystem() &&
      this._current
        .BypassOrganizationScope === true
    ) {
      return true;
    }

    return this._current
      .AllowedOrganizationIDs
      .includes(target);
  },

  switchOrganization(organizationId) {
    const current = this.require();
    const target =
      String(organizationId || "")
        .trim();

    if (!target) {
      throw new Error(
        "OrganizationID cannot be empty"
      );
    }

    if (
      !this.canAccessOrganization(target)
    ) {
      throw new Error(
        "CROSS_ORGANIZATION_ACCESS_DENIED"
      );
    }

    this._current = {
      ...current,
      OrganizationID: target,
    };

    return this.get();
  },

  runAs(user, callback) {
    if (typeof callback !== "function") {
      throw new Error(
        "SecurityContext.runAs requires callback"
      );
    }

    const previous = this._current;
    this._stack.push(previous);

    try {
      this.set(user);
      return this._assertSync(
        callback(this.get()),
        "SecurityContext.runAs callback"
      );
    } finally {
      this._current =
        this._stack.pop() || null;
    }
  },

  runAsSystem(options, callback) {
    let config = options;
    let handler = callback;

    if (typeof options === "function") {
      handler = options;
      config = {};
    }

    if (typeof handler !== "function") {
      throw new Error(
        "SecurityContext.runAsSystem requires callback"
      );
    }

    config = config || {};

    const previous = this._current;
    this._stack.push(previous);

    try {
      this._set(
        {
          UserID:
            config.userId ||
            "SYSTEM",
          Name: "SYSTEM",
          Role: "SYSTEM",
          OrganizationID:
            config.organizationId ||
            "SYSTEM",
          AllowedOrganizationIDs: [
            config.organizationId ||
              "SYSTEM",
          ],
          System: true,
          BypassOrganizationScope:
            config
              .bypassOrganizationScope ===
            true,
          Source:
            config.source ||
            "SYSTEM",
        },
        {
          allowSystem: true,
        }
      );

      return this._assertSync(
        handler(this.get()),
        "SecurityContext.runAsSystem callback"
      );
    } finally {
      this._current =
        this._stack.pop() || null;
    }
  },

  withOrganization(
    organizationId,
    callback
  ) {
    if (typeof callback !== "function") {
      throw new Error(
        "SecurityContext.withOrganization requires callback"
      );
    }

    this.require();
    const previous = this._current;

    this.switchOrganization(
      organizationId
    );

    try {
      return this._assertSync(
        callback(this.get()),
        "SecurityContext.withOrganization callback"
      );
    } finally {
      this._current = previous;
    }
  },

  execute(user, callback) {
    if (
      typeof startERP === "function" &&
      (
        typeof SystemInit ===
          "undefined" ||
        typeof SystemInit.isReady !==
          "function" ||
        SystemInit.isReady() !== true
      )
    ) {
      this._assertSync(
        startERP(),
        "startERP"
      );
    }

    return this.runAs(
      user,
      callback
    );
  },

  reset() {
    this._current = null;
    this._stack = [];
    this.initialized = false;
    return true;
  },

  health() {
    const details = {
      version: this.version,
      initialized: this.initialized,
      authenticated:
        this.isAuthenticated(),
      userId:
        this._current
          ? this._current.UserID
          : null,
      role:
        this._current
          ? this._current.Role
          : null,
      organizationId:
        this._current
          ? this._current.OrganizationID
          : null,
      system: this.isSystem(),
    };

    if (
      typeof HealthContract !==
        "undefined" &&
      typeof HealthContract.create ===
        "function"
    ) {
      return HealthContract.create(
        "SecurityContext",
        this.initialized
          ? "OK"
          : "WARNING",
        details
      );
    }

    return {
      module: "SecurityContext",
      status:
        this.initialized
          ? "OK"
          : "WARNING",
      ...details,
    };
  },
};

globalThis.SecurityContext =
  SecurityContext;
