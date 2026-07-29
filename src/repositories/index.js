// ============================================================
// RepositoryRegistry v3.0.0
// Managed Repository Lifecycle Registry
// TaxControl ERP Core
//
// Package F contract:
// - files only export repository objects; no top-level init/register
// - SystemInit starts repositories through RepositoryRegistry.init()
// - every lifecycle call is synchronous in Google Apps Script
// - reset releases bound BaseRepository instances in reverse order
// - Factory/Registry synchronization cannot recurse indefinitely
// ============================================================

console.log("RepositoryRegistry v3.0.0");

const RepositoryRegistry = {
  version: "3.0.0",

  ready: false,
  status: "CREATED",
  lastError: null,

  repositories: {},
  repositoryStatus: {},
  startupOrder: [],
  factorySyncCount: 0,

  aliases: {
    CLIENT: "CLIENT",
    Clients: "CLIENT",
    Client: "CLIENT",
    TRIP: "TRIP",
    Trip: "TRIP",
    VEHICLE: "VEHICLE",
    Vehicle: "VEHICLE",
    DRIVER: "DRIVER",
    Driver: "DRIVER",
    CARRIER: "CARRIER",
    Carrier: "CARRIER",
    ROUTE: "ROUTE",
    Route: "ROUTE",
    CARGO: "CARGO",
    Cargo: "CARGO",
    KPI: "KPI",
    AUDIT: "AUDIT",
    VERSION: "VERSION",
    FAILED_EVENT: "FAILED_EVENT",
    TRANSPORT_ORDER: "TRANSPORT_ORDER",
    CLIENT_FINANCE_PROFILE:
      "CLIENT_FINANCE_PROFILE",
    FINANCIAL_TRANSACTION:
      "FINANCIAL_TRANSACTION",
  },

  globalRepositories: {
    CLIENT: "ClientRepository",
    TRIP: "TripRepository",
    VEHICLE: "VehicleRepository",
    DRIVER: "DriverRepository",
    CARRIER: "CarrierRepository",
    ROUTE: "RouteRepository",
    CARGO: "CargoRepository",
    TRANSPORT_ORDER:
      "TransportOrderRepository",
    CLIENT_FINANCE_PROFILE:
      "ClientFinanceProfileRepository",
    FINANCIAL_TRANSACTION:
      "FinancialTransactionRepository",
    KPI: "KPIRepository",
    AUDIT: "AuditRepository",
    VERSION: "VersionRepository",
    FAILED_EVENT:
      "FailedEventRepository",
  },

  requiredMethods: [
    "create",
    "findById",
    "findAll",
    "update",
    "delete",
  ],

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

  normalize(entity) {
    if (!entity) {
      throw new Error(
        "RepositoryRegistry entity required"
      );
    }

    const key = String(entity).trim();

    return (
      this.aliases[key] ||
      this.aliases[key.toUpperCase()] ||
      key.toUpperCase()
    );
  },

  init() {
    if (this.isReady()) {
      return true;
    }

    if (this.status === "STARTING") {
      throw new Error(
        "RepositoryRegistry initialization already running"
      );
    }

    this.ready = false;
    this.status = "STARTING";
    this.lastError = null;
    this.repositoryStatus = {};
    this.startupOrder = [];

    try {
      this.collectGlobals();

      if (!this.count()) {
        throw new Error(
          "RepositoryRegistry: no repositories found"
        );
      }

      this.startAll();
      this.syncFactory();
      this.publish();

      this.ready = true;
      this.status = "READY";

      Logger.log(
        "RepositoryRegistry READY v" +
          this.version +
          " count=" +
          this.count()
      );

      return true;
    } catch (error) {
      this._rollbackStarted();
      this.ready = false;
      this.status = "FAILED";
      this.lastError = error.message;

      Logger.error(
        "RepositoryRegistry INIT FAILED " +
          error.message
      );

      throw error;
    }
  },

  refresh() {
    if (!this.ready) {
      return this.init();
    }

    this.collectGlobals();

    this.list().forEach((entity) => {
      if (
        this.repositoryStatus[entity]
          ?.status !== "READY"
      ) {
        this.initializeRepository(entity);
      }
    });

    this.syncFactory();
    this.publish();

    return this.count();
  },

  collectGlobals() {
    Object.keys(this.globalRepositories)
      .forEach((entity) => {
        const name =
          this.globalRepositories[entity];
        const repository =
          globalThis[name];

        if (!repository) {
          return;
        }

        this.register(
          entity,
          repository,
          {
            force: true,
            skipFactory: true,
            initialize: false,
          }
        );
      });

    return this.count();
  },

  register(
    entity,
    repository,
    options = {}
  ) {
    const key = this.normalize(entity);

    if (!repository) {
      throw new Error(
        "Repository missing " + key
      );
    }

    if (
      this.repositories[key] &&
      !options.force
    ) {
      return this.repositories[key];
    }

    this.repositories[key] = repository;

    if (
      options.skipFactory !== true
    ) {
      this.syncFactoryEntity(
        key,
        repository
      );
    }

    if (
      this.ready &&
      options.initialize !== false
    ) {
      this.initializeRepository(key);
    }

    return repository;
  },

  notifyLoaded(entity, repository) {
    return this.register(
      entity,
      repository,
      { force: true }
    );
  },

  registerLoaded(entity, repository) {
    return this.notifyLoaded(
      entity,
      repository
    );
  },

  initializeRepository(entity) {
    const key = this.normalize(entity);
    const repository =
      this.repositories[key];

    if (!repository) {
      throw new Error(
        "Repository not found " + key
      );
    }

    const missing =
      this.requiredMethods.filter(
        (method) =>
          typeof repository[method] !==
          "function"
      );

    if (missing.length) {
      throw new Error(
        key +
          " repository API missing: " +
          missing.join(", ")
      );
    }

    const startedAt =
      new Date().toISOString();

    this.repositoryStatus[key] = {
      status: "STARTING",
      startedAt,
      error: null,
    };

    try {
      if (
        typeof repository.init ===
        "function"
      ) {
        const initResult =
          repository.init();

        this._assertSync(
          initResult,
          key + ".init"
        );

        if (initResult === false) {
          throw new Error(
            key + ".init returned false"
          );
        }
      }

      if (
        typeof repository.register ===
        "function"
      ) {
        const registerResult =
          repository.register();

        this._assertSync(
          registerResult,
          key + ".register"
        );

        if (registerResult === false) {
          throw new Error(
            key + ".register returned false"
          );
        }
      }

      this.repositories[key] =
        repository;

      this.syncFactoryEntity(
        key,
        repository
      );

      this.repositoryStatus[key] = {
        status: "READY",
        startedAt,
        finishedAt:
          new Date().toISOString(),
        error: null,
      };

      if (!this.startupOrder.includes(key)) {
        this.startupOrder.push(key);
      }

      return repository;
    } catch (error) {
      try {
        this._resetRepository(
          repository,
          key
        );
      } catch (resetError) {
        Logger.warn(
          "Repository failure rollback failed " +
            key +
            ": " +
            resetError.message
        );
      }

      this.repositoryStatus[key] = {
        status: "FAILED",
        startedAt,
        finishedAt:
          new Date().toISOString(),
        error: error.message,
      };

      throw new Error(
        key +
          " repository initialization failed: " +
          error.message
      );
    }
  },

  startAll() {
    this.list().forEach((entity) => {
      this.initializeRepository(entity);
    });

    return true;
  },

  get(entity) {
    const key = this.normalize(entity);
    const repository =
      this.repositories[key];

    if (!repository) {
      throw new Error(
        "Repository not found " + key
      );
    }

    return repository;
  },

  getRepository(entity) {
    return this.get(entity);
  },

  has(entity) {
    try {
      return !!this.repositories[
        this.normalize(entity)
      ];
    } catch (error) {
      return false;
    }
  },

  list() {
    return Object.keys(
      this.repositories
    );
  },

  count() {
    return this.list().length;
  },

  syncFactoryEntity(entity, repository) {
    if (
      typeof RepositoryFactory ===
        "undefined" ||
      typeof RepositoryFactory.register !==
        "function"
    ) {
      return false;
    }

    RepositoryFactory.register(
      entity,
      repository,
      {
        force: true,
        skipRegistry: true,
      }
    );

    this.factorySyncCount++;

    return true;
  },

  syncFactory() {
    this.list().forEach((entity) => {
      this.syncFactoryEntity(
        entity,
        this.repositories[entity]
      );
    });

    return true;
  },

  publish() {
    if (
      typeof CoreRegistry !==
        "undefined" &&
      typeof CoreRegistry.register ===
        "function"
    ) {
      CoreRegistry.register(
        "Repositories",
        this.repositories
      );
    }

    return true;
  },

  _resetRepository(repository, entity) {
    if (!repository) {
      return true;
    }

    if (
      typeof repository.reset ===
      "function"
    ) {
      const result =
        repository.reset();

      this._assertSync(
        result,
        entity + ".reset"
      );

      if (result === false) {
        throw new Error(
          entity + ".reset returned false"
        );
      }

      return true;
    }

    if ("base" in repository) {
      repository.base = null;
    }

    if ("_base" in repository) {
      repository._base = null;
    }

    if ("initialized" in repository) {
      repository.initialized = false;
    }

    if ("registered" in repository) {
      repository.registered = false;
    }

    return true;
  },

  _rollbackStarted() {
    [...this.startupOrder]
      .reverse()
      .forEach((entity) => {
        try {
          this._resetRepository(
            this.repositories[entity],
            entity
          );
        } catch (error) {
          Logger.warn(
            "Repository rollback failed " +
              entity +
              ": " +
              error.message
          );
        }
      });

    this.startupOrder = [];

    return true;
  },

  reset() {
    const errors = [];

    [...this.startupOrder]
      .reverse()
      .forEach((entity) => {
        try {
          this._resetRepository(
            this.repositories[entity],
            entity
          );
        } catch (error) {
          errors.push(
            entity + ": " + error.message
          );
        }
      });

    this.repositories = {};
    this.repositoryStatus = {};
    this.startupOrder = [];
    this.factorySyncCount = 0;
    this.ready = false;
    this.status =
      errors.length
        ? "FAILED"
        : "CREATED";
    this.lastError =
      errors.length
        ? errors.join("; ")
        : null;

    if (errors.length) {
      throw new Error(
        "RepositoryRegistry reset failed: " +
          errors.join("; ")
      );
    }

    return true;
  },

  isReady() {
    if (
      !this.ready ||
      this.status !== "READY" ||
      !this.count()
    ) {
      return false;
    }

    return this.list().every(
      (entity) =>
        this.repositoryStatus[entity]
          ?.status === "READY"
    );
  },

  getHealthReport() {
    return this.list().map((entity) => {
      const repository =
        this.repositories[entity];

      return {
        entity,
        version:
          repository.version || "-",
        table:
          repository.table || "-",
        status:
          this.repositoryStatus[entity]
            ?.status || "REGISTERED",
        factory:
          typeof RepositoryFactory !==
            "undefined" &&
          typeof RepositoryFactory.has ===
            "function"
            ? RepositoryFactory.has(entity)
            : false,
        health:
          typeof repository.health ===
          "function"
            ? repository.health()
            : null,
      };
    });
  },

  diagnostics() {
    return {
      module: "RepositoryRegistry",
      version: this.version,
      ready: this.ready,
      status: this.status,
      count: this.count(),
      factorySyncCount:
        this.factorySyncCount,
      repositories: this.list(),
      repositoryStatus: {
        ...this.repositoryStatus,
      },
      startupOrder: [
        ...this.startupOrder,
      ],
      lastError: this.lastError,
      timestamp:
        new Date().toISOString(),
    };
  },

  health() {
    const data = this.diagnostics();
    const status =
      this.isReady()
        ? "OK"
        : "WARNING";

    if (
      typeof HealthContract !==
        "undefined" &&
      typeof HealthContract.create ===
        "function"
    ) {
      return HealthContract.create(
        "RepositoryRegistry",
        status,
        data
      );
    }

    return {
      module: "RepositoryRegistry",
      status,
      ...data,
    };
  },
};

globalThis.RepositoryRegistry =
  RepositoryRegistry;

Logger.log(
  "RepositoryRegistry GLOBAL READY v" +
    RepositoryRegistry.version
);
