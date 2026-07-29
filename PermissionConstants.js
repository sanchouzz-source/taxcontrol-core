// ============================================================
// PermissionConstants v2.0.0
// Canonical TaxControl ERP permission catalog
//
// Package G contract:
// - one permission catalog for Auth, RoleManager and SecurityGuard
// - no role is inferred from the existence of a permission string
// - legacy aliases normalize to canonical permissions
// - lifecycle is owned by SystemInit
// ============================================================

console.log("PermissionConstants v2.0.0");

const PermissionConstants = {
  version: "2.0.0",
  initialized: false,

  actions: [
    "CREATE",
    "READ",
    "UPDATE",
    "DELETE",
    "RESTORE",
  ],

  entityPrefixes: {
    ORGANIZATION: "ORGANIZATION",
    USER: "USER",
    CLIENT: "CLIENT",
    TRIP: "TRIP",
    VEHICLE: "VEHICLE",
    DRIVER: "DRIVER",
    CARRIER: "CARRIER",
    ROUTE: "ROUTE",
    CARGO: "CARGO",
    TRANSPORT_ORDER: "TRANSPORT_ORDER",
    CLIENT_FINANCE_PROFILE:
      "CLIENT_FINANCE_PROFILE",
    FINANCIAL_TRANSACTION:
      "FINANCIAL_TRANSACTION",
    KPI: "KPI",
    AUDIT: "AUDIT",
    VERSION: "VERSION",
    FAILED_EVENT: "FAILED_EVENT",
  },

  extraPermissions: [
    "ORGANIZATION_SWITCH",
    "FINANCE_VIEW",
    "FINANCE_EDIT",
    "REPORT_VIEW",
    "REPORT_EXPORT",
    "EVENT_LOG_WRITE",
    "EVENT_REPLAY",
  ],

  aliases: {
    TRIP_VIEW: "TRIP_READ",
    FINANCE_READ: "FINANCE_VIEW",
    FINANCE_UPDATE: "FINANCE_EDIT",
  },

  PERMISSIONS: {},

  buildCatalog() {
    const permissions = {};

    Object.keys(this.entityPrefixes)
      .forEach((entity) => {
        const prefix =
          this.entityPrefixes[entity];

        this.actions.forEach((action) => {
          const permission =
            prefix + "_" + action;

          permissions[permission] =
            permission;
        });
      });

    this.extraPermissions
      .forEach((permission) => {
        permissions[permission] =
          permission;
      });

    this.PERMISSIONS = permissions;

    Object.keys(permissions)
      .forEach((key) => {
        this[key] = permissions[key];
      });

    return permissions;
  },

  init() {
    if (!Object.keys(this.PERMISSIONS).length) {
      this.buildCatalog();
    }

    this.register();
    this.initialized = true;

    Logger.log(
      "PermissionConstants READY v" +
        this.version +
        " permissions=" +
        this.list().length
    );

    return true;
  },

  register() {
    Object.keys(this.PERMISSIONS)
      .forEach((key) => {
        globalThis[
          "PERMISSION_" + key
        ] = this.PERMISSIONS[key];
      });

    /*
     * Compatibility aliases remain available, but every authorization
     * decision is made against the canonical value returned by normalize().
     */
    Object.keys(this.aliases)
      .forEach((alias) => {
        globalThis[
          "PERMISSION_" + alias
        ] = this.aliases[alias];
      });

    return true;
  },

  normalize(permission) {
    const value = String(
      permission || ""
    )
      .trim()
      .toUpperCase();

    return this.aliases[value] || value;
  },

  has(permission) {
    const normalized =
      this.normalize(permission);

    return (
      normalized === "*" ||
      Object.prototype.hasOwnProperty.call(
        this.PERMISSIONS,
        normalized
      )
    );
  },

  forEntity(entity, action) {
    const key = String(entity || "")
      .trim()
      .toUpperCase();
    const operation = String(action || "")
      .trim()
      .toUpperCase();
    const prefix =
      this.entityPrefixes[key];

    if (
      !prefix ||
      !this.actions.includes(operation)
    ) {
      return null;
    }

    const permission =
      prefix + "_" + operation;

    return this.has(permission)
      ? permission
      : null;
  },

  list() {
    return Object.keys(
      this.PERMISSIONS
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
      permissions: this.list().length,
      aliases: Object.keys(
        this.aliases
      ).length,
    };

    if (
      typeof HealthContract !==
        "undefined" &&
      typeof HealthContract.create ===
        "function"
    ) {
      return HealthContract.create(
        "PermissionConstants",
        this.initialized
          ? "OK"
          : "WARNING",
        details
      );
    }

    return {
      module: "PermissionConstants",
      status:
        this.initialized
          ? "OK"
          : "WARNING",
      ...details,
    };
  },
};

/*
 * Catalog construction is declarative metadata, not lifecycle startup.
 * Exporting PERMISSION_* globals remains SystemInit.init() responsibility.
 */
PermissionConstants.buildCatalog();

globalThis.PermissionConstants =
  PermissionConstants;

