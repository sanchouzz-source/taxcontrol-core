// ============================================================
// ServiceRegistry v1.4.0
// TaxControl ERP Core
//
// Package F contract:
// - SystemInit owns service initialization
// - registry registration never initializes a service
// - required service APIs and ready state can be validated explicitly
// - managed USER membership operations are a required service contract
// ============================================================

console.log("ServiceRegistry v1.4.0");

const ServiceRegistry = {
  version: "1.4.0",

  initialized: false,
  services: {},
  lastRefresh: null,

  contracts: {
    UserMembershipService: [
      "init",
      "reset",
      "listMemberships",
      "createMembership",
      "updateMembership",
      "deactivateMembership",
      "reactivateMembership",
      "health",
    ],
    ClientService: [
      "init",
      "reset",
      "create",
      "findDuplicate",
      "health",
    ],
    TransportOrderService: [
      "init",
      "reset",
      "create",
      "assignVehicle",
      "complete",
      "health",
    ],
  },

  init() {
    if (this.initialized) {
      return true;
    }

    this.initialized = true;
    this.refresh();

    Logger.log(
      "ServiceRegistry READY v" +
        this.version +
        " count=" +
        this.count()
    );

    return true;
  },

  refresh() {
    this.registerDefaults();
    this.lastRefresh =
      new Date().toISOString();

    return true;
  },

  register(
    name,
    service,
    options = {}
  ) {
    if (!name) {
      throw new Error(
        "Service name required"
      );
    }

    if (!service) {
      return null;
    }

    const missing =
      this.missingMethods(
        name,
        service
      );

    if (missing.length) {
      throw new Error(
        name +
          " service API missing: " +
          missing.join(", ")
      );
    }

    if (
      this.services[name] &&
      !options.force
    ) {
      return this.services[name];
    }

    this.services[name] = service;

    return service;
  },

  registerIfExists(name, service) {
    if (!service) {
      Logger.warn(
        "Service unavailable " + name
      );
      return null;
    }

    return this.register(
      name,
      service
    );
  },

  registerDefaults() {
    [
      "UserMembershipService",
      "ClientService",
      "TransportOrderService",
      "FinanceService",
      "KPIService",
    ].forEach((name) => {
      const service =
        globalThis[name];

      if (!service) {
        if (
          name ===
            "UserMembershipService" ||
          name === "ClientService" ||
          name ===
            "TransportOrderService"
        ) {
          Logger.warn(
            "Service unavailable " +
              name
          );
        }

        return;
      }

      this.register(
        name,
        service,
        { force: true }
      );
    });

    return this.count();
  },

  missingMethods(name, service) {
    const contract =
      this.contracts[name] || [];

    return contract.filter(
      (method) =>
        typeof service[method] !==
        "function"
    );
  },

  get(name) {
    return this.services[name] || null;
  },

  has(name) {
    return !!this.services[name];
  },

  list() {
    return Object.keys(this.services);
  },

  count() {
    return this.list().length;
  },

  validate(
    required = [
      "UserMembershipService",
      "ClientService",
      "TransportOrderService",
    ]
  ) {
    const errors = [];

    required.forEach((name) => {
      const service = this.get(name);

      if (!service) {
        errors.push(
          "Required service missing " +
            name
        );
        return;
      }

      const missing =
        this.missingMethods(
          name,
          service
        );

      if (missing.length) {
        errors.push(
          name +
            " API missing: " +
            missing.join(", ")
        );
      }

      if (
        "initialized" in service &&
        service.initialized !== true
      ) {
        errors.push(
          name + " is not initialized"
        );
      }

      if (
        typeof service.health ===
        "function"
      ) {
        const health =
          service.health();

        if (
          !health ||
          health.status !== "OK"
        ) {
          errors.push(
            name + " health is not OK"
          );
        }
      }
    });

    return errors;
  },

  health() {
    const validation =
      this.initialized
        ? this.validate()
        : [
            "ServiceRegistry is not initialized",
          ];

    return {
      module: "ServiceRegistry",
      version: this.version,
      initialized:
        this.initialized,
      count: this.count(),
      services: this.list(),
      lastRefresh:
        this.lastRefresh,
      validation,
      status:
        this.initialized &&
        validation.length === 0
          ? "OK"
          : "NOT_READY",
    };
  },

  diagnostics() {
    return this.health();
  },

  reset() {
    this.services = {};
    this.initialized = false;
    this.lastRefresh = null;

    return true;
  },
};

globalThis.ServiceRegistry =
  ServiceRegistry;

Logger.log(
  "ServiceRegistry GLOBAL READY v" +
    ServiceRegistry.version
);
