// ============================================================
// ERP Diagnostics v2.0
// Совместимость:
// SystemInit v2.x
// EventBus v2.2
// BusinessEventProcessor v1.8
// ModuleRegistry v1.9
// ============================================================

console.log("ERP Diagnostics v2.0");

const ERPDiagnostics = {

  run(options = {}) {
    const report = this.buildReport();
    if (options.json) {
      return report;
    }
    this.print(report);
    return report;
  },

  // ============================================================
  // BUILD REPORT
  // ============================================================

  buildReport() {
    return {
      timestamp: new Date().toISOString(),
      system: this.system(),
      components: this.components(),
      modules: this.modules(),
      database: this.database(),
      events: this.events(),
      handlers: this.handlers(),
      processors: this.processors(),
      dependencies: this.dependencies(),
      health: this.health()
    };
  },

  // ============================================================
  // SYSTEM
  // ============================================================

  system() {
    return {
      status: SystemInit?.initialized ? "OK" : "WARNING",
      version: SystemInit?.version || null,
      startedAt: SystemInit?.startedAt || null,
      uptime: SystemInit?.startedAt
        ? Date.now() - new Date(SystemInit.startedAt).getTime()
        : 0,
      components: SystemInit?.componentStatus || {}
    };
  },

  // ============================================================
  // COMPONENTS (добавлен Config)
  // ============================================================

  components() {
    return {
      Config: (typeof Config !== "undefined" && Config.initialized) ? "READY" : "FAILED",
      Database: Database?.initialized ? "READY" : "FAILED",
      SchemaManager: SchemaManager ? "READY" : "FAILED",
      EntityRegistry: EntityRegistry ? "READY" : "FAILED",
      EventBus: EventBus?.ready ? "READY" : "FAILED",
      BusinessEventProcessor: BusinessEventProcessor?.ready ? "READY" : "FAILED",
      ModuleRegistry: ModuleRegistry?.initialized ? "READY" : "FAILED"
    };
  },

  // ============================================================
  // MODULES
  // ============================================================

  modules() {
    const result = {};
    if (!ModuleRegistry) return result;
    for (const [name, mod] of Object.entries(ModuleRegistry.modules || {})) {
      result[name] = {
        status: mod.status || "UNKNOWN",
        version: mod.version || null,
        phase: mod.phase || null,
        dependencies: mod.dependencies || [],
        error: mod.error || null,
        startedAt: mod.startedAt || null
      };
    }
    return result;
  },

  // ============================================================
  // DATABASE
  // ============================================================

  database() {
    let tables = [];
    try {
      if (SchemaManager && SchemaManager.getSchema) {
        tables = Object.keys(SchemaManager.getSchema() || {});
      }
    } catch (e) {
      tables = ["ERROR: " + e.message];
    }
    return {
      initialized: Database?.initialized || false,
      tables,
      count: tables.length
    };
  },

  // ============================================================
  // EVENTS
  // ============================================================

  events() {
    let events = [];
    let handlers = 0;
    let history = 0;
    if (EventBus) {
      events = EventBus.list ? EventBus.list() : [];
      handlers = Object.values(EventBus.events || {}).reduce((a, b) => a + b.length, 0);
      history = EventBus.history?.length || 0;
    }
    return {
      ready: EventBus?.ready || false,
      registeredEvents: events,
      eventCount: events.length,
      handlers,
      history,
      processing: EventBus?._processing ? EventBus._processing.size : 0
    };
  },

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  handlers() {
    const result = {};
    if (typeof TransportOrderEventHandler !== "undefined") {
      result.TransportOrderEventHandler = TransportOrderEventHandler.health
        ? TransportOrderEventHandler.health()
        : null;
    }
    return result;
  },

  // ============================================================
  // BUSINESS PROCESSOR
  // ============================================================

  processors() {
    if (typeof BusinessEventProcessor === "undefined") return {};
    if (BusinessEventProcessor.health) {
      return BusinessEventProcessor.health();
    }
    return {
      ready: BusinessEventProcessor.ready || false
    };
  },

  // ============================================================
  // DEPENDENCIES
  // ============================================================

  dependencies() {
    if (ModuleRegistry && ModuleRegistry.getDependencyGraph) {
      return ModuleRegistry.getDependencyGraph();
    }
    if (SystemInit?.dependencyGraph) {
      return SystemInit.dependencyGraph;
    }
    return {};
  },

  // ============================================================
  // GLOBAL HEALTH
  // ============================================================

  health() {
    const result = {};
    try {
      if (HealthContract && HealthContract.create) {
        result.SystemInit = SystemInit.health();
        result.EventBus = EventBus?.health ? EventBus.health() : null;
      }
    } catch (e) {
      result.error = e.message;
    }
    return result;
  },

  // ============================================================
  // PRINT
  // ============================================================

  print(report) {
    Logger.log("===== ERP DIAGNOSTICS v2.0 =====");
    Logger.log(`SYSTEM ${report.system.status}`);

    Logger.log("\nCOMPONENTS");
    for (const [k, v] of Object.entries(report.components)) {
      Logger.log(`${v === "READY" ? "✔" : "✘"} ${k}: ${v}`);
    }

    Logger.log("\nEVENT BUS");
    Logger.log(` Events: ${report.events.eventCount}`);
    Logger.log(` Handlers: ${report.events.handlers}`);
    Logger.log(` History: ${report.events.history}`);

    Logger.log("\nHANDLERS");
    for (const [name, data] of Object.entries(report.handlers)) {
      Logger.log(`${name}:`);
      Logger.log(JSON.stringify(data, null, 2));
    }

    Logger.log("\nMODULES");
    for (const [name, m] of Object.entries(report.modules)) {
      const icon = m.status === "READY" ? "✔" : m.status === "FAILED" ? "✘" : "⏳";
      Logger.log(`${icon} ${name} ${m.status}`);
      if (m.error) {
        Logger.log(" ERROR: " + m.error);
      }
    }

    Logger.log("\n===== END DIAGNOSTICS =====");
  }
};

// ============================================================
// GLOBAL COMMANDS
// ============================================================

globalThis.ERP = {
  diagnostics: () => ERPDiagnostics.run(),
  diagnosticsJSON: () => ERPDiagnostics.run({ json: true }),
  health: () => ERPDiagnostics.health()
};

Logger.log("ERP Diagnostics READY v2.0");