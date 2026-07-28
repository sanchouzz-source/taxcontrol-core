// ============================================================
// SystemStartupTest v2.0.0
// ERP Staged Startup Validation
// TaxControl ERP Core
//
// Compatible:
// SystemInit v2.9+
// Bootstrap v3.1+
// ERPDiagnostics v6+
// CoreInfrastructureTest v2.6+
// TestEntityLifecycleMatrix v2.3+
//
// Default run:
// - boots ERP synchronously
// - checks health and diagnostics
// - runs read-only core and entity contract checks
// - does not run DataRepair
// - does not execute entity CRUD
//
// Full mode requires allowWrites:true.
// ============================================================

console.log("SystemStartupTest v2.0.0");

const SystemStartupTest = {
  version: "2.0.0",

  run(options = {}) {
    const full = options.full === true;

    if (full && options.allowWrites !== true) {
      throw new Error(
        "Full startup test requires allowWrites:true"
      );
    }

    Logger.log(
      "========== SYSTEM STARTUP TEST v2 " +
        (full ? "FULL" : "STAGED") +
        " =========="
    );

    const result = {
      version: this.version,
      timestamp: new Date().toISOString(),
      mode: full ? "FULL" : "STAGED",
      businessWritesAllowed: full,
      boot: {},
      health: {},
      diagnostics: {},
      core: {},
      lifecycle: {},
      repair: {
        status: "SKIPPED",
        reason: "Not part of staged startup",
      },
      status: "UNKNOWN",
    };

    try {
      Logger.log("STEP 1: ERP BOOT");
      result.boot = this.boot();

      Logger.log("STEP 2: HEALTH");
      result.health = this.healthReport();

      Logger.log("STEP 3: DIAGNOSTICS");
      result.diagnostics = this.diagnostics();

      Logger.log("STEP 4: CORE INFRASTRUCTURE");
      if (
        typeof CoreInfrastructureTest !== "undefined" &&
        typeof CoreInfrastructureTest.run === "function"
      ) {
        result.core = CoreInfrastructureTest.run({
          safe: true,
        });
      }

      Logger.log("STEP 5: ENTITY CONTRACTS");
      if (
        typeof TestEntityLifecycleMatrix !== "undefined" &&
        typeof TestEntityLifecycleMatrix.run === "function"
      ) {
        result.lifecycle = TestEntityLifecycleMatrix.run({
          safe: !full,
        });
      }

      if (full && options.runRepair === true) {
        Logger.log("STEP 6: DATA REPAIR CHECK");
        result.repair = this.repair();
      }

      result.status = this.calculateStatus(result);

      Logger.log(JSON.stringify(result, null, 2));
      Logger.log(
        "========== SYSTEM STARTUP COMPLETE " +
          result.status +
          " =========="
      );

      return result;
    } catch (error) {
      Logger.error("SYSTEM STARTUP FAILED " + error.message);
      result.status = "FAILED";
      result.error = error.message;
      return result;
    }
  },

  boot() {
    let result;

    if (typeof startERP === "function") {
      result = startERP();
    } else if (
      typeof SystemInit !== "undefined" &&
      typeof SystemInit.init === "function"
    ) {
      result = SystemInit.init();
    } else {
      throw new Error("ERP startup command missing");
    }

    if (result && typeof result.then === "function") {
      throw new Error(
        "ERP startup returned Promise; Bootstrap must be synchronous"
      );
    }

    return result;
  },

  healthReport() {
    const result = {};

    if (typeof erpHealth === "function") {
      result.system = erpHealth();
    }

    if (
      typeof TestRunner !== "undefined" &&
      typeof TestRunner.health === "function"
    ) {
      result.tests = TestRunner.health();
    }

    if (
      typeof HealthService !== "undefined" &&
      typeof HealthService.checkAll === "function"
    ) {
      result.modules = HealthService.checkAll();
    }

    return result;
  },

  diagnostics() {
    if (
      typeof ERPDiagnostics !== "undefined" &&
      typeof ERPDiagnostics.run === "function"
    ) {
      return ERPDiagnostics.run({
        skipCoreTest: true,
      });
    }

    return {
      status: "SKIPPED",
      reason: "ERPDiagnostics unavailable",
    };
  },

  repair() {
    if (typeof DataRepair === "undefined") {
      return {
        status: "SKIPPED",
        reason: "DataRepair unavailable",
      };
    }

    try {
      if (typeof DataRepair.scan === "function") {
        return DataRepair.scan();
      }

      return {
        status: "AVAILABLE",
      };
    } catch (error) {
      return {
        status: "ERROR",
        error: error.message,
      };
    }
  },

  calculateStatus(result) {
    const failures = [];

    if (result.boot && typeof result.boot.then === "function") {
      failures.push("BOOT_PROMISE");
    }

    if (
      result.boot === false ||
      (result.boot && result.boot.status === "FAILED")
    ) {
      failures.push("BOOT");
    }

    if (
      result.core &&
      result.core.summary &&
      Number(result.core.summary.failed || 0) > 0
    ) {
      failures.push("CORE");
    }

    if (
      result.lifecycle &&
      result.lifecycle.summary &&
      Number(result.lifecycle.summary.failed || 0) > 0
    ) {
      failures.push("LIFECYCLE");
    }

    if (
      result.diagnostics &&
      ["CRITICAL", "FAILED"].indexOf(
        result.diagnostics.status
      ) >= 0
    ) {
      failures.push("DIAGNOSTICS");
    }

    if (
      typeof Bootstrap !== "undefined" &&
      Bootstrap.state &&
      Bootstrap.state.failed === true
    ) {
      failures.push("BOOTSTRAP_STATE");
    }

    result.failures = failures;

    if (failures.length === 0) {
      return "ERP_READY";
    }

    if (failures.length <= 2) {
      return "WARNING";
    }

    return "FAILED";
  },

  runStaged() {
    return this.run({
      full: false,
    });
  },

  runSafe() {
    // Compatibility alias. Startup can persist system schema metadata,
    // but it does not run business entity CRUD in this mode.
    return this.runStaged();
  },

  runFull(options = {}) {
    return this.run({
      full: true,
      allowWrites: options.allowWrites === true,
      runRepair: options.runRepair === true,
    });
  },

  health() {
    return HealthContract.create("SystemStartupTest", "OK", {
      version: this.version,
      stagedCommand: "testSystemStartup()",
      fullCommand: "testSystemStartupFull(true)",
    });
  },
};

globalThis.SystemStartupTest = SystemStartupTest;

globalThis.testSystemStartup = function () {
  return SystemStartupTest.runStaged();
};

globalThis.testSystemStartupFull = function (
  allowWrites,
  runRepair
) {
  return SystemStartupTest.runFull({
    allowWrites: allowWrites === true,
    runRepair: runRepair === true,
  });
};

globalThis.testDataRepair = function () {
  if (typeof DataRepair === "undefined") {
    throw new Error("DataRepair unavailable");
  }

  return DataRepair.scan();
};

globalThis.testEntityServiceBoot = function () {
  if (typeof EntityService === "undefined") {
    throw new Error("EntityService missing");
  }

  return EntityService.health();
};

Logger.log(
  "SystemStartupTest READY v" +
    SystemStartupTest.version
);

