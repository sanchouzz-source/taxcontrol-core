console.log("SystemInit v0.9.1");

const SystemInit = {
  version: "0.9.1",

  initialized: false,
  startedAt: null,

  // ----- БЕЗОПАСНЫЙ ЗАГРУЗЧИК (safeInit) -----
  safeInit(name) {
    try {
      if (
        typeof globalThis[name] !== "undefined" &&
        typeof globalThis[name].init === "function"
      ) {
        globalThis[name].init();
        Logger.log(name + " STARTED");
      } else {
        Logger.debug(name + " not available or has no init()");
      }
    } catch (e) {
      Logger.error(name + " FAILED: " + e.message);
      // Не перебрасываем ошибку, чтобы запуск системы продолжался
    }
  },

  init() {
    if (this.initialized) {
      Logger.log("ERP SYSTEM ALREADY RUNNING");
      return this.health();
    }

    Logger.log("===== ERP SYSTEM START =====");

    try {
      // ==========================
      // 1. CORE DATABASE
      // ==========================
      this.initCore();

      // ==========================
      // 2. EVENT SYSTEM
      // ==========================
      this.initEvents();

      // ==========================
      // 3. MODULES (безопасно)
      // ==========================
      this.initModules();

      // ==========================
      // 4. BUSINESS PIPELINE (безопасно)
      // ==========================
      this.initPipeline();

      // ==========================
      // 5. SERVICES
      // ==========================
      this.initServices();

      this.initialized = true;
      this.startedAt = new Date().toISOString();

      Logger.log("===== ERP SYSTEM READY v" + this.version + " =====");
    } catch (e) {
      Logger.log("ERP SYSTEM FAILED " + e.message);
      throw e;
    }

    return this.health();
  },

  initCore() {
    const core = ["SchemaManager", "Database", "Registry"];
    core.forEach(name => {
      if (
        typeof globalThis[name] !== "undefined" &&
        typeof globalThis[name].init === "function"
      ) {
        globalThis[name].init();
        Logger.log(name + " STARTED");
      }
    });
  },

  initEvents() {
    if (typeof EventBus !== "undefined") {
      EventBus.init();
      Logger.log("EventBus STARTED");
    }
  },

  // ----- ИНИЦИАЛИЗАЦИЯ МОДУЛЕЙ (безопасно) -----
  initModules() {
    // Список модулей, которые могут упасть – загружаем через safeInit
    const modules = [
      "TripConstants",
      "TripStatus",
      "TransportOrderEventHandler",
      "AuditEventHandler"
    ];

    modules.forEach(name => this.safeInit(name));

    // ModuleLoader – основной загрузчик
    if (typeof ModuleLoader !== "undefined") {
      try {
        ModuleLoader.loadCore();
        ModuleLoader.initAll();
        Logger.log("MODULES READY");
      } catch (e) {
        Logger.error("ModuleLoader FAILED: " + e.message);
      }
    }
  },

  // ----- БИЗНЕС-ПАЙПЛАЙН (безопасно) -----
  initPipeline() {
    const pipeline = [
      "BusinessEventProcessor",
      "TransportOrderEventHandler",
      "TripEventHandler"
    ];

    pipeline.forEach(name => this.safeInit(name));
  },

  initServices() {
    const services = ["FinanceEngine", "KPIEngine", "DashboardEngine"];
    services.forEach(name => {
      if (
        typeof globalThis[name] !== "undefined" &&
        typeof globalThis[name].init === "function"
      ) {
        globalThis[name].init();
        Logger.log(name + " READY");
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
        pipeline: {
          BusinessEventProcessor: typeof BusinessEventProcessor !== "undefined",
          TransportOrderEventHandler: typeof TransportOrderEventHandler !== "undefined",
          TripEventHandler: typeof TripEventHandler !== "undefined"
        },
        dependencies: {
          Database: typeof Database !== "undefined",
          EventBus: typeof EventBus !== "undefined",
          EntityRegistry: typeof EntityRegistry !== "undefined",
          RepositoryFactory: typeof RepositoryFactory !== "undefined"
        }
      }
    );
  }
};

globalThis.SystemInit = SystemInit;
Logger.log("SystemInit READY v" + SystemInit.version);