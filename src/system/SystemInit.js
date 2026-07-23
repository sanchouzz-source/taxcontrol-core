// ============================================================
// SystemInit v1.7.0 – Оркестратор с передачей EventBus в ModuleRegistry
// ============================================================
console.log("SystemInit v1.7.0");

const SystemInit = {
  version: "1.7.0",
  initialized: false,
  startedAt: null,
  bootLog: [],
  started: {},
  componentStatus: {},

  phases: {
    BOOTSTRAP:   { order: 0, label: "BOOTSTRAP" },
    CORE:        { order: 1, label: "CORE" },
    MIGRATION:   { order: 2, label: "MIGRATION" },
    EVENT:       { order: 3, label: "EVENT" },
    DOMAIN:      { order: 4, label: "DOMAIN" },
    SERVICES:    { order: 5, label: "SERVICES" },
    VALIDATION:  { order: 6, label: "VALIDATION" },
    HEALTHCHECK: { order: 7, label: "HEALTHCHECK" },
    READY:       { order: 8, label: "READY" }
  },

  dependencyGraph: {
    SchemaManager: [],
    EntityMetadata: [],
    Database: ["SchemaManager"],
    EntityRegistry: ["EntityMetadata"],
    Registry: ["EntityRegistry"],
    ERPEventContract: [],
    EventBus: ["ERPEventContract"],
    BusinessEventProcessor: ["EventBus"]
  },

  criticalComponents: [
    "SchemaManager",
    "Database",
    "EventBus",
    "BusinessEventProcessor"
  ],

  componentPhase: {
    SchemaManager: "CORE",
    EntityMetadata: "CORE",
    Database: "CORE",
    EntityRegistry: "CORE",
    Registry: "CORE",
    ERPEventContract: "EVENT",
    EventBus: "EVENT",
    BusinessEventProcessor: "EVENT"
  },

  _initComponent(name, fn, phase = "CORE", critical = false) {
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
      fn();
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

  init() {
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
      // ---- CORE ----
      this._initComponent("SchemaManager", () => SchemaManager.init(), "CORE", true);
      if (typeof EntityMetadata !== "undefined" && EntityMetadata.init)
        this._initComponent("EntityMetadata", () => EntityMetadata.init(), "CORE", false);
      this._initComponent("Database", () => Database.init(), "CORE", true);
      if (typeof EntityRegistry !== "undefined" && EntityRegistry.init)
        this._initComponent("EntityRegistry", () => EntityRegistry.init(), "CORE", false);
      if (typeof Registry !== "undefined" && Registry.init)
        this._initComponent("Registry", () => Registry.init(), "CORE", false);

      // ---- MIGRATION ----
      if (typeof SchemaManager !== "undefined" && SchemaManager.migrate)
        this._initComponent("SchemaMigration", () => SchemaManager.migrate(), "MIGRATION", false);

      // ---- EVENT ----
      if (typeof ERPEventContract !== "undefined" && ERPEventContract.init)
        this._initComponent("ERPEventContract", () => ERPEventContract.init(), "EVENT", false);
      this._initComponent("EventBus", () => EventBus.init(), "EVENT", true);
      this._initComponent("BusinessEventProcessor", () => BusinessEventProcessor.init(), "EVENT", true);

      // ---- ПЕРЕДАЁМ EVENTBUS В MODULEREGISTRY ----
      if (typeof ModuleRegistry !== "undefined" && ModuleRegistry.setEventBus) {
        ModuleRegistry.setEventBus(EventBus);
      }

      // ---- DOMAIN ----
      this._initDomain();

      // ---- SERVICES ----
      ["FinanceEngine", "KPIEngine", "DashboardEngine"].forEach(name => this.safeInit(name, "SERVICES"));

      // ---- VALIDATION ----
      this._validateSystem();

      // ---- HEALTHCHECK ----
      this._healthCheck();

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

  _initDomain() {
    if (typeof ModuleRegistry === "undefined") {
      Logger.warn("ModuleRegistry not available, domain modules cannot be started");
      return;
    }
    if (typeof ModuleRegistry.init === "function") {
      ModuleRegistry.init();
    }
    // Запуск модулей фазы DOMAIN (без сброса)
    ModuleRegistry.startAll("DOMAIN", { reset: false });
    if (ModuleRegistry.failed && ModuleRegistry.failed.length > 0) {
      Logger.warn(`DOMAIN | Some modules failed: ${ModuleRegistry.failed.join(', ')}`);
    }
  },

  _validateSystem() {
    Logger.log("VALIDATION | Running system validation...");
    if (typeof EntityRegistry !== "undefined") {
      const required = ["CLIENT", "TRIP", "TRANSPORT_ORDER"];
      const missing = required.filter(e => !EntityRegistry.has(e));
      if (missing.length) Logger.warn(`VALIDATION | Missing entities: ${missing.join(', ')}`);
      else Logger.log("VALIDATION | All required entities present");
    }
    Logger.log("VALIDATION | Complete");
  },

  _healthCheck() {
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
    const phases = ["CORE", "MIGRATION", "EVENT", "DOMAIN", "SERVICES", "VALIDATION", "HEALTHCHECK"];
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
    for (const [name, st] of Object.entries(this.componentStatus)) compStatus[name] = st.status;
    return HealthContract.create("SystemInit", this.initialized ? "OK" : "WARNING", {
      version: this.version,
      startedAt: this.startedAt,
      uptime,
      components: compStatus,
      bootLog: this.bootLog,
      eventBus: { subscriptions, ready: typeof EventBus !== "undefined" && EventBus.ready },
      database: { tables, ready: typeof Database !== "undefined" && Database.initialized },
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

  diagnostics() {
    let moduleDiag = null;
    if (typeof ModuleRegistry !== "undefined" && ModuleRegistry.diagnostics) {
      moduleDiag = ModuleRegistry.diagnostics();
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
      componentStatus: this.componentStatus,
      moduleRegistry: moduleDiag
    };
  }
};

globalThis.SystemInit = SystemInit;
Logger.log("SystemInit READY v" + SystemInit.version);