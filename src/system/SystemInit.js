console.log("SystemInit v0.7.0");

const SystemInit = {
  version: "0.7.0",
  initialized: false,
  startedAt: null,

  init() {
    Logger.log("===== ERP SYSTEM START =====");

    if (this.initialized) {
      Logger.log("ERP SYSTEM ALREADY RUNNING");
      return this.health();
    }

    try {
      // ----- DATABASE LAYER -----
      if (typeof SchemaManager !== "undefined") {
        SchemaManager.init();
      }
      if (typeof Database !== "undefined") {
        Database.init();
      }

      // ----- CORE REGISTRY -----
      if (typeof Registry !== "undefined") {
        Registry.init();
      }

      // ----- EVENT BUS -----
      if (typeof EventBus !== "undefined") {
        EventBus.init();
      }

      // ----- ENTITY EVENT HANDLERS -----
      this.initHandlers();

      // ----- MODULE SYSTEM -----
      if (typeof ModuleLoader !== "undefined") {
        ModuleLoader.loadCore();
        ModuleLoader.initAll();
      }

      // ----- BUSINESS ENGINES -----
      this.initEngines();

      // ----- EVENT BUS HEALTH CHECK -----
      Logger.log(
        "EVENT LISTENERS CREATED=" +
        EventBus.listeners("TRANSPORT_ORDER_CREATED")
      );
      Logger.log(
        "EVENT LISTENERS UPDATED=" +
        EventBus.listeners("TRANSPORT_ORDER_UPDATED")
      );

      this.initialized = true;
      this.startedAt = new Date().toISOString();
      Logger.log("===== ERP SYSTEM READY v" + this.version + " =====");
    } catch (error) {
      Logger.error("ERP SYSTEM FAILED " + error.message);
      throw error;
    }

    return this.health();
  },

  // ----- EVENT HANDLERS (с диагностикой подписок) -----
  initHandlers() {
    const handlers = [
      "TransportOrderEventHandler",
      "LogisticsEventSubscriptions",
      "TripEventHandler",
      "ClientEventHandler"
    ];

    handlers.forEach(name => {
      if (
        typeof globalThis[name] !== "undefined" &&
        typeof globalThis[name].init === "function"
      ) {
        globalThis[name].init();

        // ----- ДИАГНОСТИКА ПОДПИСОК -----
        Logger.log(
          name +
          " SUBSCRIPTIONS=" +
          JSON.stringify(globalThis[name].subscriptions || [])
        );

        Logger.log(name + " INITIALIZED");
      }
    });
  },

  // ----- ENGINES -----
  initEngines() {
    const engines = [
      "FinanceEngine",
      "KPIEngine",
      "DashboardEngine"
    ];

    engines.forEach(name => {
      if (
        typeof globalThis[name] !== "undefined" &&
        typeof globalThis[name].init === "function"
      ) {
        globalThis[name].init();
        Logger.log(name + " STARTED");
      }
    });
  },

  health() {
    return HealthContract.create(
      "SystemInit",
      this.initialized ? "OK" : "WARNING",
      {
        version: this.version,
        initialized: this.initialized,
        startedAt: this.startedAt,
        eventHandlers: {
          TRANSPORT_ORDER_CREATED:
            typeof EventBus !== "undefined"
            ? EventBus.listeners("TRANSPORT_ORDER_CREATED")
            : 0
        },
        dependencies: {
          SchemaManager: typeof SchemaManager !== "undefined",
          Database: typeof Database !== "undefined",
          EventBus: typeof EventBus !== "undefined",
          EntityRegistry: typeof EntityRegistry !== "undefined",
          RepositoryFactory: typeof RepositoryFactory !== "undefined",
          ModuleLoader: typeof ModuleLoader !== "undefined"
        }
      }
    );
  }
};

globalThis.SystemInit = SystemInit;
Logger.log("SystemInit READY v0.7.0");