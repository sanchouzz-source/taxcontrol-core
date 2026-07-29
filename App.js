// ============================================================
// App v4.1.0
// TaxControl ERP Application Facade
//
// Lifecycle:
// Bootstrap.start() -> App.start() -> SystemInit.init()
//
// App owns only its local application state.
// Public ERP commands belong to Bootstrap.js.
// ============================================================

console.log("App v4.1.0");

const App = {
  version: "4.1.0",
  apiVersion: "4.1",
  name: "TaxControl ERP",
  platform: "Google Apps Script",

  state: {
    status: "CREATED",
    started: false,
    starting: false,
    startedAt: null,
    lastError: null,
  },

  init() {
    Logger.log("APP INIT v" + this.version);

    const system = globalThis.SystemInit;

    if (!system || typeof system.init !== "function") {
      throw new Error("SystemInit.init unavailable");
    }

    this.state.status = "INITIALIZED";
    return true;
  },

  start() {
    if (this.state.started) {
      if (!this.isReady()) {
        throw new Error(
          "App state inconsistent: started without ready SystemInit"
        );
      }

      return {
        status: "ALREADY_STARTED",
        startedAt: this.state.startedAt,
      };
    }

    if (this.state.starting) {
      throw new Error("ERP application startup already running");
    }

    this.init();

    try {
      this.state.starting = true;
      this.state.status = "STARTING";
      this.state.lastError = null;

      Logger.log("========== APP START ==========");

      const result = globalThis.SystemInit.init();

      if (result && typeof result.then === "function") {
        throw new Error(
          "SystemInit.init must be synchronous in Google Apps Script"
        );
      }

      if (globalThis.SystemInit.initialized !== true) {
        throw new Error(
          "SystemInit did not confirm initialized state"
        );
      }

      this.state.started = true;
      this.state.status = "READY";
      this.state.startedAt = new Date().toISOString();

      Logger.log("========== APP READY ==========");

      return {
        status: "READY",
        version: this.version,
        result,
        startedAt: this.state.startedAt,
      };
    } catch (error) {
      this.state.started = false;
      this.state.status = "FAILED";
      this.state.lastError = error.message;

      Logger.error("APP START FAILED " + error.message);
      throw error;
    } finally {
      this.state.starting = false;
    }
  },

  isReady() {
    return (
      this.state.started === true &&
      this.state.status === "READY" &&
      globalThis.SystemInit &&
      globalThis.SystemInit.initialized === true
    );
  },

  health() {
    const modules = {};

    [
      "SystemInit",
      "ERPDiagnostics",
      "RepositoryRegistry",
      "RepositoryFactory",
      "SchemaRegistry",
      "Database",
      "EventBus",
      "ModuleRegistry",
    ].forEach((name) => {
      const component = globalThis[name];

      if (!component || typeof component.health !== "function") {
        return;
      }

      try {
        modules[name] = component.health();
      } catch (error) {
        modules[name] = {
          status: "ERROR",
          error: error.message,
        };
      }
    });

    return {
      module: "App",
      version: this.version,
      status: this.isReady()
        ? "OK"
        : this.state.status === "FAILED"
          ? "FAILED"
          : "WARNING",
      applicationStatus: this.state.status,
      ready: this.isReady(),
      state: { ...this.state },
      modules,
      timestamp: new Date().toISOString(),
    };
  },

  readiness() {
    const diagnostics = globalThis.ERPDiagnostics;

    if (!diagnostics || typeof diagnostics.run !== "function") {
      return {
        score: 0,
        status: "NO_DIAGNOSTICS",
      };
    }

    const report = diagnostics.run({
      skipCoreTest: true,
    });

    return {
      score: report.readiness || 0,
      status: report.status || "UNKNOWN",
    };
  },

  diagnostics() {
    const safeCall = (name, method, args) => {
      const component = globalThis[name];

      if (!component || typeof component[method] !== "function") {
        return null;
      }

      try {
        return component[method](...(args || []));
      } catch (error) {
        return {
          status: "ERROR",
          error: error.message,
        };
      }
    };

    return {
      application: this.name,
      version: this.version,
      state: { ...this.state },
      system: safeCall("SystemInit", "diagnostics"),
      erpDiagnostics: safeCall(
        "ERPDiagnostics",
        "run",
        [{ skipCoreTest: true }]
      ),
      repository: safeCall(
        "RepositoryHealthReport",
        "details"
      ),
      schema: safeCall("SchemaRegistry", "diagnostics"),
      database: safeCall("Database", "diagnostics"),
      factory: safeCall("RepositoryFactory", "diagnostics"),
      timestamp: new Date().toISOString(),
    };
  },

  versionReport() {
    const versionOf = (name) => {
      const component = globalThis[name];
      return component && component.version
        ? component.version
        : "-";
    };

    return {
      App: this.version,
      SystemInit: versionOf("SystemInit"),
      ERPDiagnostics: versionOf("ERPDiagnostics"),
      SchemaRegistry: versionOf("SchemaRegistry"),
      SchemaManager: versionOf("SchemaManager"),
      Database: versionOf("Database"),
      BaseRepository: versionOf("BaseRepository"),
      RepositoryFactory: versionOf("RepositoryFactory"),
      RepositoryRegistry: versionOf("RepositoryRegistry"),
      EventBus: versionOf("EventBus"),
    };
  },

  reset() {
    Logger.warn("APP RESET");

    const errors = [];

    const resetComponent = (name) => {
      const component = globalThis[name];

      if (!component || typeof component.reset !== "function") {
        return;
      }

      try {
        component.reset();
      } catch (error) {
        errors.push(name + ": " + error.message);
      }
    };

    // Compatibility cleanup for components that SystemInit v3.1.0
    // does not yet reset. SystemInit will own this list in package D.
    [
      "ModuleRegistry",
      "BusinessEventProcessor",
      "EventBus",
      "EntityService",
    ].forEach(resetComponent);

    resetComponent("SystemInit");

    [
      "SchemaManager",
      "EntityRegistry",
    ].forEach(resetComponent);

    const repositoryRegistry =
      globalThis.RepositoryRegistry;

    if (
      repositoryRegistry &&
      typeof repositoryRegistry.reset !== "function"
    ) {
      repositoryRegistry.repositories = {};
      repositoryRegistry.ready = false;

      if ("initialized" in repositoryRegistry) {
        repositoryRegistry.initialized = false;
      }
    }

    this.state = {
      status: "CREATED",
      started: false,
      starting: false,
      startedAt: null,
      lastError: errors.length
        ? errors.join("; ")
        : null,
    };

    if (errors.length) {
      Logger.error(
        "APP RESET COMPLETED WITH ERRORS " +
          errors.join("; ")
      );

      return {
        status: "ERROR",
        errors,
      };
    }

    Logger.log("APP RESET COMPLETE");

    return {
      status: "OK",
    };
  },

  status() {
    return {
      application: this.name,
      version: this.version,
      state: { ...this.state },
      ready: this.isReady(),
      timestamp: new Date().toISOString(),
    };
  },

  info() {
    return {
      application: this.name,
      version: this.version,
      apiVersion: this.apiVersion,
      platform: this.platform,
      startupChain: [
        "Bootstrap",
        "App",
        "SystemInit",
      ],
      timestamp: new Date().toISOString(),
    };
  },
};

globalThis.App = App;

Logger.log("App READY v" + App.version);
