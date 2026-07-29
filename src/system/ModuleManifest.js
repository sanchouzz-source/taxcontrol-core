// ============================================================
// ModuleManifest v3.1.0
// Declarative ERP Module Manifest
// TaxControl ERP Core
//
// Package D contract:
// - metadata and lifecycle wrapper stay together
// - infrastructure requirements are not mixed with provided API
// - every lifecycle call is synchronous for Google Apps Script
// - every manifest entry resolves a real implementation
// - active event subscribers are owned by manifest lifecycle
// ============================================================

console.log("ModuleManifest v3.1.0");

function moduleManifestAssertSync(result, label) {
  if (
    result &&
    typeof result.then === "function"
  ) {
    throw new Error(
      label +
        " must be synchronous in Google Apps Script"
    );
  }

  if (result === false) {
    throw new Error(label + " returned false");
  }

  return result;
}

function createModule(config) {
  if (
    !config ||
    typeof config !== "object" ||
    !config.name
  ) {
    throw new Error(
      "Module manifest entry requires name"
    );
  }

  const provided = config.provides || {};

  const definition = {
    apiVersion: "3.0",
    enabled: true,
    autoStart: true,
    critical: false,
    productionReady: false,
    phase: "APPLICATION",
    priority: 100,
    implementation: config.name,
    implementationRequired: true,
    componentDependencies: [],
    optionalComponentDependencies: [],
    moduleDependencies: [],
    provides: {
      services: [],
      entities: [],
      events: [],
      permissions: [],
    },
    tags: [],
    ...config,
  };

  definition.componentDependencies = [
    ...(
      config.componentDependencies ||
      config.requires?.components ||
      config.dependencies ||
      []
    ),
  ];

  definition.moduleDependencies = [
    ...(
      config.moduleDependencies ||
      config.requires?.modules ||
      []
    ),
  ];

  definition.optionalComponentDependencies = [
    ...(
      config.optionalComponentDependencies ||
      config.requires?.optionalComponents ||
      []
    ),
  ];

  definition.provides = {
    services: [
      ...(
        provided.services ||
        config.services ||
        []
      ),
    ],
    entities: [
      ...(
        provided.entities ||
        config.entities ||
        []
      ),
    ],
    events: [
      ...(
        provided.events ||
        config.events ||
        []
      ),
    ],
    permissions: [
      ...(
        provided.permissions ||
        config.permissions ||
        []
      ),
    ],
  };

  delete definition.dependencies;
  delete definition.requires;
  delete definition.services;
  delete definition.entities;
  delete definition.events;
  delete definition.permissions;

  return {
    moduleDefinition: definition,

    context: null,
    registered: false,
    initialized: false,
    started: false,
    lastError: null,

    implementation() {
      return (
        globalThis[definition.implementation] ||
        null
      );
    },

    requireImplementation() {
      const implementation =
        this.implementation();

      if (
        !implementation &&
        definition.implementationRequired !== false
      ) {
        throw new Error(
          definition.name +
            " implementation unavailable: " +
            definition.implementation
        );
      }

      return implementation;
    },

    invoke(method, context) {
      const implementation =
        this.requireImplementation();

      if (
        !implementation ||
        typeof implementation[method] !== "function"
      ) {
        return true;
      }

      return moduleManifestAssertSync(
        implementation[method](context),
        definition.name +
          "." +
          definition.implementation +
          "." +
          method
      );
    },

    register(context) {
      if (this.registered) {
        return true;
      }

      this.context = context || this.context;
      this.invoke("register", this.context);
      this.registered = true;
      return true;
    },

    validate(context) {
      this.context = context || this.context;
      const implementation =
        this.requireImplementation();

      if (
        implementation &&
        typeof implementation.validate ===
          "function"
      ) {
        const result = moduleManifestAssertSync(
          implementation.validate(this.context),
          definition.name +
            "." +
            definition.implementation +
            ".validate"
        );

        if (
          Array.isArray(result) &&
          result.length
        ) {
          throw new Error(result.join("; "));
        }

        if (
          result &&
          typeof result === "object" &&
          result.valid === false
        ) {
          throw new Error(
            result.error ||
              "Implementation validation failed"
          );
        }
      }

      return true;
    },

    init(context) {
      if (this.initialized) {
        return true;
      }

      this.context = context || this.context;
      this.invoke("init", this.context);
      this.initialized = true;
      return true;
    },

    start(context) {
      if (this.started) {
        return true;
      }

      this.context = context || this.context;
      this.invoke("start", this.context);
      this.started = true;
      return true;
    },

    stop(context) {
      this.context = context || this.context;

      const implementation =
        this.implementation();

      if (implementation) {
        if (
          typeof implementation.stop === "function"
        ) {
          moduleManifestAssertSync(
            implementation.stop(this.context),
            definition.name +
              "." +
              definition.implementation +
              ".stop"
          );
        }

        if (
          typeof implementation.reset ===
          "function"
        ) {
          moduleManifestAssertSync(
            implementation.reset(this.context),
            definition.name +
              "." +
              definition.implementation +
              ".reset"
          );
        } else {
          if ("ready" in implementation) {
            implementation.ready = false;
          }

          if ("initialized" in implementation) {
            implementation.initialized = false;
          }

          if ("registered" in implementation) {
            implementation.registered = false;
          }
        }
      }

      this.context = null;
      this.registered = false;
      this.initialized = false;
      this.started = false;
      this.lastError = null;
      return true;
    },

    destroy(context) {
      const implementation =
        this.implementation();

      if (
        implementation &&
        typeof implementation.destroy ===
          "function"
      ) {
        moduleManifestAssertSync(
          implementation.destroy(
            context || this.context
          ),
          definition.name +
            "." +
            definition.implementation +
            ".destroy"
        );
      }

      return true;
    },

    health() {
      const implementation =
        this.implementation();

      if (
        implementation &&
        typeof implementation.health ===
          "function"
      ) {
        return moduleManifestAssertSync(
          implementation.health(),
          definition.name +
            "." +
            definition.implementation +
            ".health"
        );
      }

      const details = {
        version: definition.version,
        implementation:
          definition.implementation,
        registered: this.registered,
        initialized: this.initialized,
        started: this.started,
      };

      if (
        typeof HealthContract !== "undefined" &&
        typeof HealthContract.create === "function"
      ) {
        return HealthContract.create(
          definition.name,
          this.started ? "OK" : "WARNING",
          details
        );
      }

      return {
        module: definition.name,
        status: this.started
          ? "OK"
          : "WARNING",
        details,
      };
    },

    diagnostics() {
      return {
        name: definition.name,
        version: definition.version,
        phase: definition.phase,
        implementation:
          definition.implementation,
        registered: this.registered,
        initialized: this.initialized,
        started: this.started,
        lastError: this.lastError,
        definition: {
          ...definition,
          componentDependencies: [
            ...definition.componentDependencies,
          ],
          optionalComponentDependencies: [
            ...definition.optionalComponentDependencies,
          ],
          moduleDependencies: [
            ...definition.moduleDependencies,
          ],
        },
      };
    },
  };
}

