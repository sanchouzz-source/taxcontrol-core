// ============================================================
// ServerActionRegistry v1.0.0
// Explicit allowlist for trusted server RPC actions
//
// No client-supplied function name, permission, role or organization is used
// for dispatch. Every action owns a fixed permission, payload schema, mode and
// server-side handler. The registry is sealed after lifecycle initialization.
// ============================================================

console.log("ServerActionRegistry v1.0.0");

const ServerActionRegistry = {
  version: "1.0.0",
  initialized: false,
  sealed: false,
  routes: {},

  init() {
    if (this.initialized) {
      return true;
    }

    [
      "ServerRequestContract",
      "PermissionConstants",
      "RoleConstants",
      "SecurityContext",
      "SecurityGuard",
      "UserMembershipService",
    ].forEach((name) => {
      if (!globalThis[name]) {
        throw new Error(
          "ServerActionRegistry requires " +
            name
        );
      }
    });

    [
      "listMemberships",
      "getMembership",
      "createMembership",
      "updateMembership",
      "changeRole",
      "deactivateMembership",
      "reactivateMembership",
    ].forEach((method) => {
      if (
        typeof UserMembershipService[
          method
        ] !== "function"
      ) {
        throw new Error(
          "UserMembershipService API missing " +
            method
        );
      }
    });

    if (
      UserMembershipService
        .initialized !== true
    ) {
      throw new Error(
        "UserMembershipService is not initialized"
      );
    }

    this.routes = {};
    this.sealed = false;
    this._registerDefaults();

    Object.keys(this.routes)
      .forEach((name) => {
        const route =
          this.routes[name];

        Object.keys(route.schema)
          .forEach((field) => {
            Object.freeze(
              route.schema[field]
            );
          });
        Object.freeze(
          route.schema
        );
        Object.freeze(route);
      });

    this.routes = Object.freeze({
      ...this.routes,
    });
    this.sealed = true;
    this.initialized = true;

    Logger.log(
      "ServerActionRegistry READY v" +
        this.version +
        " actions=" +
        this.count()
    );

    return true;
  },

  reset() {
    this.routes = {};
    this.sealed = false;
    this.initialized = false;
    return true;
  },

  _assertReady() {
    if (!this.initialized) {
      throw new Error(
        "ServerActionRegistry is not initialized; call startERP()"
      );
    }

    return true;
  },

  _normalizeName(value) {
    const name =
      String(value || "")
        .trim()
        .toUpperCase();

    if (
      !/^[A-Z][A-Z0-9_.]{2,79}$/
        .test(name)
    ) {
      throw new Error(
        "Invalid server action name"
      );
    }

    return name;
  },

  register(name, config) {
    if (this.sealed) {
      throw new Error(
        "ServerActionRegistry is sealed"
      );
    }

    const key =
      this._normalizeName(name);

    if (
      !config ||
      typeof config !== "object" ||
      Array.isArray(config)
    ) {
      throw new Error(
        key +
          " route configuration required"
      );
    }

    if (this.routes[key]) {
      throw new Error(
        "Duplicate server action " +
          key
      );
    }

    const mode =
      String(
        config.mode || "QUERY"
      )
        .trim()
        .toUpperCase();

    if (
      ![
        "QUERY",
        "COMMAND",
      ].includes(mode)
    ) {
      throw new Error(
        key +
          " has invalid mode " +
          mode
      );
    }

    if (
      typeof config.handler !==
        "function"
    ) {
      throw new Error(
        key +
          " handler must be a function"
      );
    }

    const permission =
      config.permission
        ? PermissionConstants
          .normalize(
            config.permission
          )
        : null;

    if (
      permission &&
      !PermissionConstants.has(
        permission
      )
    ) {
      throw new Error(
        key +
          " has unknown permission " +
          permission
      );
    }

    if (
      mode === "COMMAND" &&
      config.requiresIdempotency !==
        true
    ) {
      throw new Error(
        key +
          " command must require idempotency"
      );
    }

    if (
      mode === "COMMAND" &&
      config.retrySafe !== true
    ) {
      throw new Error(
        key +
          " command must be retry-safe at the business layer"
      );
    }

    this.routes[key] = {
      name: key,
      mode,
      permission,
      requiresIdempotency:
        config.requiresIdempotency ===
        true,
      retrySafe:
        config.retrySafe === true,
      schema: {
        ...(
          config.schema || {}
        ),
      },
      handler: config.handler,
    };

    return this.routes[key];
  },

  _registerDefaults() {
    const noPayload = {};
    const userId = {
      type: "string",
      required: true,
      trim: true,
      minLength: 1,
      maxLength: 128,
      pattern:
        /^[A-Za-z0-9][A-Za-z0-9._:-]*$/,
    };
    const role = {
      type: "enum",
      required: true,
      normalize: "UPPER",
      values() {
        return RoleConstants
          .list()
          .filter(
            (item) =>
              item !== "SYSTEM"
          );
      },
    };

    this.register(
      "IDENTITY.CURRENT",
      {
        mode: "QUERY",
        permission: null,
        schema: noPayload,
        handler(payload, context) {
          return {
            UserID:
              context.UserID,
            Name:
              context.Name || "",
            Email:
              context.Email || "",
            Role:
              context.Role,
            OrganizationID:
              context.OrganizationID,
            AllowedOrganizationIDs: [
              ...(
                context
                  .AllowedOrganizationIDs ||
                []
              ),
            ],
          };
        },
      }
    );

    this.register(
      "SYSTEM.HEALTH",
      {
        mode: "QUERY",
        permission:
          "SYSTEM_ADMIN",
        schema: noPayload,
        handler() {
          const health =
            SystemInit.health();

          return {
            Version:
              SystemInit.version,
            Status:
              SystemInit.status,
            Ready:
              SystemInit.isReady(),
            HealthStatus:
              health.status,
            Warnings:
              (
                health
                  .optionalWarnings ||
                []
              ).length,
            ModuleMode:
              health.modules
                ? health.modules.mode
                : null,
          };
        },
      }
    );

    this.register(
      "USER.MEMBERSHIP.LIST",
      {
        mode: "QUERY",
        permission: "USER_READ",
        schema: {
          includeInactive: {
            type: "boolean",
            required: false,
            default: true,
          },
        },
        handler(payload) {
          return UserMembershipService
            .listMemberships({
              includeInactive:
                payload
                  .includeInactive,
              includeDeleted: false,
            });
        },
      }
    );

    this.register(
      "USER.MEMBERSHIP.GET",
      {
        mode: "QUERY",
        permission: "USER_READ",
        schema: {
          userId,
        },
        handler(payload) {
          return UserMembershipService
            .getMembership(
              payload.userId
            );
        },
      }
    );

    this.register(
      "USER.MEMBERSHIP.CREATE",
      {
        mode: "COMMAND",
        permission: "USER_CREATE",
        requiresIdempotency: true,
        retrySafe: true,
        schema: {
          email: {
            type: "email",
            required: true,
            maxLength: 254,
          },
          name: {
            type: "string",
            required: false,
            default: "",
            trim: true,
            maxLength: 160,
          },
          role,
        },
        handler(payload) {
          return UserMembershipService
            .createMembership({
              Email: payload.email,
              Name: payload.name,
              Role: payload.role,
            });
        },
      }
    );

    this.register(
      "USER.MEMBERSHIP.UPDATE_NAME",
      {
        mode: "COMMAND",
        permission: "USER_UPDATE",
        requiresIdempotency: true,
        retrySafe: true,
        schema: {
          userId,
          name: {
            type: "string",
            required: true,
            trim: true,
            maxLength: 160,
          },
        },
        handler(payload) {
          return UserMembershipService
            .updateMembership(
              payload.userId,
              {
                Name:
                  payload.name,
              }
            );
        },
      }
    );

    this.register(
      "USER.MEMBERSHIP.CHANGE_ROLE",
      {
        mode: "COMMAND",
        permission: "USER_UPDATE",
        requiresIdempotency: true,
        retrySafe: true,
        schema: {
          userId,
          role,
        },
        handler(payload) {
          return UserMembershipService
            .changeRole(
              payload.userId,
              payload.role
            );
        },
      }
    );

    this.register(
      "USER.MEMBERSHIP.DEACTIVATE",
      {
        mode: "COMMAND",
        permission: "USER_DELETE",
        requiresIdempotency: true,
        retrySafe: true,
        schema: {
          userId,
        },
        handler(payload) {
          return UserMembershipService
            .deactivateMembership(
              payload.userId
            );
        },
      }
    );

    this.register(
      "USER.MEMBERSHIP.REACTIVATE",
      {
        mode: "COMMAND",
        permission:
          "USER_RESTORE",
        requiresIdempotency: true,
        retrySafe: true,
        schema: {
          userId,
        },
        handler(payload) {
          return UserMembershipService
            .reactivateMembership(
              payload.userId
            );
        },
      }
    );

    return this.count();
  },

  get(name) {
    this._assertReady();

    const key =
      this._normalizeName(name);
    const route =
      this.routes[key];

    if (!route) {
      throw ServerRequestContract.error(
        "ACTION_NOT_FOUND",
        "Unknown server action " +
          key
      );
    }

    return route;
  },

  has(name) {
    if (!this.initialized) {
      return false;
    }

    try {
      return !!this.routes[
        this._normalizeName(name)
      ];
    } catch (error) {
      return false;
    }
  },

  list() {
    this._assertReady();

    return Object.keys(this.routes)
      .sort()
      .map((name) => {
        const route =
          this.routes[name];

        return {
          name,
          mode: route.mode,
          permission:
            route.permission,
          requiresIdempotency:
            route
              .requiresIdempotency,
          retrySafe:
            route.retrySafe,
          fields:
            Object.keys(
              route.schema
            ).sort(),
        };
      });
  },

  count() {
    return Object.keys(
      this.routes
    ).length;
  },

  _value(
    field,
    value,
    rule
  ) {
    const type =
      String(
        rule.type || "string"
      ).toLowerCase();

    if (type === "boolean") {
      if (typeof value !== "boolean") {
        throw ServerRequestContract.error(
          "PAYLOAD_INVALID",
          field +
            " must be boolean"
        );
      }

      return value;
    }

    if (
      type === "string" ||
      type === "email" ||
      type === "enum"
    ) {
      if (typeof value !== "string") {
        throw ServerRequestContract.error(
          "PAYLOAD_INVALID",
          field +
            " must be string"
        );
      }

      let normalized =
        rule.trim === false
          ? value
          : value.trim();

      if (
        rule.normalize === "UPPER"
      ) {
        normalized =
          normalized.toUpperCase();
      }

      if (
        rule.normalize === "LOWER" ||
        type === "email"
      ) {
        normalized =
          normalized.toLowerCase();
      }

      if (
        rule.minLength !==
          undefined &&
        normalized.length <
          rule.minLength
      ) {
        throw ServerRequestContract.error(
          "PAYLOAD_INVALID",
          field +
            " is too short"
        );
      }

      if (
        rule.maxLength !==
          undefined &&
        normalized.length >
          rule.maxLength
      ) {
        throw ServerRequestContract.error(
          "PAYLOAD_INVALID",
          field +
            " is too long"
        );
      }

      if (
        rule.pattern &&
        !rule.pattern.test(normalized)
      ) {
        throw ServerRequestContract.error(
          "PAYLOAD_INVALID",
          field +
            " has invalid format"
        );
      }

      if (
        type === "email" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
          .test(normalized)
      ) {
        throw ServerRequestContract.error(
          "USER_EMAIL_INVALID",
          "Invalid membership email"
        );
      }

      if (type === "enum") {
        const values =
          typeof rule.values ===
            "function"
            ? rule.values()
            : rule.values || [];

        if (
          !values.includes(
            normalized
          )
        ) {
          throw ServerRequestContract.error(
            field === "role"
              ? "USER_ROLE_INVALID"
              : "PAYLOAD_INVALID",
            field +
              " has invalid value"
          );
        }
      }

      return normalized;
    }

    throw new Error(
      "Unsupported schema type " +
        type
    );
  },

  validatePayload(route, payload) {
    if (
      !route ||
      typeof route !== "object"
    ) {
      throw new Error(
        "Route required"
      );
    }

    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) {
      throw ServerRequestContract.error(
        "PAYLOAD_INVALID",
        "Payload must be object"
      );
    }

    const schema =
      route.schema || {};
    const unknown =
      Object.keys(payload)
        .filter(
          (field) =>
            !Object.prototype
              .hasOwnProperty.call(
                schema,
                field
              )
        );

    if (unknown.length) {
      throw ServerRequestContract.error(
        "PAYLOAD_FIELDS_FORBIDDEN",
        route.name +
          " payload contains forbidden fields: " +
          unknown.join(", ")
      );
    }

    const result = {};

    Object.keys(schema)
      .forEach((field) => {
        const rule =
          schema[field] || {};
        const present =
          Object.prototype
            .hasOwnProperty.call(
              payload,
              field
            );

        if (!present) {
          if (
            Object.prototype
              .hasOwnProperty.call(
                rule,
                "default"
              )
          ) {
            result[field] =
              rule.default;
            return;
          }

          if (
            rule.required === true
          ) {
            throw ServerRequestContract.error(
              "PAYLOAD_INVALID",
              route.name +
                " requires " +
                field
            );
          }

          return;
        }

        result[field] =
          this._value(
            field,
            payload[field],
            rule
          );
      });

    return result;
  },

  authorize(route) {
    if (route.permission) {
      SecurityGuard.require(
        route.permission
      );
    }

    return true;
  },

  execute(
    route,
    payload,
    context
  ) {
    this._assertReady();
    this.authorize(route);

    const result =
      route.handler(
        payload,
        context
      );

    if (
      result &&
      typeof result.then ===
        "function"
    ) {
      throw new Error(
        route.name +
          " handler must be synchronous in Google Apps Script"
      );
    }

    return result;
  },

  health() {
    return {
      module:
        "ServerActionRegistry",
      version: this.version,
      status:
        this.initialized &&
        this.sealed &&
        this.count() === 9
          ? "OK"
          : "WARNING",
      initialized:
        this.initialized,
      sealed: this.sealed,
      actions: this.count(),
      commands:
        this.initialized
          ? this.list()
            .filter(
              (route) =>
                route.mode ===
                "COMMAND"
            )
            .length
          : 0,
      dynamicDispatch: false,
    };
  },
};

globalThis.ServerActionRegistry =
  ServerActionRegistry;
