// ============================================================
// TestSystemInitContract v4.0.0
//
// Integration contract for SystemInit v3.2+.
// Run runSystemInitContractTest() in one GAS execution.
// The test never clears persisted schema tables.
// ============================================================

const TestSystemInitContract = {
  version: "4.0.0",

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  },

  assertSync(result, name) {
    this.assert(
      !(
        result &&
        typeof result.then === "function"
      ),
      name + " returned Promise"
    );
  },

  run() {
    const checks = [];

    const check = (name, fn) => {
      fn();
      checks.push({
        name,
        status: "PASS",
      });
    };

    const orderBefore = (before, after) => {
      const order = SystemInit.startupOrder;
      const beforeIndex = order.indexOf(before);
      const afterIndex = order.indexOf(after);

      this.assert(
        beforeIndex >= 0,
        before + " missing from startup order"
      );

      this.assert(
        afterIndex >= 0,
        after + " missing from startup order"
      );

      this.assert(
        beforeIndex < afterIndex,
        before + " must start before " + after
      );
    };

    const initialReset = resetERP();

    check("INITIAL_RESET_IS_SYNC", () => {
      this.assertSync(initialReset, "resetERP");
      this.assert(
        initialReset.status === "RESET",
        "Initial reset did not return RESET"
      );
    });

    check("INITIAL_SYSTEM_STATE", () => {
      this.assert(
        SystemInit.initialized === false,
        "SystemInit remained initialized"
      );
      this.assert(
        SystemInit.status === "CREATED",
        "SystemInit did not return to CREATED"
      );
      this.assert(
        Object.keys(SystemInit.componentStatus)
          .length === 0,
        "Component status was not cleared"
      );
    });

    const startResult = startERP();

    check("START_IS_SYNCHRONOUS", () => {
      this.assertSync(startResult, "startERP");
      this.assert(
        startResult.status === "READY",
        "startERP did not return READY"
      );
    });

    check("SYSTEM_READY_IS_CONFIRMED", () => {
      this.assert(
        SystemInit.initialized === true,
        "SystemInit is not initialized"
      );
      this.assert(
        SystemInit.status === "READY",
        "SystemInit lifecycle status is not READY"
      );
      this.assert(
        SystemInit.isReady() === true,
        "SystemInit readiness check failed"
      );
      this.assert(
        App.isReady() === true,
        "App readiness check failed"
      );
    });

    check("GRAPH_IS_VALID", () => {
      const graph = SystemInit.validateGraph();

      this.assert(
        graph.valid === true,
        "Lifecycle graph is invalid"
      );
      this.assert(
        graph.count ===
          Object.keys(
            SystemInit.componentDefinitions
          ).length,
        "Lifecycle graph lost components"
      );
    });

    check("FOUNDATION_ORDER", () => {
      orderBefore("Logger", "Config");
      orderBefore(
        "EntityMetadata",
        "EntityRegistry"
      );
      orderBefore(
        "EntityRegistry",
        "SchemaRegistry"
      );
    });

    check("SCHEMA_ORDER", () => {
      orderBefore(
        "SpreadsheetAdapter",
        "SchemaStorage"
      );
      orderBefore(
        "SpreadsheetAdapter",
        "SchemaManager"
      );
      orderBefore(
        "SchemaBuilder",
        "SchemaManager"
      );
      orderBefore(
        "SchemaStorage",
        "SchemaManager"
      );
    });

    check("REPOSITORY_ORDER", () => {
      orderBefore("SchemaManager", "Database");
      orderBefore("Database", "BaseRepository");
      orderBefore(
        "BaseRepository",
        "RepositoryFactory"
      );
      orderBefore(
        "RepositoryFactory",
        "RepositoryRegistry"
      );
      orderBefore(
        "RepositoryRegistry",
        "EntityService"
      );
    });

    check("EVENT_AND_SERVICE_ORDER", () => {
      orderBefore(
        "ERPEventContract",
        "EventBus"
      );
      orderBefore(
        "EntityService",
        "ServiceRegistry"
      );
      orderBefore(
        "EventBus",
        "ServiceRegistry"
      );
      orderBefore(
        "ServiceRegistry",
        "ClientService"
      );
      orderBefore(
        "ServiceRegistry",
        "TransportOrderService"
      );
    });

    check("CRITICAL_COMPONENTS_READY", () => {
      SystemInit.criticalComponents
        .forEach((name) => {
          const status =
            SystemInit.componentStatus[name];

          this.assert(
            status &&
              status.status === "READY",
            name + " is not READY"
          );
        });
    });

    check("READY_HAS_TIMING_EVIDENCE", () => {
      SystemInit.criticalComponents
        .forEach((name) => {
          const status =
            SystemInit.componentStatus[name];

          this.assert(
            typeof status.duration === "number" &&
              status.duration >= 0,
            name + " has invalid duration"
          );
          this.assert(
            !!status.startedAt &&
              !!status.finishedAt,
            name + " has incomplete timestamps"
          );
        });
    });

    check("REQUIRED_SERVICES_READY", () => {
      [
        "ClientService",
        "TransportOrderService",
      ].forEach((name) => {
        this.assert(
          ServiceRegistry.has(name),
          name + " missing in ServiceRegistry"
        );
        this.assert(
          SystemInit.componentStatus[name]
            .status === "READY",
          name + " lifecycle is not READY"
        );
      });
    });

    check("MODULE_LIFECYCLE_IS_EXPLICIT", () => {
      const health = SystemInit.health();

      this.assert(
        health.modules.mode ===
          "REGISTERED_ONLY" ||
          health.modules.mode === "UNAVAILABLE",
        "Module lifecycle mode is ambiguous"
      );

      if (
        health.modules.mode ===
        "REGISTERED_ONLY"
      ) {
        this.assert(
          health.modules.startedAll === false,
          "Package C must not start modules"
        );
      }
    });

    check("SYSTEM_HEALTH_IS_TRUTHFUL", () => {
      const health = SystemInit.health();

      this.assert(
        health.status === "OK",
        "SystemInit health is not OK"
      );
      this.assert(
        health.ready === true,
        "SystemInit health does not confirm readiness"
      );
      this.assert(
        health.critical.ready.length ===
          health.critical.required.length,
        "Not all critical components are ready"
      );
    });

    const bootCount = Bootstrap.state.bootCount;
    const repeatedStart = startERP();

    check("START_IS_IDEMPOTENT", () => {
      this.assertSync(
        repeatedStart,
        "repeated startERP"
      );
      this.assert(
        repeatedStart.status ===
          "ALREADY_STARTED",
        "Repeated start is not idempotent"
      );
      this.assert(
        Bootstrap.state.bootCount === bootCount,
        "Repeated start changed bootCount"
      );
    });

    const finalReset = resetERP();

    check("FINAL_RESET_IS_SYNCHRONOUS", () => {
      this.assertSync(finalReset, "resetERP");
      this.assert(
        finalReset.status === "RESET",
        "Final reset did not return RESET"
      );
    });

    check("DEEP_RUNTIME_RESET", () => {
      const falseFlags = [
        [
          "Config.initialized",
          Config.initialized,
        ],
        [
          "EntityMetadata.initialized",
          EntityMetadata.initialized,
        ],
        [
          "EntityRegistry.initialized",
          EntityRegistry.initialized,
        ],
        [
          "SchemaRegistry.initialized",
          SchemaRegistry.initialized,
        ],
        [
          "SpreadsheetAdapter.initialized",
          SpreadsheetAdapter.initialized,
        ],
        [
          "SchemaManager.initialized",
          SchemaManager.initialized,
        ],
        [
          "Database.initialized",
          Database.initialized,
        ],
        [
          "RepositoryFactory.initialized",
          RepositoryFactory.initialized,
        ],
        [
          "RepositoryRegistry.ready",
          RepositoryRegistry.ready,
        ],
        [
          "EntityService.ready",
          EntityService.ready,
        ],
        [
          "EventBus.ready",
          EventBus.ready,
        ],
        [
          "ServiceRegistry.initialized",
          ServiceRegistry.initialized,
        ],
        [
          "ClientService.initialized",
          ClientService.initialized,
        ],
        [
          "TransportOrderService.initialized",
          TransportOrderService.initialized,
        ],
      ];

      falseFlags.forEach(([name, value]) => {
        this.assert(
          value === false,
          name + " was not reset"
        );
      });

      this.assert(
        BaseRepository.ready() === false,
        "BaseRepository remained ready"
      );

      if (
        typeof ModuleRegistry !== "undefined"
      ) {
        this.assert(
          ModuleRegistry.initialized === false,
          "ModuleRegistry remained initialized"
        );
      }

      this.assert(
        SystemInit.initialized === false &&
          SystemInit.status === "CREATED",
        "SystemInit did not return to CREATED"
      );
    });

    return {
      test: "TestSystemInitContract",
      version: this.version,
      status: "PASS",
      checks,
      count: checks.length,
      timestamp: new Date().toISOString(),
    };
  },
};

globalThis.TestSystemInitContract =
  TestSystemInitContract;

function runSystemInitContractTest() {
  let result;

  try {
    result =
      TestSystemInitContract.run();

    Logger.log(
      "PACKAGE C CONTRACT PASS checks=" +
        result.count
    );

    return result;
  } catch (error) {
    try {
      resetERP();
    } catch (resetError) {
      Logger.error(
        "PACKAGE C TEST CLEANUP FAILED " +
          resetError.message
      );
    }

    throw error;
  }
}

// Explicit compatibility alias for package documentation and direct runs.
function runSystemInitLifecycleContractTest() {
  return runSystemInitContractTest();
}