const ERP_MODULE_MANIFEST = {
  TransportOrderModule: createModule({
    name: "TransportOrderModule",
    version: "1.2.0",
    description:
      "Управление транспортными заказами",
    owner: "LOGISTICS",
    phase: "DOMAIN",
    priority: 100,
    critical: true,
    implementation: "TransportOrderService",
    componentDependencies: [
      "Database",
      "EntityRegistry",
      "EntityService",
      "EventBus",
      "TransportOrderService",
    ],
    provides: {
      entities: ["TRANSPORT_ORDER"],
      events: [
        "TRANSPORT_ORDER_CREATED",
        "TRANSPORT_ORDER_UPDATED",
        "TRANSPORT_ORDER_DELETED",
      ],
      services: ["TransportOrderService"],
    },
  }),

  TripModule: createModule({
    name: "TripModule",
    version: "1.2.0",
    description: "Управление рейсами",
    owner: "LOGISTICS",
    phase: "DOMAIN",
    priority: 95,
    implementation: "TripRepository",
    componentDependencies: [
      "Database",
      "EntityService",
      "EventBus",
      "TripRepository",
    ],
    provides: {
      entities: ["TRIP"],
      events: [
        "TRIP_CREATED",
        "TRIP_STARTED",
        "TRIP_COMPLETED",
        "TRIP_DELAYED",
      ],
    },
  }),

  CRMSubscriptions: createModule({
    name: "CRMSubscriptions",
    version: "2.1.0",
    description: "CRM события клиентов",
    owner: "CRM",
    phase: "APPLICATION",
    priority: 80,
    componentDependencies: [
      "EntityService",
      "EventBus",
    ],
    provides: {
      entities: ["CLIENT"],
      events: [
        "CLIENT_CREATED",
        "CLIENT_UPDATED",
      ],
    },
  }),

  KPIEngine: createModule({
    name: "KPIEngine",
    version: "1.1.0",
    description: "Расчёт KPI",
    owner: "ANALYTICS",
    phase: "APPLICATION",
    priority: 70,
    componentDependencies: [
      "Database",
      "EventBus",
      "KPIService",
    ],
    provides: {
      services: ["KPI"],
    },
  }),

  KPISubscriptions: createModule({
    name: "KPISubscriptions",
    version: "2.1.0",
    description:
      "Обновление KPI через события",
    owner: "ANALYTICS",
    phase: "APPLICATION",
    priority: 60,
    componentDependencies: [
      "EventBus",
      "EntityService",
    ],
    moduleDependencies: ["KPIEngine"],
    provides: {
      entities: ["KPI"],
    },
  }),

  NotificationSubscriptions: createModule({
    name: "NotificationSubscriptions",
    version: "2.1.0",
    description: "Система уведомлений",
    owner: "COMMUNICATION",
    phase: "APPLICATION",
    priority: 30,
    componentDependencies: [
      "EventBus",
    ],
    optionalComponentDependencies: [
      "NotificationService",
    ],
    provides: {
      events: [
        "TRANSPORT_ORDER_CREATED",
        "TRIP_COMPLETED",
        "CLIENT_CREATED",
      ],
    },
  }),

  FinanceEngine: createModule({
    name: "FinanceEngine",
    version: "1.1.0",
    description: "Финансовый движок",
    owner: "FINANCE",
    phase: "SERVICES",
    priority: 70,
    componentDependencies: [
      "Database",
      "EntityService",
      "EventBus",
    ],
    provides: {
      entities: [
        "FINANCIAL_TRANSACTION",
        "CLIENT_FINANCE_PROFILE",
      ],
      services: ["Finance"],
    },
  }),

  DashboardEngine: createModule({
    name: "DashboardEngine",
    version: "1.2.0",
    description: "Dashboard и отчёты",
    owner: "REPORTING",
    phase: "REPORTING",
    priority: 40,
    componentDependencies: [
      "Database",
      "EntityService",
      "EventBus",
      "DashboardService",
      "SpreadsheetApp",
    ],
    provides: {
      services: ["Dashboard"],
    },
  }),

  EventSubscriptions: createModule({
    name: "EventSubscriptions",
    version: "1.1.0",
    description:
      "Управляемое обновление dashboard по событиям сущностей",
    owner: "REPORTING",
    phase: "REPORTING",
    priority: 20,
    critical: false,
    componentDependencies: [
      "EventBus",
      "ERPEventContract",
      "EntityEvents",
    ],
    moduleDependencies: [
      "DashboardEngine",
    ],
    provides: {
      events: [
        "CLIENT_CREATED",
        "TRIP_CREATED",
        "TRANSPORT_ORDER_CREATED",
      ],
    },
  }),
};

