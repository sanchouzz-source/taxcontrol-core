// ============================================================
// RoleManager v1.0.0
// Canonical role-to-permission mapping
//
// ADMIN and DIRECTOR receive all functional permissions, but neither role
// bypasses organization scope. Cross-organization access is controlled only
// by SecurityContext and an explicit organization switch.
// ============================================================

console.log("RoleManager v1.0.0");

const RoleManager = {
  version: "1.0.0",
  initialized: false,
  rolePermissions: {},

  init() {
    if (this.initialized) {
      return true;
    }

    if (
      typeof PermissionConstants ===
        "undefined" ||
      PermissionConstants.initialized !==
        true
    ) {
      throw new Error(
        "RoleManager requires initialized PermissionConstants"
      );
    }

    if (
      typeof RoleConstants ===
        "undefined"
    ) {
      throw new Error(
        "RoleManager requires RoleConstants"
      );
    }

    const read = (entity) =>
      PermissionConstants.forEntity(
        entity,
        "READ"
      );
    const operations = (
      entity,
      actions
    ) =>
      actions
        .map((action) =>
          PermissionConstants.forEntity(
            entity,
            action
          )
        )
        .filter(Boolean);
    const unique = (items) =>
      [...new Set(items.filter(Boolean))];

    const transportRead = [
      "CLIENT",
      "TRIP",
      "VEHICLE",
      "DRIVER",
      "CARRIER",
      "ROUTE",
      "CARGO",
      "TRANSPORT_ORDER",
    ].map(read);

    this.rolePermissions = {
      SYSTEM: ["*"],
      ADMIN: ["*"],
      DIRECTOR: ["*"],

      MANAGER: unique([
        ...operations(
          "CLIENT",
          [
            "CREATE",
            "READ",
            "UPDATE",
            "RESTORE",
          ]
        ),
        ...operations(
          "TRIP",
          [
            "CREATE",
            "READ",
            "UPDATE",
            "DELETE",
            "RESTORE",
          ]
        ),
        ...operations(
          "TRANSPORT_ORDER",
          [
            "CREATE",
            "READ",
            "UPDATE",
            "DELETE",
            "RESTORE",
          ]
        ),
        ...operations(
          "VEHICLE",
          ["CREATE", "READ", "UPDATE"]
        ),
        ...operations(
          "DRIVER",
          ["CREATE", "READ", "UPDATE"]
        ),
        ...operations(
          "CARRIER",
          ["CREATE", "READ", "UPDATE"]
        ),
        ...operations(
          "ROUTE",
          ["CREATE", "READ", "UPDATE"]
        ),
        ...operations(
          "CARGO",
          ["CREATE", "READ", "UPDATE"]
        ),
        "REPORT_VIEW",
      ]),

      ACCOUNTANT: unique([
        read("CLIENT"),
        read("TRIP"),
        read("TRANSPORT_ORDER"),
        ...operations(
          "CLIENT_FINANCE_PROFILE",
          PermissionConstants.actions
        ),
        ...operations(
          "FINANCIAL_TRANSACTION",
          PermissionConstants.actions
        ),
        ...operations(
          "KPI",
          [
            "CREATE",
            "READ",
            "UPDATE",
          ]
        ),
        read("AUDIT"),
        read("VERSION"),
        "FINANCE_VIEW",
        "FINANCE_EDIT",
        "REPORT_VIEW",
        "REPORT_EXPORT",
      ]),

      DISPATCHER: unique([
        read("CLIENT"),
        ...operations(
          "TRIP",
          PermissionConstants.actions
        ),
        ...operations(
          "TRANSPORT_ORDER",
          PermissionConstants.actions
        ),
        ...operations(
          "VEHICLE",
          ["CREATE", "READ", "UPDATE"]
        ),
        ...operations(
          "DRIVER",
          ["CREATE", "READ", "UPDATE"]
        ),
        ...operations(
          "CARRIER",
          ["CREATE", "READ", "UPDATE"]
        ),
        ...operations(
          "ROUTE",
          ["CREATE", "READ", "UPDATE"]
        ),
        ...operations(
          "CARGO",
          ["CREATE", "READ", "UPDATE"]
        ),
      ]),

      DRIVER: unique([
        read("TRIP"),
        PermissionConstants.forEntity(
          "TRIP",
          "UPDATE"
        ),
        read("TRANSPORT_ORDER"),
        PermissionConstants.forEntity(
          "TRANSPORT_ORDER",
          "UPDATE"
        ),
        read("VEHICLE"),
        read("ROUTE"),
        read("CARGO"),
      ]),

      VIEWER: unique([
        ...transportRead,
        read("CLIENT_FINANCE_PROFILE"),
        read("FINANCIAL_TRANSACTION"),
        read("KPI"),
        "FINANCE_VIEW",
        "REPORT_VIEW",
      ]),
    };

    const errors = this.validate();

    if (errors.length) {
      throw new Error(
        "RoleManager invalid: " +
          errors.join("; ")
      );
    }

    this.initialized = true;

    Logger.log(
      "RoleManager READY v" +
        this.version
    );

    return true;
  },

  permissionsFor(role) {
    const normalized =
      RoleConstants.normalize(role);

    return [
      ...(
        this.rolePermissions[
          normalized
        ] || []
      ),
    ];
  },

  hasPermission(role, permission) {
    if (!this.initialized) {
      return false;
    }

    const normalizedRole =
      RoleConstants.normalize(role);
    const normalizedPermission =
      PermissionConstants.normalize(
        permission
      );
    const permissions =
      this.rolePermissions[
        normalizedRole
      ];

    if (!permissions) {
      return false;
    }

    return (
      permissions.includes("*") ||
      permissions.includes(
        normalizedPermission
      )
    );
  },

  validate() {
    const errors = [];

    Object.keys(this.rolePermissions)
      .forEach((role) => {
        if (!RoleConstants.has(role)) {
          errors.push(
            "Unknown role " + role
          );
        }

        this.rolePermissions[role]
          .forEach((permission) => {
            if (
              permission !== "*" &&
              !PermissionConstants.has(
                permission
              )
            ) {
              errors.push(
                role +
                  " has unknown permission " +
                  permission
              );
            }
          });
      });

    return errors;
  },

  reset() {
    this.rolePermissions = {};
    this.initialized = false;
    return true;
  },

  health() {
    const errors =
      this.initialized
        ? this.validate()
        : [];
    const details = {
      version: this.version,
      initialized: this.initialized,
      roles: Object.keys(
        this.rolePermissions
      ),
      errors,
    };
    const status =
      this.initialized &&
      errors.length === 0
        ? "OK"
        : "WARNING";

    if (
      typeof HealthContract !==
        "undefined" &&
      typeof HealthContract.create ===
        "function"
    ) {
      return HealthContract.create(
        "RoleManager",
        status,
        details
      );
    }

    return {
      module: "RoleManager",
      status,
      ...details,
    };
  },
};

globalThis.RoleManager =
  RoleManager;

