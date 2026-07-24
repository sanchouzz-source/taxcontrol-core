// ============================================================
// SystemInit v2.1.1 – Улучшенный оркестратор с гибкой синхронизацией
// ============================================================
console.log("SystemInit v2.1.1");

const SystemInit = {
  version: "2.1.1",
  initialized: false,
  startedAt: null,
  bootLog: [],
  started: {},
  componentStatus: {},

  phases: {
    BOOTSTRAP:   { order: 0, label: "BOOTSTRAP" },
    CORE:        { order: 1, label: "CORE" },
    MIGRATION:   { order: 2, label: "MIGRATION" },
    ENTITY:      { order: 3, label: "ENTITY" },
    EVENT:       { order: 4, label: "EVENT" },
    DOMAIN:      { order: 5, label: "DOMAIN" },
    APPLICATION: { order: 6, label: "APPLICATION" },
    SERVICES:    { order: 7, label: "SERVICES" },
    REPORTING:   { order: 8, label: "REPORTING" },
    VALIDATION:  { order: 9, label: "VALIDATION" },
    HEALTHCHECK: { order: 10, label: "HEALTHCHECK" },
    READY:       { order: 11, label: "READY" }
  },

  // ---------- ОБНОВЛЁННЫЙ ГРАФ ЗАВИСИМОСТЕЙ ----------
  dependencyGraph: {
    Config: [],
    Logger: [],
    SchemaManager: [],
    Database: ["SchemaManager"],
    EntityMetadata: [],
    EntityRegistry: ["EntityMetadata"],
    Registry: ["EntityMetadata"],               // больше не ждёт EntityRegistry
    RepositoryFactory: ["EntityMetadata"],      // зависит от EntityMetadata
    ERPEventContract: [],
    EventBus: ["ERPEventContract"],
    BusinessEventProcessor: ["EventBus"]
  },

  // ---------- КРИТИЧЕСКИЕ КОМПОНЕНТЫ (только жизненно важные) ----------
  criticalComponents: [
    "Config",
    "Logger",
    "SchemaManager",
    "Database",
    "EventBus",
    "BusinessEventProcessor"
  ],

  // ---------- ФАЗЫ КОМПОНЕНТОВ ----------
  componentPhase: {
    Config: "BOOTSTRAP",
    Logger: "BOOTSTRAP",
    SchemaManager: "CORE",
    Database: "CORE",
    EntityMetadata: "ENTITY",
    EntityRegistry: "ENTITY",
    Registry: "ENTITY",
    RepositoryFactory: "ENTITY",
    ERPEventContract: "EVENT",
    EventBus: "EVENT",
    BusinessEventProcessor: "EVENT"
  },

  // ---------- ФИКСАЦИЯ УСПЕШНОГО ЗАПУСКА КОМПОНЕНТА ----------
  _syncStarted(name) {
    this.started[name] = true;
    this.componentStatus[name] = {
      status: "OK",
      timestamp: new Date().toISOString()
    };
    Logger.debug(`SYNC STARTED ${name}`);
  },

  // ---------- УЛУЧШЕННАЯ СИНХРОНИЗАЦИЯ СОСТОЯНИЯ ----------
  _syncComponentState(name) {
    const obj = globalThis[name];
    if (!obj) return false;

    // Расширенные признаки готовности (учитываем старые модули)
    const ready =
      obj.ready === true ||
      obj.initialized === true ||
      obj.status === "READY" ||
      typeof obj.health === "function" ||
      obj.version !== undefined;

    if (ready) {
      if (!this.started[name]) {
        this.started[name] = true;
        this.componentStatus[name] = {
          status: "OK",
          restored: true,
          timestamp: new Date().toISOString()
        };
        Logger.debug(`STATE SYNC ${name} = READY`);
      }
      return true;
    }
    return false;
  },

  // ---------- ИНИЦИАЛИЗАЦИЯ КОМПОНЕНТА ----------
  async _initComponent(name, fn, phase = "CORE", critical = false) {
    if (this.started[name]) {
      Logger.warn(`${name} already started, skipping`);
      return true;
    }

    // ---- Проверка зависимостей с синхронизацией ----
    const deps = this.dependencyGraph[name] || [];
    for (const dep of deps) {
      this._syncComponentState(dep);
      if (!this.started[dep]) {
        const msg = `Missing dependency ${dep}`;
        this.bootLog.push({ name, phase, status: "BLOCKED", reason: msg });
        this.componentStatus[name] = { status: "BLOCKED", reason: msg, timestamp: new Date().toISOString() };
        throw new Error(`Component ${name} blocked: ${msg}`);
      }
    }

    // ---- Проверка существования компонента ----
    const obj = globalThis[name];
    if (!obj && critical) {
      const msg = `Component ${name} not defined in global scope`;
      this.bootLog.push({ name, phase, status: "FAILED", error: msg });
      this.componentStatus[name] = { status: "FAILED", error: msg, timestamp: new Date().toISOString() };
      throw new Error(`Critical component ${name} not found: ${msg}`);
    }

    try {
      const startedAt = Date.now();
      await fn();
      const duration = Date.now() - startedAt;
      this.bootLog.push({ name, phase, status: "OK", duration });
      // Фиксируем успешный старт
      this._syncStarted(name);
      Logger.log(`${phase} | ${name} OK (${duration}ms)`);
      return true;
    } catch (e) {
      const msg = e.message || "Unknown error";
      this.bootLog.push({ name, phase, status: "FAILED", error: msg });
      this.componentStatus[name] = { status: "FAILED", error: msg, timestamp: new Date().toISOString() };
      Logger.error(`${phase} | ${name} FAILED: ${msg}`);
      if (critical) throw new Error(`Critical component ${name} failed: ${msg}`);
      return false;
    }
  },

  // ---- БЕЗОПАСНАЯ ИНИЦИАЛИЗАЦИЯ (некритичные) ----
  safeInit(name, phase = "SERVICES") {
    const obj = globalThis[name];
    if (obj && typeof obj.init === "function") {
      const critical = this.criticalComponents.includes(name);
      return this._initComponent(name, () => obj.init(), phase, critical);
    }
    Logger.debug(`${name} skipped (not found or no init)`);
    return false;
  },

  // ---- ГЛАВНЫЙ МЕТОД ЗАПУСКА ----
  async init() {
    if (this.initialized) {
      Logger.log("ERP SYSTEM ALREADY RUNNING");
      return this.health();
    }
    Logger.log("===== ERP BOOT START =====");
    this.startedAt = new Date().toISOString();
    this.bootLog = [];
    this.started = {};
    this.componentStatus = {};

    try {
      // ---- BOOTSTRAP ----
      await this._initComponent("Config", () => Config?.init?.() || Promise.resolve(), "BOOTSTRAP", true);
      await this._initComponent("Logger", () => Logger?.init?.() || Promise.resolve(), "BOOTSTRAP", true);

      // ---- CORE ----
      await this._initComponent("SchemaManager", () => SchemaManager.init(), "CORE", true);
      await this._initComponent("Database", () => Database.init(), "CORE", true);

      // ---- ENTITY (строгий порядок) ----
      if (typeof EntityMetadata !== "undefined" && EntityMetadata.init)
        await this._initComponent("EntityMetadata", () => EntityMetadata.init(), "ENTITY", false);
      if (typeof EntityRegistry !== "undefined" && EntityRegistry.init)
        await this._initComponent("EntityRegistry", () => EntityRegistry.init(), "ENTITY", false);
      if (typeof Registry !== "undefined" && Registry.init)
        await this._initComponent("Registry", () => Registry.init(), "ENTITY", false);
      if (typeof RepositoryFactory !== "undefined" && RepositoryFactory.init)
        await this._initComponent("RepositoryFactory", () => RepositoryFactory.init(), "ENTITY", false);

      // ---- MIGRATION ----
      if (typeof SchemaManager !== "undefined" && SchemaManager.migrate)
        await this._initComponent("SchemaMigration", () => SchemaManager.migrate(), "MIGRATION", false);

      // ---- EVENT ----
      if (typeof ERPEventContract !== "undefined" && ERPEventContract.init)
        await this._initComponent("ERPEventContract", () => ERPEventContract.init(), "EVENT", false);
      await this._initComponent("EventBus", () => EventBus.init(), "EVENT", true);
      await this._initComponent("BusinessEventProcessor", () => BusinessEventProcessor.init(), "EVENT", true);

      // ---- ПЕРЕДАЁМ EVENTBUS В MODULEREGISTRY ----
      if (typeof ModuleRegistry !== "undefined" && ModuleRegistry.setEventBus) {
        ModuleRegistry.setEventBus(EventBus);
      }

      // ---- ЗАГРУЗКА МАНИФЕСТА МОДУЛЕЙ ----
      if (typeof ModuleRegistry !== "undefined" && typeof ERP_MODULE_MANIFEST !== "undefined") {
        ModuleRegistry.loadManifest(ERP_MODULE_MANIFEST);
      } else {
        Logger.warn("ModuleRegistry or ERP_MODULE_MANIFEST not available, modules will not be loaded");
      }

      // ---- ЗАПУСК МОДУЛЕЙ ПО ФАЗАМ ----
      if (typeof ModuleRegistry !== "undefined") {
        await ModuleRegistry.startAll("DOMAIN", { reset: false });
        await ModuleRegistry.startAll("APPLICATION", { reset: false });
        await ModuleRegistry.startAll("SERVICES", { reset: false });
        await ModuleRegistry.startAll("REPORTING", { reset: false });
      }

      // ---- ВАЛИДАЦИЯ СОСТОЯНИЯ МОДУЛЕЙ ----
      if (typeof ModuleRegistry !== "undefined" && ModuleRegistry.failed.length > 0) {
        throw new Error(`Module startup failed: ${ModuleRegistry.failed.join(", ")}`);
      }

      // ---- VALIDATION ----
      await this._validateSystem();

      // ---- HEALTHCHECK ----
      await this._healthCheck();

      // ---- ФИНИШ МОДУЛЕЙ ----
      if (typeof ModuleRegistry !== "undefined" && ModuleRegistry.finish) {
        ModuleRegistry.finish();
      }

      // ---- ОБНОВЛЯЕМ СОСТОЯНИЕ ПОСЛЕ ВСЕХ ИНИЦИАЛИЗАЦИЙ ----
      this.refreshHealth();

      // ---- READY ----
      const failedCritical = this.bootLog.some(e => e.status === "FAILED" && this.criticalComponents.includes(e.name));
      if (failedCritical) throw new Error("Critical components failed");
      this.initialized = true;
      Logger.log("===== ERP READY v" + this.version + " =====");

      this._emitStartupEvent();
      this._printReport();

    } catch (e) {
      Logger.error(`===== ERP BOOT FAILED: ${e.message} =====`);
      this.initialized = false;
      throw e;
    }
    return this.health();
  },

  // ---- ОБНОВЛЕНИЕ СОСТОЯНИЯ КОМПОНЕНТОВ ----
  refreshHealth() {
    const allComponents = Object.keys(this.componentPhase);
    for (const name of allComponents) {
      this._syncComponentState(name);
    }
    Logger.debug("Health state refreshed");
  },

  // ---- ВАЛИДАЦИЯ СИСТЕМЫ ----
  async _validateSystem() {
    Logger.log("VALIDATION | Running system validation...");
    if (
      typeof EntityRegistry !== "undefined" &&
      typeof EntityRegistry.has === "function"
    ) {
      const required = ["CLIENT", "TRIP", "TRANSPORT_ORDER"];
      const missing = required.filter(e => !EntityRegistry.has(e));
      if (missing.length) Logger.warn(`VALIDATION | Missing entities: ${missing.join(', ')}`);
      else Logger.log("VALIDATION | All required entities present");
    } else {
      Logger.warn("VALIDATION | EntityRegistry not available, skipping entity check");
    }
    Logger.log("VALIDATION | Complete");
  },

  // ---- ПРОВЕРКА ЗДОРОВЬЯ ----
  async _healthCheck() {
    Logger.log("HEALTHCHECK | Performing system health check...");
    let ok = true;
    if (typeof Database !== "undefined" && !Database.initialized) {
      Logger.error("HEALTHCHECK | Database not initialized");
      ok = false;
    }
    if (typeof EventBus !== "undefined" && !EventBus.ready) {
      Logger.error("HEALTHCHECK | EventBus not ready");
      ok = false;
    }
    if (typeof BusinessEventProcessor !== "undefined" && !BusinessEventProcessor.ready) {
      Logger.error("HEALTHCHECK | BusinessEventProcessor not ready");
      ok = false;
    }
    if (!ok) throw new Error("Health check failed");
    Logger.log("HEALTHCHECK | All systems healthy");
  },

  // ---- ПУБЛИКАЦИЯ СОБЫТИЯ СТАРТА ----
  _emitStartupEvent() {
    try {
      if (typeof EventBus !== "undefined" && EventBus.emit) {
        EventBus.emit("ERP_STARTED", {
          version: this.version,
          timestamp: new Date().toISOString(),
          bootLog: this.bootLog
        }, { source: "SystemInit" });
        Logger.debug("ERP_STARTED event published");
      }
    } catch (e) {
      Logger.warn("Could not emit ERP_STARTED: " + e.message);
    }
  },

  // ---- ПЕЧАТЬ ОТЧЁТА ----
  _printReport() {
    Logger.log("===== ERP START REPORT =====");
    const phases = ["BOOTSTRAP", "CORE", "MIGRATION", "ENTITY", "EVENT", "DOMAIN", "APPLICATION", "SERVICES", "REPORTING", "VALIDATION", "HEALTHCHECK"];
    for (const phase of phases) {
      const entries = this.bootLog.filter(e => e.phase === phase);
      if (!entries.length) continue;
      Logger.log(`\n${phase}`);
      for (const e of entries) {
        let icon = "✔";
        if (e.status === "FAILED") icon = "✘";
        else if (e.status === "BLOCKED") icon = "⛔";
        const time = e.duration ? `${e.duration}ms` : "";
        Logger.log(`  ${icon} ${e.name} ${time}`);
      }
    }
    Logger.log("\n===== ERP READY =====");
  },

  // ---- HEALTH (с защитой) ----
  health() {
    let uptime = 0;
    if (this.startedAt) uptime = Date.now() - new Date(this.startedAt).getTime();

    let subscriptions = 0;
    try {
      if (typeof EventBus !== "undefined" && EventBus.list) {
        const events = EventBus.list();
        for (const ev of events) subscriptions += EventBus.listeners ? EventBus.listeners(ev) : 0;
      }
    } catch { subscriptions = -1; }

    let tables = 0;
    try {
      if (typeof SchemaManager !== "undefined" && SchemaManager.getSchema) {
        const schema = SchemaManager.getSchema();
        tables = schema ? Object.keys(schema).length : 0;
      }
    } catch { tables = -1; }

    const compStatus = {};
    for (const [name, st] of Object.entries(this.componentStatus)) {
      compStatus[name] = st.status;
    }
    const allComponents = Object.keys(this.componentPhase);
    for (const name of allComponents) {
      if (!compStatus[name]) {
        const started = this.started[name];
        compStatus[name] = started ? "OK" : "NOT_STARTED";
      }
    }

    return HealthContract.create("SystemInit", this.initialized ? "OK" : "WARNING", {
      version: this.version,
      startedAt: this.startedAt,
      uptime,
      components: compStatus,
      bootLog: this.bootLog,
      eventBus: {
        subscriptions,
        ready: typeof EventBus !== "undefined" && EventBus.ready
      },
      database: {
        tables,
        ready: typeof Database !== "undefined" && Database.initialized
      },
      moduleRegistry: {
        ready: typeof ModuleRegistry !== "undefined" && ModuleRegistry.initialized,
        failed: typeof ModuleRegistry !== "undefined" ? ModuleRegistry.failed || [] : []
      },
      criticalStatus: {
        database: typeof Database !== "undefined" && Database.initialized,
        eventBus: typeof EventBus !== "undefined" && EventBus.ready,
        businessProcessor: typeof BusinessEventProcessor !== "undefined" && BusinessEventProcessor.ready
      }
    });
  },

  // ---- ДИАГНОСТИКА ----
  diagnostics() {
    let moduleDiag = null;
    if (typeof ModuleRegistry !== "undefined" && ModuleRegistry.diagnostics) {
      moduleDiag = ModuleRegistry.diagnostics();
    }
    const componentStatusSafe = {};
    for (const name of Object.keys(this.componentStatus)) {
      componentStatusSafe[name] = this.componentStatus[name]?.status || "UNKNOWN";
    }
    return {
      system: {
        version: this.version,
        initialized: this.initialized,
        startedAt: this.startedAt,
        uptime: this.startedAt ? Date.now() - new Date(this.startedAt).getTime() : 0
      },
      bootLog: this.bootLog,
      startedComponents: Object.keys(this.started),
      componentStatus: componentStatusSafe,
      moduleRegistry: moduleDiag
    };
  }
};

globalThis.SystemInit = SystemInit;
Logger.log("SystemInit READY v" + SystemInit.version);