Object.defineProperty(
  ERP_MODULE_MANIFEST,
  "manifestVersion",
  {
    enumerable: false,
    value: "3.1.0",
  }
);

Object.defineProperty(
  ERP_MODULE_MANIFEST,
  "phases",
  {
    enumerable: false,
    value: [
      "DOMAIN",
      "APPLICATION",
      "SERVICES",
      "REPORTING",
    ],
  }
);

Object.defineProperty(
  ERP_MODULE_MANIFEST,
  "list",
  {
    enumerable: false,
    value() {
      return Object.keys(this).filter((name) => {
        const item = this[name];

        return (
          item &&
          typeof item === "object" &&
          item.moduleDefinition &&
          item.moduleDefinition.name
        );
      });
    },
  }
);

Object.defineProperty(
  ERP_MODULE_MANIFEST,
  "get",
  {
    enumerable: false,
    value(name) {
      return this[name] || null;
    },
  }
);

Object.defineProperty(
  ERP_MODULE_MANIFEST,
  "validate",
  {
    enumerable: false,
    value() {
      const errors = [];
      const names = this.list();
      const nameSet = {};
      const phaseIndex = {};

      this.phases.forEach((phase, index) => {
        phaseIndex[phase] = index;
      });

      names.forEach((key) => {
        const item = this[key];
        const definition =
          item.moduleDefinition || {};

        if (!definition.name) {
          errors.push(key + ": name missing");
          return;
        }

        if (nameSet[definition.name]) {
          errors.push(
            key +
              ": duplicate module name " +
              definition.name
          );
        }

        nameSet[definition.name] = true;

        if (!(definition.phase in phaseIndex)) {
          errors.push(
            definition.name +
              ": invalid phase " +
              definition.phase
          );
        }

        [
          "componentDependencies",
          "optionalComponentDependencies",
          "moduleDependencies",
        ].forEach((field) => {
          if (!Array.isArray(definition[field])) {
            errors.push(
              definition.name +
                ": " +
                field +
                " missing"
            );
          }
        });

        [
          "register",
          "validate",
          "init",
          "start",
          "stop",
          "health",
        ].forEach((method) => {
          if (typeof item[method] !== "function") {
            errors.push(
              definition.name +
                ": " +
                method +
                " missing"
            );
          }
        });
      });

      names.forEach((key) => {
        const definition =
          this[key].moduleDefinition;

        definition.moduleDependencies
          .forEach((dependencyName) => {
            const dependency =
              this[dependencyName];

            if (!dependency) {
              errors.push(
                definition.name +
                  ": unknown module dependency " +
                  dependencyName
              );
              return;
            }

            if (
              phaseIndex[
                dependency.moduleDefinition.phase
              ] > phaseIndex[definition.phase]
            ) {
              errors.push(
                definition.name +
                  ": dependency " +
                  dependencyName +
                  " starts in a later phase"
              );
            }
          });
      });

      return errors;
    },
  }
);

Object.defineProperty(
  ERP_MODULE_MANIFEST,
  "health",
  {
    enumerable: false,
    value() {
      const errors = this.validate();
      const details = {
        version: this.manifestVersion,
        modules: this.list(),
        count: this.list().length,
        errors,
      };

      if (
        typeof HealthContract !== "undefined" &&
        typeof HealthContract.create === "function"
      ) {
        return HealthContract.create(
          "ERP_MODULE_MANIFEST",
          errors.length ? "WARNING" : "OK",
          details
        );
      }

      return {
        module: "ERP_MODULE_MANIFEST",
        status: errors.length
          ? "WARNING"
          : "OK",
        details,
      };
    },
  }
);

globalThis.ERP_MODULE_MANIFEST =
  ERP_MODULE_MANIFEST;

Logger.log(
  "ModuleManifest READY v" +
    ERP_MODULE_MANIFEST.manifestVersion +
    " modules=" +
    ERP_MODULE_MANIFEST.list().length
);
