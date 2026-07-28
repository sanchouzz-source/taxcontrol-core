// ============================================================
// Bootstrap v3.1.0
// Enterprise ERP Startup Controller
// TaxControl ERP Core
//
// Compatible:
// App v4+
// SystemInit v2.8+
// ERPDiagnostics v6+
// RepositoryRegistry v2+
// HealthContract
//
// Fixes:
// - Synchronous startup contract for Google Apps Script
// - No Promise returned by startERP()
// - Compatibility getters for CoreInfrastructureTest
// - Deterministic state and failure handling
// ============================================================

console.log("Bootstrap v3.1.0");

globalThis.__ERP_STATE__ =
  globalThis.__ERP_STATE__ || {
    status: "CREATED",
    started: false,
    starting: false,
    failed: false,
    startedAt: null,
    finishedAt: null,
    duration: null,
    error: null,
    bootCount: 0,
  };

const Bootstrap = {
  version: "3.1.0",

  get state() {
    return globalThis.__ERP_STATE__;
  },

  // Compatibility with tests that use Bootstrap.started/starting.
  get started() {
    return this.state.started === true;
  },

  get starting() {
    return this.state.starting === true;
  },

  get failed() {
    return this.state.failed === true;
  },

  // ============================================================
  // START
  // ============================================================

  start() {
    const state = this.state;

    if (state.started) {
      Logger.warn("ERP already started");
      return this.health();
    }

    if (state.starting) {
      throw new Error("ERP boot already running");
    }

    state.starting = true;
    state.status = "STARTING";
    state.failed = false;
    state.error = null;
    state.bootCount++;

    const startTime = Date.now();

    Logger.log("========== ERP BOOT START ==========");

    try {
      if (typeof App === "undefined") {
        throw new Error("App unavailable");
      }

      if (typeof App.start !== "function") {
        throw new Error("App.start unavailable");
      }

      const result = App.start();

      // Apps Script processes Promise microtasks only after the current
      // synchronous stack. A Promise here would make startup tests continue
      // before the ERP is actually ready.
      if (result && typeof result.then === "function") {
        throw new Error(
          "App.start must be synchronous in Google Apps Script"
        );
      }

      state.started = true;
      state.starting = false;
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
        result,
      };
    } catch (error) {
      state.failed = true;
      state.started = false;
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

  // ============================================================
  // STOP
  // ============================================================

  stop() {
    Logger.warn("ERP SHUTDOWN");

    try {
      if (
        typeof App !== "undefined" &&
        typeof App.reset === "function"
      ) {
        App.reset();
      }

      this.reset();
      return true;
    } catch (error) {
      Logger.error("ERP STOP FAILED " + error.message);
      return false;
    }
  },

  // ============================================================
  // HEALTH
  // ============================================================

  health() {
    try {
      return {
        module: "Bootstrap",
        version: this.version,
        status: this.state.status,
        state: this.state,
        app:
          typeof App !== "undefined" &&
          typeof App.health === "function"
            ? App.health()
            : null,
        diagnostics:
          typeof ERPDiagnostics !== "undefined" &&
          typeof ERPDiagnostics.health === "function"
            ? ERPDiagnostics.health()
            : null,
      };
    } catch (error) {
      return {
        module: "Bootstrap",
        version: this.version,
        status: "FAILED",
        error: error.message,
      };
    }
  },

  // ============================================================
  // STATUS
  // ============================================================

  status() {
    return {
      version: this.version,
      status: this.state.status,
      started: this.state.started,
      starting: this.state.starting,
      failed: this.state.failed,
      duration: this.state.duration,
      bootCount: this.state.bootCount,
      error: this.state.error,
    };
  },

  // ============================================================
  // DIAGNOSTICS
  // ============================================================

  diagnostics() {
    return {
      bootstrap: this.state,
      app:
        typeof App !== "undefined" &&
        typeof App.diagnostics === "function"
          ? App.diagnostics()
          : null,
      system:
        typeof SystemInit !== "undefined" &&
        typeof SystemInit.diagnostics === "function"
          ? SystemInit.diagnostics()
          : null,
      erp:
        typeof ERPDiagnostics !== "undefined" &&
        typeof ERPDiagnostics.run === "function"
          ? ERPDiagnostics.run({ skipCoreTest: true })
          : null,
    };
  },

  // ============================================================
  // VERSION REPORT
  // ============================================================

  versionReport() {
    return {
      Bootstrap: this.version,
      App:
        typeof App !== "undefined" && App.version
          ? App.version
          : "-",
      SystemInit:
        typeof SystemInit !== "undefined" && SystemInit.version
          ? SystemInit.version
          : "-",
      ERPDiagnostics:
        typeof ERPDiagnostics !== "undefined" &&
        ERPDiagnostics.version
          ? ERPDiagnostics.version
          : "-",
      RepositoryRegistry:
        typeof RepositoryRegistry !== "undefined" &&
        RepositoryRegistry.version
          ? RepositoryRegistry.version
          : "-",
      RepositoryFactory:
        typeof RepositoryFactory !== "undefined" &&
        RepositoryFactory.version
          ? RepositoryFactory.version
          : "-",
      SchemaRegistry:
        typeof SchemaRegistry !== "undefined" &&
        SchemaRegistry.version
          ? SchemaRegistry.version
          : "-",
      Database:
        typeof Database !== "undefined" && Database.version
          ? Database.version
          : "-",
    };
  },

  // ============================================================
  // RESET
  // ============================================================

  reset() {
    const bootCount = Number(this.state.bootCount || 0);

    globalThis.__ERP_STATE__ = {
      status: "CREATED",
      started: false,
      starting: false,
      failed: false,
      startedAt: null,
      finishedAt: null,
      duration: null,
      error: null,
      bootCount,
    };

    Logger.log("Bootstrap RESET COMPLETE");
    return true;
  },

  // ============================================================
  // READY
  // ============================================================

  isReady() {
    const appStarted =
      typeof App !== "undefined" &&
      App.state &&
      App.state.started === true;

    return this.state.started === true && appStarted;
  },

  // ============================================================
  // HEALTH CONTRACT
  // ============================================================

  healthContract() {
    const status = this.isReady() ? "OK" : "WARNING";

    return HealthContract.create("Bootstrap", status, {
      version: this.version,
      state: this.state,
    });
  },
};

globalThis.Bootstrap = Bootstrap;

globalThis.startERP = function () {
  return Bootstrap.start();
};

globalThis.bootERP = function () {
  return Bootstrap.start();
};

globalThis.erpHealth = function () {
  return Bootstrap.health();
};

globalThis.bootHealth = function () {
  return Bootstrap.health();
};

globalThis.erpDiag = function () {
  return Bootstrap.diagnostics();
};

globalThis.bootDiag = function () {
  return Bootstrap.diagnostics();
};

globalThis.resetERP = function () {
  return Bootstrap.reset();
};

Logger.log("Bootstrap READY v" + Bootstrap.version);
Logger.log("ERP COMMANDS:");
Logger.log(" startERP()");
Logger.log(" bootERP()");
Logger.log(" erpHealth()");
Logger.log(" erpDiag()");
Logger.log(" resetERP()");

