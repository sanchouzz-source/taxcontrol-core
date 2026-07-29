// ============================================================
// Bootstrap v3.2.0
// Enterprise ERP Startup Controller
// TaxControl ERP Core
//
// The only owner of global runtime state and public ERP
// lifecycle commands.
//
// Startup:
// startERP() -> Bootstrap.start() -> App.start()
//            -> SystemInit.init()
// ============================================================

console.log("Bootstrap v3.2.0");

function createERPState_(bootCount) {
  return {
    status: "CREATED",
    started: false,
    starting: false,
    failed: false,
    startedAt: null,
    finishedAt: null,
    duration: null,
    error: null,
    bootCount: Number(bootCount || 0),
  };
}

function normalizeERPState_(state) {
  const normalized = createERPState_(
    state && state.bootCount
  );

  if (!state || typeof state !== "object") {
    return normalized;
  }

  Object.keys(normalized).forEach((key) => {
    if (typeof state[key] === "undefined") {
      state[key] = normalized[key];
    }
  });

  const bootCount = Number(state.bootCount);
  state.bootCount = Number.isFinite(bootCount)
    ? bootCount
    : 0;

  return state;
}

globalThis.__ERP_STATE__ =
  normalizeERPState_(globalThis.__ERP_STATE__);

const Bootstrap = {
  version: "3.2.0",

  get state() {
    return globalThis.__ERP_STATE__;
  },

  get started() {
    return this.state.started === true;
  },

  get starting() {
    return this.state.starting === true;
  },

  get failed() {
    return this.state.failed === true;
  },

  start() {
    const state = this.state;

    if (state.started) {
      if (!this.isReady()) {
        state.status = "FAILED";
        state.failed = true;
        state.error =
          "ERP runtime state is inconsistent";

        throw new Error(state.error);
      }

      Logger.warn("ERP already started");

      return {
        status: "ALREADY_STARTED",
        bootCount: state.bootCount,
        health: this.health(),
      };
    }

    if (state.starting) {
      throw new Error("ERP boot already running");
    }

    state.starting = true;
    state.status = "STARTING";
    state.failed = false;
    state.error = null;
    state.bootCount =
      Number.isFinite(Number(state.bootCount))
        ? Number(state.bootCount) + 1
        : 1;

    const startTime = Date.now();

    Logger.log("========== ERP BOOT START ==========");

    try {
      const app = globalThis.App;

      if (!app || typeof app.start !== "function") {
        throw new Error("App.start unavailable");
      }

      const result = app.start();

      if (result && typeof result.then === "function") {
        throw new Error(
          "App.start must be synchronous in Google Apps Script"
        );
      }

      if (!this._applicationReady()) {
        throw new Error(
          "ERP components did not confirm ready state"
        );
      }

      state.started = true;
      state.failed = false;
      state.status = "READY";
      state.startedAt = new Date().toISOString();
      state.finishedAt = new Date().toISOString();
      state.duration = Date.now() - startTime;
      state.error = null;

      Logger.log(
        "========== ERP BOOT COMPLETE " +
          state.duration +
          "ms =========="
      );

      return {
        status: "READY",
        duration: state.duration,
        bootCount: state.bootCount,
        result,
      };
    } catch (error) {
      state.started = false;
      state.failed = true;
      state.status = "FAILED";
      state.error = error.message;
      state.finishedAt = new Date().toISOString();
      state.duration = Date.now() - startTime;

      Logger.error("ERP BOOT FAILED " + error.message);
      throw error;
    } finally {
      state.starting = false;
    }
  },

  ensureStarted() {
    if (this.isReady()) {
      return {
        status: "ALREADY_STARTED",
        bootCount: this.state.bootCount,
      };
    }

    return this.start();
  },

  _applicationReady() {
    const app = globalThis.App;
    const system = globalThis.SystemInit;

    return (
      app &&
      app.state &&
      app.state.started === true &&
      app.state.status === "READY" &&
      system &&
      system.initialized === true
    );
  },

  isReady() {
    return (
      this.state.started === true &&
      this.state.status === "READY" &&
      this._applicationReady()
    );
  },

  stop() {
    Logger.warn("ERP SHUTDOWN");

    let appResult = null;
    let stopError = null;

    try {
      const app = globalThis.App;

      if (app && typeof app.reset === "function") {
        appResult = app.reset();

        if (
          appResult &&
          appResult.status === "ERROR"
        ) {
          throw new Error(
            (appResult.errors || []).join("; ") ||
              "App reset failed"
          );
        }
      }
    } catch (error) {
      stopError = error;
      Logger.error(
        "ERP SHUTDOWN COMPONENT ERROR " +
          error.message
      );
    } finally {
      this.reset();
    }

    if (stopError) {
      return {
        status: "ERROR",
        error: stopError.message,
        app: appResult,
      };
    }

    Logger.log("ERP SHUTDOWN COMPLETE");

    return {
      status: "RESET",
      app: appResult,
    };
  },

  health() {
    const app = globalThis.App;
    const diagnostics = globalThis.ERPDiagnostics;

    let diagnosticHealth = null;

    try {
      diagnosticHealth =
        diagnostics &&
        typeof diagnostics.health === "function"
          ? diagnostics.health()
          : null;
    } catch (error) {
      diagnosticHealth = {
        status: "ERROR",
        error: error.message,
      };
    }

    return {
      module: "Bootstrap",
      version: this.version,
      status: this.isReady()
        ? "OK"
        : this.state.status === "FAILED"
          ? "FAILED"
          : "WARNING",
      ready: this.isReady(),
      state: { ...this.state },
      app:
        app && typeof app.health === "function"
          ? app.health()
          : null,
      diagnostics: diagnosticHealth,
    };
  },

  status() {
    return {
      version: this.version,
      status: this.state.status,
      started: this.state.started,
      starting: this.state.starting,
      failed: this.state.failed,
      ready: this.isReady(),
      duration: this.state.duration,
      bootCount: this.state.bootCount,
      error: this.state.error,
    };
  },

  diagnostics() {
    const app = globalThis.App;
    const system = globalThis.SystemInit;
    const diagnostics = globalThis.ERPDiagnostics;

    return {
      bootstrap: { ...this.state },
      app:
        app && typeof app.diagnostics === "function"
          ? app.diagnostics()
          : null,
      system:
        system &&
        typeof system.diagnostics === "function"
          ? system.diagnostics()
          : null,
      erp:
        diagnostics &&
        typeof diagnostics.run === "function"
          ? diagnostics.run({ skipCoreTest: true })
          : null,
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
      Bootstrap: this.version,
      ERPBootstrap: versionOf("ERPBootstrap"),
      App: versionOf("App"),
      SystemInit: versionOf("SystemInit"),
      ERPDiagnostics: versionOf("ERPDiagnostics"),
      RepositoryRegistry:
        versionOf("RepositoryRegistry"),
      RepositoryFactory:
        versionOf("RepositoryFactory"),
      SchemaRegistry: versionOf("SchemaRegistry"),
      Database: versionOf("Database"),
    };
  },

  reset() {
    const bootCount = Number(this.state.bootCount || 0);

    globalThis.__ERP_STATE__ =
      createERPState_(bootCount);

    Logger.log("Bootstrap RESET COMPLETE");
    return true;
  },

  healthContract() {
    const healthContract = globalThis.HealthContract;
    const status = this.isReady() ? "OK" : "WARNING";

    if (
      healthContract &&
      typeof healthContract.create === "function"
    ) {
      return healthContract.create(
        "Bootstrap",
        status,
        {
          version: this.version,
          state: { ...this.state },
        }
      );
    }

    return {
      module: "Bootstrap",
      status,
      version: this.version,
      state: { ...this.state },
    };
  },
};

globalThis.Bootstrap = Bootstrap;

// ============================================================
// PUBLIC COMMAND API — declared only in this file
// ============================================================

function startERP() {
  return Bootstrap.start();
}

function erpStart() {
  return startERP();
}

function bootERP() {
  return startERP();
}

function erpHealth() {
  Bootstrap.ensureStarted();
  return Bootstrap.health();
}

function bootHealth() {
  return erpHealth();
}

function erpDiag() {
  Bootstrap.ensureStarted();
  return Bootstrap.diagnostics();
}

function bootDiag() {
  return erpDiag();
}

function resetERP() {
  return Bootstrap.stop();
}

function erpReset() {
  return resetERP();
}

function erpVersion() {
  return Bootstrap.versionReport();
}

function erpInfo() {
  const app = globalThis.App;

  return app && typeof app.info === "function"
    ? app.info()
    : null;
}

function erpStatus() {
  return Bootstrap.status();
}

Logger.log("Bootstrap READY v" + Bootstrap.version);
