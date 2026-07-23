// ============================================================
// SystemInit v2.0.0 – Исправленный оркестратор с асинхронной загрузкой
// ============================================================
console.log("SystemInit v2.0.0");

const SystemInit = {
  version: "2.0.0",
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

  dependencyGraph: {
    // BOOTSTRAP
    Config: [],
    Logger: [],
    // CORE
    SchemaManager: [],
    Database: ["SchemaManager"],
    EntityRegistry: ["EntityMetadata"],
    Registry: ["EntityRegistry"],
    // EVENT
    ERPEventContract: [],
    EventBus: ["ERPEventContract"],
    BusinessEventProcessor: ["EventBus"]
  },

  criticalComponents: [
    "Config",
    "Logger",
    "SchemaManager",
    "Database",
    "EventBus",
    "BusinessEventProcessor"
  ],

  componentPhase: {
    Config: "BOOTSTRAP",
    Logger: "BOOTSTRAP",
    SchemaManager: "CORE",
    EntityMetadata: "ENTITY",
    Database: "CORE",
    EntityRegistry: "ENTITY",
    Registry: "ENTITY",
    ERPEventContract: "EVENT",
    EventBus: "EVENT",
    BusinessEventProcessor: "EVENT"
  },

  // ---- АСИНХРОННАЯ ИНИЦИАЛИЗАЦИЯ КОМПОНЕНТА ----
  async _initComponent(name, fn, phase = "CORE", critical = false) {
    if (this.started[name]) {
      Logger.warn(`${name} already started, skipping`);
      return true;
    }
    const deps = this.dependencyGraph[name] || [];
    for (const dep of deps) {
      if (!this.started[dep]) {
        const msg = `Missing dependency ${dep}`;
        this.bootLog.push({ name, phase, status: "BLOCKED", reason: msg });
        this.componentStatus[name] = { status: "BLOCKED", reason: msg, timestamp: new Date().toISOString() };
        throw new Error(`Component ${name} blocked: ${msg}`);
      }
    }
    try {
      const startedAt = Date.now();
      await fn(); // ★ теперь ждём Promise
      const duration = Date.now() - startedAt;
      this.bootLog.push({ name, phase, status: "OK", duration });
      this.componentStatus[name] = { status: "OK", startedAt: new Date().toISOString(), duration };
      this.started[name] = true;
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

  safeInit(name, phase = "SERVICES") {
    const obj = globalThis[name];
    if (obj && typeof obj.init === "function") {
      const critical = this.criticalComponents.includes(name);
      return this._initComponent(name, () => obj.init(), phase, critical);
    }
    Logger.debug(`${name} skipped (not found or no init)`);
    return false;
  },

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

      // ---- ENTITY ----
      if (typeof EntityMetadata !== "undefined" && EntityMetadata.init)
        await this._initComponent("EntityMetadata", () => EntityMetadata.init(), "ENTITY", false);
      if (typeof EntityRegistry !== "undefined" && EntityRegistry.init)
        await this._initComponent("EntityRegistry", () => EntityRegistry.init(), "ENTITY", false);
      if (typeof Registry !== "undefined" && Registry.init)
        await this._initComponent("Registry", () => Registry.init(), "ENTITY", false);

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

  health() { /* без изменений – уже есть */ },
  diagnostics() { /* без изменений – уже есть */ }
};

globalThis.SystemInit = SystemInit;
Logger.log("SystemInit READY v" + SystemInit.version);