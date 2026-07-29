// ============================================================
// SystemInit v3.9.0
// Enterprise ERP Lifecycle Orchestrator
// TaxControl ERP Core
//
// Canonical lifecycle:
// Bootstrap -> App -> SystemInit
//
// Package C contract:
// - one declarative dependency graph
// - synchronous Google Apps Script startup
// - required components cannot be silently skipped
// - READY is confirmed by component state
// - reset runs in reverse dependency order
// - ModuleRegistry starts real manifest wrappers synchronously
// - critical module failure prevents ERP READY
// - optional module failure is reported as a warning
// - event runtime is fully reset after managed modules stop
// - security catalog, roles and request context are lifecycle components
// - OrganizationScope is ready before Database and Repository layers
// - startup never creates an implicit authenticated user
// - trusted request entry points resolve identity only after Database is ready
// - managed USER membership service starts after repositories and audit
// - ServiceRegistry cannot become ready without user-management API
// - trusted server RPC has a fixed contract, allowlist and replay protection
// - public HTTP and external token authentication remain disabled
// ============================================================

console.log("SystemInit v3.9.0");

const SystemInit = {
  version: "3.9.0",

  initialized: false,
  initializing: false,
  status: "CREATED",
  startedAt: null,
  finishedAt: null,
  duration: 0,
  lastError: null,

  bootLog: [],
  started: {},
  componentStatus: {},
  startupOrder: [],
  warnings: [],

  // Definition order is also the stable order for independent roots.
  componentDefinitions: {
    Logger: {
      dependencies: [],
      critical: true,
      methods: ["log", "warn", "error"],
    },

    HealthContract: {
      dependencies: [],
      critical: true,
      methods: ["create"],
    },

    Config: {
      dependencies: ["Logger"],
      critical: true,
      methods: ["init"],
    },

    PermissionConstants: {
      dependencies: ["Logger"],
      critical: true,
      methods: [
        "init",
        "reset",
        "list",
        "has",
        "forEntity",
      ],
    },

    RoleConstants: {
      dependencies: ["Logger"],
      critical: true,
      methods: [
        "init",
        "reset",
        "has",
        "list",
      ],
    },

    RoleManager: {
      dependencies: [
        "PermissionConstants",
        "RoleConstants",
      ],
      critical: true,
      methods: [
        "init",
        "reset",
        "hasPermission",
        "validate",
      ],
    },

    SecurityContext: {
      dependencies: ["RoleConstants"],
      critical: true,
      methods: [
        "init",
        "reset",
        "get",
        "require",
        "runAs",
        "runAsSystem",
        "isAuthenticated",
      ],
    },

    UserSession: {
      dependencies: ["SecurityContext"],
      critical: true,
      methods: [
        "init",
        "reset",
        "login",
        "logout",
        "getUser",
      ],
    },

    OrganizationContext: {
      dependencies: ["SecurityContext"],
      critical: true,
      methods: [
        "init",
        "reset",
        "get",
        "tryGet",
        "require",
        "run",
      ],
    },

    Settings: {
      dependencies: [
        "SecurityContext",
        "OrganizationContext",
      ],
      critical: true,
      methods: [
        "init",
        "reset",
        "setCurrentOrganization",
        "getCurrentOrganization",
      ],
    },

    SecurityGuard: {
      dependencies: [
        "PermissionConstants",
        "RoleManager",
        "SecurityContext",
      ],
      critical: true,
      methods: [
        "init",
        "reset",
        "check",
        "require",
        "requireEntity",
        "runInternal",
      ],
    },

    Auth: {
      dependencies: [
        "SecurityContext",
        "SecurityGuard",
        "RoleConstants",
      ],
      critical: true,
      methods: [
        "init",
        "reset",
        "getCurrentUser",
        "hasPermission",
        "requirePermission",
      ],
    },

    EntityMetadata: {
      dependencies: ["Logger"],
      critical: true,
      methods: ["init", "list", "validate"],
    },

    OrganizationScope: {
      dependencies: [
        "EntityMetadata",
        "SecurityContext",
        "SecurityGuard",
      ],
      critical: true,
      methods: [
        "init",
        "reset",
        "validate",
        "prepareCreate",
        "prepareUpdate",
        "scopeCriteria",
        "filterRecord",
        "filterRows",
      ],
    },

    EntityRegistry: {
      dependencies: [
        "EntityMetadata",
        "OrganizationScope",
      ],
      critical: true,
      methods: ["init", "list", "validate"],
    },

    SchemaRegistry: {
      dependencies: [
        "EntityMetadata",
        "EntityRegistry",
      ],
      critical: true,
      methods: ["init", "list", "validate"],
    },

    SpreadsheetAdapter: {
      dependencies: ["Logger"],
      critical: true,
      methods: ["init", "replace", "reset"],
    },

    SchemaBuilder: {
      dependencies: ["EntityMetadata"],
      critical: true,
      methods: ["build"],
    },

    SchemaStorage: {
      dependencies: ["SpreadsheetAdapter"],
      critical: true,
      methods: ["load", "save"],
    },

    SchemaManager: {
      dependencies: [
        "SchemaRegistry",
        "SpreadsheetAdapter",
        "SchemaBuilder",
        "SchemaStorage",
      ],
      critical: true,
      methods: ["init", "reset", "getTables"],
    },

    Database: {
      dependencies: [
        "SchemaManager",
        "SpreadsheetAdapter",
        "EntityRegistry",
        "OrganizationScope",
      ],
      critical: true,
      methods: ["init", "reset", "list"],
    },

    TrustedUserResolver: {
      dependencies: [
        "Database",
        "SecurityContext",
        "RoleConstants",
      ],
      critical: true,
      methods: [
        "init",
        "reset",
        "resolve",
        "inspect",
        "setPreferredOrganization",
      ],
    },

    TrustedEntryPoints: {
      dependencies: [
        "TrustedUserResolver",
        "SecurityContext",
        "SecurityGuard",
        "UserMembershipService",
      ],
      critical: true,
      methods: [
        "init",
        "reset",
        "run",
        "runMenu",
        "identityStatus",
      ],
    },

    BaseRepository: {
      dependencies: [
        "Database",
        "EntityRegistry",
        "SecurityGuard",
        "OrganizationScope",
      ],
      critical: true,
      methods: ["init", "reset", "ready"],
    },

    RepositoryFactory: {
      dependencies: [
        "BaseRepository",
        "EntityRegistry",
      ],
      critical: true,
      methods: ["init", "reset", "list"],
    },

    RepositoryRegistry: {
      dependencies: ["RepositoryFactory"],
      critical: true,
      methods: [
        "init",
        "reset",
        "list",
        "isReady",
      ],
    },

    AuditLog: {
      dependencies: [
        "EntityRegistry",
        "RepositoryRegistry",
        "SecurityContext",
        "SecurityGuard",
      ],
      critical: true,
      methods: [
        "init",
        "reset",
        "write",
      ],
    },

    EntityService: {
      dependencies: [
        "RepositoryFactory",
        "RepositoryRegistry",
        "EntityRegistry",
        "AuditLog",
        "SecurityGuard",
        "OrganizationScope",
      ],
      critical: true,
      methods: ["init", "reset"],
    },

    UserMembershipService: {
      dependencies: [
        "RepositoryRegistry",
        "AuditLog",
        "SecurityContext",
        "SecurityGuard",
        "RoleConstants",
      ],
      critical: true,
      methods: [
        "init",
        "reset",
        "listMemberships",
        "createMembership",
        "updateMembership",
        "deactivateMembership",
        "reactivateMembership",
        "health",
      ],
    },

    ServerRequestContract: {
      dependencies: ["Logger"],
      critical: true,
      methods: [
        "init",
        "reset",
        "normalize",
        "success",
        "failure",
        "classify",
        "stableStringify",
        "byteLength",
        "health",
      ],
    },

    ServerIdempotencyStore: {
      dependencies: [
        "Logger",
        "ServerRequestContract",
      ],
      critical: true,
      methods: [
        "init",
        "reset",
        "claim",
        "complete",
        "abort",
        "purgeExpired",
        "health",
      ],
    },

    ServerActionRegistry: {
      dependencies: [
        "ServerRequestContract",
        "PermissionConstants",
        "RoleConstants",
        "SecurityContext",
        "SecurityGuard",
        "UserMembershipService",
      ],
      critical: true,
      methods: [
        "init",
        "reset",
        "get",
        "has",
        "list",
        "count",
        "validatePayload",
        "authorize",
        "execute",
        "health",
      ],
    },

    ServerRequestBoundary: {
      dependencies: [
        "ServerRequestContract",
        "ServerIdempotencyStore",
        "ServerActionRegistry",
        "TrustedEntryPoints",
        "SecurityContext",
        "SecurityGuard",
      ],
      critical: true,
      methods: [
        "init",
        "reset",
        "handle",
        "health",
      ],
    },

    ERPEventContract: {
      dependencies: ["Logger"],
      critical: true,
      methods: [
        "init",
        "reset",
        "create",
        "validate",
        "isCanonical",
        "payloadOf",
      ],
    },

    EventBus: {
      dependencies: ["ERPEventContract"],
      critical: true,
      methods: [
        "init",
        "emit",
        "subscribe",
        "unsubscribe",
        "reset",
        "isLifecycleEvent",
      ],
    },

    BusinessEventProcessor: {
      dependencies: ["EventBus"],
      critical: false,
      methods: [
        "init",
        "reset",
        "process",
      ],
    },

    ServiceRegistry: {
      dependencies: [
        "EntityService",
        "EventBus",
        "RepositoryRegistry",
        "UserMembershipService",
      ],
      critical: true,
      methods: [
        "init",
        "refresh",
        "reset",
        "has",
        "validate",
      ],
    },

    ClientService: {
      dependencies: [
        "ServiceRegistry",
        "RepositoryFactory",
      ],
      critical: true,
      methods: ["init", "reset"],
    },

    TransportOrderService: {
      dependencies: [
        "ServiceRegistry",
        "RepositoryFactory",
      ],
      critical: true,
      methods: ["init", "reset"],
    },

    FinanceService: {
      dependencies: ["ServiceRegistry"],
      critical: false,
      methods: [],
    },

    KPIService: {
      dependencies: ["ServiceRegistry"],
      critical: false,
      methods: [],
    },

    ModuleRegistry: {
      dependencies: [
        "EventBus",
        "EntityService",
        "RepositoryRegistry",
        "ServiceRegistry",
      ],
      critical: true,
      methods: [
        "init",
        "setEventBus",
        "loadManifest",
        "startAll",
        "stopAll",
        "reset",
        "isReady",
        "health",
      ],
    },
  },

  get dependencyGraph() {
    const graph = {};

    Object.keys(this.componentDefinitions)
      .forEach((name) => {
        graph[name] = [
          ...this.componentDefinitions[name].dependencies,
        ];
      });

    return graph;
  },

  get criticalComponents() {
    return Object.keys(this.componentDefinitions)
      .filter(
        (name) =>
          this.componentDefinitions[name].critical === true
      );
  },

  _log(level, message) {
    const logger = globalThis.Logger;

    if (
      logger &&
      typeof logger[level] === "function"
    ) {
      logger[level](message);
      return;
    }

    const fallback =
      typeof console !== "undefined" &&
      typeof console[level] === "function"
        ? console[level]
        : console.log;

    fallback.call(console, message);
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

  _component(name) {
    return globalThis[name] || null;
  },

  // ============================================================
  // GRAPH
  // ============================================================

  resolveOrder(definitions) {
    const graph =
      definitions || this.componentDefinitions;

    const order = [];
    const visited = {};
    const visiting = {};
    const path = [];

    const visit = (name) => {
      if (visited[name]) {
        return;
      }

      if (!graph[name]) {
        throw new Error(
          "Unknown lifecycle component " + name
        );
      }

      if (visiting[name]) {
        const cycleStart = path.indexOf(name);
        const cycle = path
          .slice(cycleStart)
          .concat(name);

        throw new Error(
          "Circular lifecycle dependency " +
            cycle.join(" -> ")
        );
      }

      visiting[name] = true;
      path.push(name);

      const dependencies =
        graph[name].dependencies || [];

      dependencies.forEach((dependency) => {
        if (!graph[dependency]) {
          throw new Error(
            name +
              " has unknown dependency " +
              dependency
          );
        }

        visit(dependency);
      });

      path.pop();
      visiting[name] = false;
      visited[name] = true;
      order.push(name);
    };

    Object.keys(graph).forEach(visit);

    return order;
  },

  validateGraph() {
    const order =
      this.resolveOrder(this.componentDefinitions);

    return {
      valid: true,
      order,
      count: order.length,
    };
  },

  _contractErrors(name, component, definition) {
    const errors = [];

    if (!component) {
      errors.push(name + " unavailable");
      return errors;
    }

    (definition.methods || [])
      .forEach((method) => {
        if (typeof component[method] !== "function") {
          errors.push(
            name + "." + method + " unavailable"
          );
        }
      });

    return errors;
  },

  _preflight(order) {
    const errors = [];

    order.forEach((name) => {
      const definition =
        this.componentDefinitions[name];

      if (!definition.critical) {
        return;
      }

      errors.push(
        ...this._contractErrors(
          name,
          this._component(name),
          definition
        )
      );
    });

    const manifest =
      globalThis.ERP_MODULE_MANIFEST;

    if (!manifest) {
      errors.push(
        "ERP_MODULE_MANIFEST unavailable"
      );
    } else if (
      typeof manifest.validate !== "function"
    ) {
      errors.push(
        "ERP_MODULE_MANIFEST.validate unavailable"
      );
    } else {
      try {
        const manifestErrors =
          manifest.validate();

        this._assertSync(
          manifestErrors,
          "ERP_MODULE_MANIFEST.validate"
        );

        if (
          Array.isArray(manifestErrors) &&
          manifestErrors.length
        ) {
          errors.push(
            "ERP_MODULE_MANIFEST invalid: " +
              manifestErrors.join("; ")
          );
        }
      } catch (error) {
        errors.push(
          "ERP_MODULE_MANIFEST validation failed: " +
            error.message
        );
      }
    }

    if (errors.length) {
      throw new Error(
        "Lifecycle preflight failed: " +
          errors.join("; ")
      );
    }

    return true;
  },

  // ============================================================
  // COMPONENT START
  // ============================================================

  _invokeInit(name, component) {
    const call = (method, args) => {
      if (typeof component[method] !== "function") {
        return true;
      }

      const result =
        component[method](...(args || []));

      this._assertSync(
        result,
        name + "." + method
      );

      if (result === false) {
        throw new Error(
          name + "." + method + " returned false"
        );
      }

      return result;
    };

    if (name === "Database") {
      return call(
        "init",
        [this._component("SpreadsheetAdapter")]
      );
    }

    if (name === "BaseRepository") {
      return call(
        "init",
        [this._component("Database")]
      );
    }

    if (name === "ServiceRegistry") {
      return call("init");
    }

    if (name === "ModuleRegistry") {
      const manifest =
        globalThis.ERP_MODULE_MANIFEST;

      call(
        "setEventBus",
        [this._component("EventBus")]
      );
      call("init", [manifest]);
      call("startAll");

      const summary =
        typeof component.summary === "function"
          ? component.summary()
          : null;

      if (
        summary &&
        Array.isArray(summary.failedModules)
      ) {
        summary.failedModules
          .filter((item) => !item.critical)
          .forEach((item) => {
            const warning =
              "Optional module " +
              item.name +
              " failed: " +
              (item.error || item.status);

            if (
              !this.warnings.includes(warning)
            ) {
              this.warnings.push(warning);
            }
          });
      }

      if (
        summary &&
        Array.isArray(summary.warnings)
      ) {
        summary.warnings.forEach((message) => {
          const warning =
            "Module warning: " + message;

          if (!this.warnings.includes(warning)) {
            this.warnings.push(warning);
          }
        });
      }

      return true;
    }

    return call("init");
  },

  _isComponentReady(name, component) {
    if (!component) {
      return false;
    }

    switch (name) {
      case "Logger":
        return [
          "log",
          "warn",
          "error",
        ].every(
          (method) =>
            typeof component[method] === "function"
        );

      case "HealthContract":
        return typeof component.create === "function";

      case "Config":
        return component.initialized === true;

      case "EntityMetadata":
        return (
          component.initialized === true &&
          component.list().length > 0
        );

      case "EntityRegistry":
        return (
          component.initialized === true &&
          component.ready === true &&
          component.list().length > 0
        );

      case "SchemaRegistry":
        return (
          component.initialized === true &&
          component.list().length > 0
        );

      case "SpreadsheetAdapter":
        return component.initialized === true;

      case "SchemaBuilder":
        return typeof component.build === "function";

      case "SchemaStorage":
        return (
          typeof component.load === "function" &&
          typeof component.save === "function"
        );

      case "SchemaManager":
        return (
          component.initialized === true &&
          component.state === "READY" &&
          component.getTables().length > 0
        );

      case "Database":
        return (
          component.initialized === true &&
          component.status === "READY" &&
          component.list().length > 0
        );

      case "BaseRepository":
        return component.ready() === true;

      case "RepositoryFactory":
        return component.initialized === true;

      case "RepositoryRegistry":
        return (
          component.ready === true &&
          component.list().length > 0 &&
          component.isReady() === true
        );

      case "AuditLog":
        return component.ready === true;

      case "EntityService":
        return component.ready === true;

      case "ERPEventContract":
        return (
          component.initialized === true &&
          typeof component.create === "function" &&
          typeof component.validate === "function"
        );

      case "EventBus":
        return component.ready === true;

      case "BusinessEventProcessor":
        return component.ready === true;

      case "ServiceRegistry":
        return component.initialized === true;

      case "ClientService":
      case "TransportOrderService":
      case "UserMembershipService":
        return component.initialized === true;

      case "ServerRequestContract":
      case "ServerIdempotencyStore":
      case "ServerActionRegistry":
      case "ServerRequestBoundary":
        return (
          component.initialized === true &&
          typeof component.health ===
            "function" &&
          component.health().status ===
            "OK"
        );

      case "ModuleRegistry":
        return (
          component.initialized === true &&
          typeof component.count === "function" &&
          component.count() > 0 &&
          typeof component.isReady === "function" &&
          component.isReady() === true
        );

      default:
        if ("initialized" in component) {
          return component.initialized === true;
        }

        if ("ready" in component) {
          return component.ready === true;
        }

        return true;
    }
  },

  _setComponentStatus(name, status, details) {
    this.componentStatus[name] = {
      status,
      critical:
        this.componentDefinitions[name].critical === true,
      dependencies: [
        ...this.componentDefinitions[name].dependencies,
      ],
      ...(details || {}),
    };
  },

  _start(name) {
    const definition =
      this.componentDefinitions[name];

    if (!definition) {
      throw new Error(
        "Lifecycle definition missing " + name
      );
    }

    if (
      this.started[name] === true &&
      this._isComponentReady(
        name,
        this._component(name)
      )
    ) {
      return true;
    }

    definition.dependencies.forEach((dependency) => {
      const dependencyStatus =
        this.componentStatus[dependency];

      if (
        !dependencyStatus ||
        dependencyStatus.status !== "READY"
      ) {
        throw new Error(
          name +
            " dependency is not ready " +
            dependency
        );
      }
    });

    const component = this._component(name);

    if (!component) {
      if (definition.critical) {
        throw new Error(name + " unavailable");
      }

      const skippedAt = new Date().toISOString();

      this._setComponentStatus(
        name,
        "SKIPPED",
        {
          reason: "OPTIONAL_COMPONENT_UNAVAILABLE",
          startedAt: skippedAt,
          finishedAt: skippedAt,
          duration: 0,
        }
      );

      this.bootLog.push({
        name,
        status: "SKIPPED",
        duration: 0,
      });

      return false;
    }

    const readyBeforeStart =
      this._isComponentReady(name, component);

    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    this._setComponentStatus(
      name,
      "STARTING",
      {
        startedAt,
        finishedAt: null,
        duration: null,
        error: null,
        readyBeforeStart,
      }
    );

    try {
      const contractErrors =
        this._contractErrors(
          name,
          component,
          definition
        );

      if (contractErrors.length) {
        throw new Error(
          contractErrors.join("; ")
        );
      }

      this._invokeInit(name, component);

      if (!this._isComponentReady(name, component)) {
        throw new Error(
          name +
            " did not confirm ready state"
        );
      }

      const duration = Date.now() - startTime;
      const finishedAt = new Date().toISOString();

      this.started[name] = true;

      this._setComponentStatus(
        name,
        "READY",
        {
          startedAt,
          finishedAt,
          duration,
          error: null,
          readyBeforeStart,
        }
      );

      this.bootLog.push({
        name,
        status: "READY",
        duration,
      });

      this._log("log", "READY " + name);

      return true;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.started[name] = false;

      this._setComponentStatus(
        name,
        "FAILED",
        {
          startedAt,
          finishedAt: new Date().toISOString(),
          duration,
          error: error.message,
          readyBeforeStart,
        }
      );

      this.bootLog.push({
        name,
        status: "FAILED",
        duration,
        error: error.message,
      });

      this._log(
        "error",
        name + " FAILED " + error.message
      );

      if (definition.critical) {
        throw error;
      }

      this.warnings.push(
        name + ": " + error.message
      );

      return false;
    }
  },

  // ============================================================
  // VALIDATION
  // ============================================================

  validate() {
    [
      "EntityMetadata",
      "EntityRegistry",
      "SchemaRegistry",
    ].forEach((name) => {
      const component = this._component(name);

      if (
        !component ||
        typeof component.validate !== "function"
      ) {
        throw new Error(
          name + ".validate unavailable"
        );
      }

      const result = component.validate();
      this._assertSync(
        result,
        name + ".validate"
      );

      if (
        Array.isArray(result) &&
        result.length
      ) {
        throw new Error(
          name +
            " validation errors: " +
            result.join(", ")
        );
      }

      if (result === false) {
        throw new Error(
          name + " validation failed"
        );
      }

      if (
        result &&
        typeof result === "object" &&
        result.valid === false
      ) {
        throw new Error(
          name +
            " validation failed: " +
            (result.error || "unknown error")
        );
      }
    });

    return true;
  },

  validateSecurity() {
    const roleErrors =
      this._component(
        "RoleManager"
      ).validate();
    const scopeErrors =
      this._component(
        "OrganizationScope"
      ).validate();

    this._assertSync(
      roleErrors,
      "RoleManager.validate"
    );
    this._assertSync(
      scopeErrors,
      "OrganizationScope.validate"
    );

    if (
      roleErrors.length ||
      scopeErrors.length
    ) {
      throw new Error(
        "Security validation failed: " +
          roleErrors
            .concat(scopeErrors)
            .join("; ")
      );
    }

    if (
      this._component(
        "SecurityContext"
      ).isAuthenticated() === true
    ) {
      /*
       * An already established request context is allowed to survive startup.
       * Startup itself must never manufacture one.
       */
      const current =
        this._component(
          "SecurityContext"
        ).get();

      if (!current) {
        throw new Error(
          "SecurityContext authenticated state is inconsistent"
        );
      }
    }

    return true;
  },

  validateServices() {
    const registry =
      this._component("ServiceRegistry");

    if (!registry) {
      throw new Error(
        "ServiceRegistry unavailable"
      );
    }

    const required = [
      "ClientService",
      "TransportOrderService",
    ];

    const registryErrors =
      registry.validate(required);

    this._assertSync(
      registryErrors,
      "ServiceRegistry.validate"
    );

    if (
      Array.isArray(registryErrors) &&
      registryErrors.length
    ) {
      throw new Error(
        "Service validation failed: " +
          registryErrors.join("; ")
      );
    }

    required.forEach((name) => {
      if (!registry.has(name)) {
        throw new Error(
          "Required service missing " + name
        );
      }

      const status = this.componentStatus[name];

      if (!status || status.status !== "READY") {
        throw new Error(
          "Required service is not ready " + name
        );
      }
    });

    return true;
  },

  // ============================================================
  // INIT
  // ============================================================

  init() {
    if (this.initialized) {
      if (!this.isReady()) {
        this.status = "FAILED";
        this.lastError =
          "SystemInit state is inconsistent";

        throw new Error(this.lastError);
      }

      return this.health();
    }

    if (this.initializing) {
      throw new Error(
        "SystemInit initialization already running"
      );
    }

    if (this.status === "FAILED") {
      const resetResult = this.reset();

      if (resetResult.status === "ERROR") {
        throw new Error(
          "SystemInit cannot recover from previous failure: " +
            resetResult.errors.join("; ")
        );
      }
    }

    this.initializing = true;
    this.status = "STARTING";
    this.startedAt = new Date().toISOString();
    this.finishedAt = null;
    this.duration = 0;
    this.lastError = null;
    this.bootLog = [];
    this.started = {};
    this.componentStatus = {};
    this.startupOrder = [];
    this.warnings = [];

    const startTime = Date.now();

    try {
      this._log(
        "log",
        "========== SYSTEM INIT START =========="
      );

      this.startupOrder =
        this.resolveOrder(
          this.componentDefinitions
        );

      this._preflight(this.startupOrder);

      this.startupOrder.forEach((name) => {
        this._start(name);
      });

      this.validate();
      this.validateSecurity();
      this.validateServices();

      const incompleteCritical =
        this.criticalComponents.filter(
          (name) =>
            !this.componentStatus[name] ||
            this.componentStatus[name].status !==
              "READY"
        );

      if (incompleteCritical.length) {
        throw new Error(
          "Critical components are not ready: " +
            incompleteCritical.join(", ")
        );
      }

      this.initialized = true;
      this.status = "READY";
      this.finishedAt = new Date().toISOString();
      this.duration = Date.now() - startTime;

      this.emitStart();

      this._log(
        "log",
        "========== SYSTEM INIT READY v" +
          this.version +
          " (" +
          this.duration +
          "ms) =========="
      );

      return this.health();
    } catch (error) {
      this.initialized = false;
      this.status = "FAILED";
      this.lastError = error.message;
      this.finishedAt = new Date().toISOString();
      this.duration = Date.now() - startTime;

      const rollbackErrors =
        this._resetComponents(
          this.startupOrder.filter(
            (name) => {
              const status =
                this.componentStatus[name];

              return (
                this.started[name] === true ||
                (
                  status &&
                  [
                    "STARTING",
                    "FAILED",
                  ].includes(status.status)
                )
              );
            }
          )
        );

      rollbackErrors.forEach((message) => {
        this.warnings.push(
          "Rollback: " + message
        );
      });

      this._log(
        "error",
        "SYSTEM INIT FAILED " + error.message
      );

      throw error;
    } finally {
      this.initializing = false;
    }
  },

  // ============================================================
  // EVENT
  // ============================================================

  emitStart() {
    const eventBus = this._component("EventBus");

    if (
      !eventBus ||
      typeof eventBus.emit !== "function"
    ) {
      return false;
    }

    try {
      const result = eventBus.emit(
        "ERP_STARTED",
        {
          version: this.version,
          status: this.status,
          components:
            this.criticalComponents.length,
          time: new Date().toISOString(),
        },
        {
          source: "SystemInit",
        }
      );

      this._assertSync(
        result,
        "EventBus.emit"
      );

      return true;
    } catch (error) {
      const warning =
        "ERP_STARTED event skipped: " +
        error.message;

      this.warnings.push(warning);
      this._log("warn", warning);
      return false;
    }
  },

  // ============================================================
  // READY / HEALTH
  // ============================================================

  isReady() {
    if (
      this.initialized !== true ||
      this.status !== "READY"
    ) {
      return false;
    }

    return this.criticalComponents.every((name) => {
      const status = this.componentStatus[name];

      return (
        status &&
        status.status === "READY" &&
        this._isComponentReady(
          name,
          this._component(name)
        )
      );
    });
  },

  _moduleLifecycle() {
    const registry =
      this._component("ModuleRegistry");

    if (!registry) {
      return {
        mode: "UNAVAILABLE",
        initialized: false,
        registered: 0,
        startCompleted: false,
        startedAll: false,
        readyForERP: false,
      };
    }

    const summary =
      typeof registry.summary === "function"
        ? registry.summary()
        : {
            initialized:
              registry.initialized === true,
            startCompleted:
              registry.startCompleted === true,
            startedAll:
              registry.startedAll === true,
            readyForERP:
              typeof registry.isReady ===
                "function"
                ? registry.isReady()
                : false,
            total:
              typeof registry.count ===
                "function"
                ? registry.count()
                : 0,
            ready: 0,
            failed: 0,
            criticalFailed: 0,
          };

    let mode = "REGISTERED_ONLY";

    if (summary.startCompleted) {
      if (
        summary.criticalFailed > 0 ||
        !summary.readyForERP
      ) {
        mode = "FAILED";
      } else if (
        summary.failed > 0 ||
        (
          Array.isArray(summary.warnings) &&
          summary.warnings.length > 0
        )
      ) {
        mode = "DEGRADED";
      } else {
        mode = "RUNNING";
      }
    }

    return {
      mode,
      initialized: summary.initialized,
      registered:
        summary.total ??
        (
          typeof registry.count === "function"
            ? registry.count()
            : 0
        ),
      startCompleted:
        summary.startCompleted === true,
      startedAll:
        summary.startedAll === true,
      readyForERP:
        summary.readyForERP === true,
      ready: summary.ready || 0,
      failed: summary.failed || 0,
      criticalFailed:
        summary.criticalFailed || 0,
      coverage: summary.coverage || 0,
      failedModules:
        summary.failedModules || [],
      warnings: summary.warnings || [],
      order: summary.order || [],
    };
  },

  health() {
    const ready = this.isReady();
    const hasWarnings =
      this.warnings.length > 0;

    return {
      module: "SystemInit",
      version: this.version,
      status:
        this.status === "FAILED"
          ? "FAILED"
          : ready && !hasWarnings
            ? "OK"
            : "WARNING",
      lifecycleStatus: this.status,
      initialized: this.initialized,
      initializing: this.initializing,
      ready,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
      duration: this.duration,
      lastError: this.lastError,
      critical: {
        required: this.criticalComponents,
        ready:
          this.criticalComponents.filter(
            (name) =>
              this.componentStatus[name] &&
              this.componentStatus[name].status ===
                "READY"
          ),
      },
      optionalWarnings: [...this.warnings],
      modules: this._moduleLifecycle(),
      components: { ...this.componentStatus },
    };
  },

  diagnostics() {
    const safeDiagnostics = (name) => {
      const component = this._component(name);

      if (!component) {
        return null;
      }

      const method =
        typeof component.diagnostics === "function"
          ? "diagnostics"
          : typeof component.health === "function"
            ? "health"
            : null;

      if (!method) {
        return null;
      }

      try {
        return component[method]();
      } catch (error) {
        return {
          status: "ERROR",
          error: error.message,
        };
      }
    };

    return {
      module: "SystemInit",
      version: this.version,
      status: this.status,
      initialized: this.initialized,
      initializing: this.initializing,
      ready: this.isReady(),
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
      duration: this.duration,
      lastError: this.lastError,
      order: [...this.startupOrder],
      graph: this.dependencyGraph,
      boot: [...this.bootLog],
      components: { ...this.componentStatus },
      warnings: [...this.warnings],
      modules: this._moduleLifecycle(),
      details: {
        security: {
          context:
            safeDiagnostics(
              "SecurityContext"
            ),
          guard:
            safeDiagnostics(
              "SecurityGuard"
            ),
          roles:
            safeDiagnostics(
              "RoleManager"
            ),
          organizationScope:
            safeDiagnostics(
              "OrganizationScope"
            ),
          userResolver:
            safeDiagnostics(
              "TrustedUserResolver"
            ),
          entryPoints:
            safeDiagnostics(
              "TrustedEntryPoints"
            ),
          serverRequestContract:
            safeDiagnostics(
              "ServerRequestContract"
            ),
          serverIdempotency:
            safeDiagnostics(
              "ServerIdempotencyStore"
            ),
          serverActions:
            safeDiagnostics(
              "ServerActionRegistry"
            ),
          serverBoundary:
            safeDiagnostics(
              "ServerRequestBoundary"
            ),
        },
        schema: safeDiagnostics("SchemaManager"),
        database: safeDiagnostics("Database"),
        factory: safeDiagnostics("RepositoryFactory"),
        registry: safeDiagnostics("RepositoryRegistry"),
        audit: safeDiagnostics("AuditLog"),
        services: safeDiagnostics("ServiceRegistry"),
      },
    };
  },

  // ============================================================
  // RESET
  // ============================================================

  _resetEventBus(component) {
    if (typeof component.reset !== "function") {
      throw new Error(
        "EventBus.reset unavailable"
      );
    }

    const result = component.reset();
    this._assertSync(
      result,
      "EventBus.reset"
    );

    if (result === false) {
      throw new Error(
        "EventBus.reset returned false"
      );
    }

    return true;
  },

  _resetBusinessEventProcessor(component) {
    if (typeof component.reset !== "function") {
      throw new Error(
        "BusinessEventProcessor.reset unavailable"
      );
    }

    const result = component.reset();
    this._assertSync(
      result,
      "BusinessEventProcessor.reset"
    );

    if (result === false) {
      throw new Error(
        "BusinessEventProcessor.reset returned false"
      );
    }

    return true;
  },

  _resetRepositoryRegistry(component) {
    if (
      typeof component.reset !==
      "function"
    ) {
      throw new Error(
        "RepositoryRegistry.reset unavailable"
      );
    }

    const result = component.reset();

    this._assertSync(
      result,
      "RepositoryRegistry.reset"
    );

    if (result === false) {
      throw new Error(
        "RepositoryRegistry.reset returned false"
      );
    }

    return result;
  },

  _resetModuleRegistry(component) {
    if (typeof component.reset !== "function") {
      throw new Error(
        "ModuleRegistry.reset unavailable"
      );
    }

    const result = component.reset();

    this._assertSync(
      result,
      "ModuleRegistry.reset"
    );

    if (result === false) {
      throw new Error(
        "ModuleRegistry.reset returned false"
      );
    }

    return true;
  },

  _resetComponent(name) {
    const component = this._component(name);

    if (!component) {
      return true;
    }

    if (name === "ModuleRegistry") {
      return this._resetModuleRegistry(component);
    }

    if (name === "BusinessEventProcessor") {
      return this._resetBusinessEventProcessor(
        component
      );
    }

    if (name === "EventBus") {
      return this._resetEventBus(component);
    }

    if (name === "RepositoryRegistry") {
      return this._resetRepositoryRegistry(
        component
      );
    }

    if (name === "ERPEventContract") {
      const result = component.reset();
      this._assertSync(
        result,
        "ERPEventContract.reset"
      );
      return result !== false;
    }

    if (name === "EntityMetadata") {
      component.initialized = false;
      return true;
    }

    if (
      name === "ClientService" ||
      name === "TransportOrderService"
    ) {
      const result =
        component.reset();

      this._assertSync(
        result,
        name + ".reset"
      );

      return result !== false;
    }

    if (
      name === "FinanceService" ||
      name === "KPIService"
    ) {
      if ("initialized" in component) {
        component.initialized = false;
      }

      if ("ready" in component) {
        component.ready = false;
      }

      return true;
    }

    // SchemaStorage intentionally has no reset here:
    // runtime reset must never erase persisted schema tables.
    if (
      name === "SchemaStorage" ||
      name === "SchemaBuilder" ||
      name === "HealthContract" ||
      name === "Logger"
    ) {
      return true;
    }

    if (typeof component.reset === "function") {
      const result = component.reset();

      this._assertSync(
        result,
        name + ".reset"
      );

      if (result === false) {
        throw new Error(
          name + ".reset returned false"
        );
      }
    }

    return true;
  },

  _resetComponents(order) {
    const errors = [];

    [...(order || [])]
      .reverse()
      .forEach((name) => {
        try {
          this._resetComponent(name);
          this.started[name] = false;
        } catch (error) {
          errors.push(
            name + ": " + error.message
          );
        }
      });

    return errors;
  },

  reset() {
    if (this.initializing) {
      throw new Error(
        "SystemInit cannot reset while initialization is running"
      );
    }

    this.status = "RESETTING";

    let order = [];

    try {
      order = this.resolveOrder(
        this.componentDefinitions
      );
    } catch (error) {
      order = Object.keys(
        this.componentDefinitions
      );
    }

    const errors =
      this._resetComponents(order);

    this.initialized = false;
    this.initializing = false;
    this.startedAt = null;
    this.finishedAt = new Date().toISOString();
    this.duration = 0;
    this.started = {};
    this.componentStatus = {};
    this.bootLog = [];
    this.startupOrder = [];
    this.warnings = [...errors];
    this.lastError =
      errors.length
        ? errors.join("; ")
        : null;
    this.status =
      errors.length
        ? "FAILED"
        : "CREATED";

    if (errors.length) {
      this._log(
        "error",
        "SystemInit RESET FAILED " +
          errors.join("; ")
      );

      return {
        status: "ERROR",
        errors,
      };
    }

    this._log(
      "log",
      "SystemInit RESET COMPLETE"
    );

    return {
      status: "RESET",
      errors: [],
    };
  },

  // Compatibility helper for old diagnostics.
  safeInit(name, args) {
    const component = this._component(name);

    if (!component) {
      throw new Error(name + " unavailable");
    }

    if (typeof component.init !== "function") {
      return true;
    }

    const result =
      component.init(args);

    this._assertSync(
      result,
      name + ".init"
    );

    return result;
  },
};

globalThis.SystemInit = SystemInit;

SystemInit._log(
  "log",
  "SystemInit REGISTERED v" + SystemInit.version
);
