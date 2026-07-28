// ============================================================
// TestSystemStartupContract v1.0.0
// Isolated Bootstrap + Startup Safety Contract
// TaxControl ERP
//
// The test does not access SpreadsheetApp or business tables.
// ============================================================

console.log("TestSystemStartupContract v1.0.0");

const TestSystemStartupContract = {
  version: "1.0.0",

  run() {
    Logger.log(
      "========== SYSTEM STARTUP CONTRACT TEST START =========="
    );

    const tests = [
      ["DEPENDENCIES", () => this.testDependencies()],
      ["BOOTSTRAP_SYNCHRONOUS", () =>
        this.testBootstrapSynchronous()],
      ["STAGED_STARTUP_FLOW", () =>
        this.testStagedStartupFlow()],
      ["FULL_MODE_GUARDS", () =>
        this.testFullModeGuards()],
      ["LIFECYCLE_SAFE_ZERO_WRITES", () =>
        this.testLifecycleSafeZeroWrites()],
    ];

    const report = {
      module: "TestSystemStartupContract",
      version: this.version,
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: tests.length,
        passed: 0,
        failed: 0,
      },
      status: "UNKNOWN",
    };

    tests.forEach((item) => {
      const name = item[0];
      const fn = item[1];
      const start = Date.now();

      try {
        const details = fn();

        report.tests.push({
          name,
          status: "PASS",
          durationMs: Date.now() - start,
          details,
        });
        report.summary.passed++;
        Logger.log(name + " PASS");
      } catch (error) {
        report.tests.push({
          name,
          status: "FAIL",
          durationMs: Date.now() - start,
          error: error.message,
        });
        report.summary.failed++;
        Logger.error(name + " FAIL: " + error.message);
      }
    });

    report.status =
      report.summary.failed === 0 ? "PASS" : "FAIL";

    Logger.log(JSON.stringify(report, null, 2));
    Logger.log(
      "========== SYSTEM STARTUP CONTRACT TEST " +
        report.status +
        " =========="
    );

    return report;
  },

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  },

  testDependencies() {
    this.assert(
      typeof Bootstrap !== "undefined",
      "Bootstrap missing"
    );
    this.assert(
      Bootstrap.version === "3.1.0",
      "Bootstrap version must be 3.1.0"
    );
    this.assert(
      typeof SystemStartupTest !== "undefined",
      "SystemStartupTest missing"
    );
    this.assert(
      SystemStartupTest.version === "2.0.0",
      "SystemStartupTest version must be 2.0.0"
    );
    this.assert(
      typeof TestEntityLifecycleMatrix !== "undefined",
      "TestEntityLifecycleMatrix missing"
    );
    this.assert(
      TestEntityLifecycleMatrix.version === "2.3.0",
      "TestEntityLifecycleMatrix version must be 2.3.0"
    );

    return {
      Bootstrap: Bootstrap.version,
      SystemStartupTest: SystemStartupTest.version,
      TestEntityLifecycleMatrix:
        TestEntityLifecycleMatrix.version,
    };
  },

  testBootstrapSynchronous() {
    this.assert(
      typeof App !== "undefined",
      "App missing"
    );

    const savedState = globalThis.__ERP_STATE__;
    const savedStart = App.start;
    const savedHealth = App.health;
    const savedAppState = App.state;

    try {
      globalThis.__ERP_STATE__ = {
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

      App.state = {
        status: "CREATED",
        started: false,
        starting: false,
      };

      App.start = function () {
        App.state.started = true;
        App.state.status = "READY";
        return {
          status: "READY",
          source: "isolated-test",
        };
      };

      App.health = function () {
        return {
          status: App.state.status,
        };
      };

      const result = Bootstrap.start();

      this.assert(
        !result || typeof result.then !== "function",
        "Bootstrap.start returned Promise"
      );
      this.assert(
        result.status === "READY",
        "Bootstrap result not READY"
      );
      this.assert(
        Bootstrap.state.started === true,
        "Bootstrap state not started"
      );
      this.assert(
        Bootstrap.state.starting === false,
        "Bootstrap remained starting"
      );
      this.assert(
        Bootstrap.state.bootCount === 1,
        "Unexpected boot count"
      );

      return {
        synchronous: true,
        status: result.status,
        bootCount: Bootstrap.state.bootCount,
      };
    } finally {
      App.start = savedStart;
      App.health = savedHealth;
      App.state = savedAppState;
      globalThis.__ERP_STATE__ = savedState;
    }
  },

  testStagedStartupFlow() {
    const saved = {
      startERP: globalThis.startERP,
      erpHealth: globalThis.erpHealth,
      diagnosticRun: ERPDiagnostics.run,
      coreRun: CoreInfrastructureTest.run,
      matrixRun: TestEntityLifecycleMatrix.run,
    };

    const calls = {
      boot: 0,
      diagnostics: [],
      core: [],
      lifecycle: [],
    };

    try {
      globalThis.startERP = function () {
        calls.boot++;
        return {
          status: "READY",
        };
      };

      globalThis.erpHealth = function () {
        return {
          status: "READY",
        };
      };

      ERPDiagnostics.run = function (options) {
        calls.diagnostics.push(options);
        return {
          status: "OK",
        };
      };

      CoreInfrastructureTest.run = function (options) {
        calls.core.push(options);
        return {
          summary: {
            failed: 0,
          },
        };
      };

      TestEntityLifecycleMatrix.run = function (options) {
        calls.lifecycle.push(options);
        return {
          summary: {
            failed: 0,
          },
        };
      };

      const result = SystemStartupTest.run({
        full: false,
      });

      this.assert(
        result.status === "ERP_READY",
        "Staged startup not ERP_READY"
      );
      this.assert(calls.boot === 1, "Boot call count mismatch");
      this.assert(
        calls.diagnostics.length === 1 &&
          calls.diagnostics[0].skipCoreTest === true,
        "Diagnostics did not skip nested core test"
      );
      this.assert(
        calls.core.length === 1 &&
          calls.core[0].safe === true,
        "Core test not in safe mode"
      );
      this.assert(
        calls.lifecycle.length === 1 &&
          calls.lifecycle[0].safe === true,
        "Lifecycle test not in safe mode"
      );
      this.assert(
        result.repair.status === "SKIPPED",
        "Repair must be skipped in staged mode"
      );

      return {
        status: result.status,
        bootCalls: calls.boot,
        diagnosticsSafe: true,
        coreSafe: true,
        lifecycleSafe: true,
        repairSkipped: true,
      };
    } finally {
      globalThis.startERP = saved.startERP;
      globalThis.erpHealth = saved.erpHealth;
      ERPDiagnostics.run = saved.diagnosticRun;
      CoreInfrastructureTest.run = saved.coreRun;
      TestEntityLifecycleMatrix.run = saved.matrixRun;
    }
  },

  testFullModeGuards() {
    let startupBlocked = false;
    let lifecycleBlocked = false;

    try {
      SystemStartupTest.runFull();
    } catch (error) {
      startupBlocked =
        error.message.indexOf("allowWrites:true") >= 0;
    }

    try {
      TestEntityLifecycleMatrix.runFull();
    } catch (error) {
      lifecycleBlocked =
        error.message.indexOf("allowWrites:true") >= 0;
    }

    this.assert(
      startupBlocked,
      "Full startup was not guarded"
    );
    this.assert(
      lifecycleBlocked,
      "Full lifecycle was not guarded"
    );

    return {
      startupGuard: true,
      lifecycleGuard: true,
    };
  },

  testLifecycleSafeZeroWrites() {
    const entityServiceMethods = [
      "create",
      "findById",
      "update",
      "delete",
      "restore",
    ];

    const saved = {
      metadataGet: EntityMetadata.get,
      factoryGet: RepositoryFactory.get,
      factoryMetadata: RepositoryFactory.metadata,
      validatorCheck: EntityValidator.check,
      entityHealth: EntityService.health,
      entityMethods: {},
    };

    const writeCalls = [];

    const repo = {
      version: "test",
      create() {},
      findById() {},
      findAll() {},
      update() {},
      delete() {},
      restore() {},
      exists() {},
    };

    try {
      EntityMetadata.get = function (entity) {
        return {
          entity,
          table: entity,
          idField: "ID",
          fields: {
            ID: {
              type: "ID",
            },
          },
        };
      };

      RepositoryFactory.get = function () {
        return repo;
      };

      RepositoryFactory.metadata = {
        __TEST_DATABASE: { type: "CUSTOM" },
        CLIENT: { type: "CUSTOM" },
        TRIP: { type: "CUSTOM" },
        KPI: { type: "CUSTOM" },
      };

      EntityValidator.check = function () {
        return {
          valid: false,
          errors: ["Unknown field: UnknownField"],
        };
      };

      EntityService.health = function () {
        return {
          status: "OK",
          details: {
            version: EntityService.version,
          },
        };
      };

      entityServiceMethods.forEach((name) => {
        saved.entityMethods[name] = EntityService[name];
        EntityService[name] = function () {
          writeCalls.push(name);
          throw new Error(
            "EntityService." + name + " called in safe mode"
          );
        };
      });

      const result = TestEntityLifecycleMatrix.run({
        safe: true,
      });

      this.assert(
        result.mode === "SAFE",
        "Lifecycle mode not SAFE"
      );
      this.assert(
        result.summary.failed === 0,
        "Safe lifecycle has failures"
      );
      this.assert(
        writeCalls.length === 0,
        "Safe lifecycle called EntityService: " +
          writeCalls.join(",")
      );

      return {
        mode: result.mode,
        passed: result.summary.passed,
        failed: result.summary.failed,
        entityServiceCalls: writeCalls.length,
      };
    } finally {
      EntityMetadata.get = saved.metadataGet;
      RepositoryFactory.get = saved.factoryGet;
      RepositoryFactory.metadata = saved.factoryMetadata;
      EntityValidator.check = saved.validatorCheck;
      EntityService.health = saved.entityHealth;

      entityServiceMethods.forEach((name) => {
        EntityService[name] = saved.entityMethods[name];
      });
    }
  },
};

globalThis.TestSystemStartupContract =
  TestSystemStartupContract;

globalThis.runSystemStartupContractTest = function () {
  Logger.log(
    "========== MANUAL SYSTEM STARTUP CONTRACT RUN =========="
  );

  const report = TestSystemStartupContract.run();

  if (report.summary.failed > 0) {
    throw new Error(
      "SYSTEM STARTUP CONTRACT FAILED: " +
        report.summary.failed
    );
  }

  Logger.log(
    "MANUAL TEST RESULT: PASS, passed=" +
      report.summary.passed +
      ", failed=" +
      report.summary.failed
  );

  return report;
};

Logger.log(
  "TestSystemStartupContract READY v" +
    TestSystemStartupContract.version
);

