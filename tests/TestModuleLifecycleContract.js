// ============================================================
// TestModuleLifecycleContract v1.1.0
//
// Integration contract for ModuleManifest v3,
// ModuleRegistry v3 and SystemInit v3.3.
// Run in one Google Apps Script execution.
// ============================================================

const TestModuleLifecycleContract = {
  version: "1.1.0",

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

  handlerCount() {
    if (
      typeof EventBus === "undefined" ||
      !EventBus.events
    ) {
      return 0;
    }

    return Object.values(EventBus.events)
      .reduce(
        (total, handlers) =>
          total + handlers.length,
        0
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

    const initialReset = resetERP();
    this.assertSync(initialReset, "resetERP");

    const baselineHandlers =
      this.handlerCount();

    check("MANIFEST_V3_AVAILABLE", () => {
      this.assert(
        typeof ERP_MODULE_MANIFEST !==
          "undefined",
        "ERP_MODULE_MANIFEST unavailable"
      );
      this.assert(
        ERP_MODULE_MANIFEST.manifestVersion ===
          "3.1.0",
        "Unexpected manifest version"
      );
    });

    check("MANIFEST_IS_VALID", () => {
      const errors =
        ERP_MODULE_MANIFEST.validate();

      this.assertSync(
        errors,
        "ERP_MODULE_MANIFEST.validate"
      );
      this.assert(
        Array.isArray(errors) &&
          errors.length === 0,
        "Manifest errors: " +
          (errors || []).join("; ")
      );
    });

    check("WRAPPERS_KEEP_LIFECYCLE", () => {
      ERP_MODULE_MANIFEST.list()
        .forEach((name) => {
          const item =
            ERP_MODULE_MANIFEST.get(name);

          [
            "register",
            "validate",
            "init",
            "start",
            "stop",
            "health",
          ].forEach((method) => {
            this.assert(
              typeof item[method] ===
                "function",
              name +
                "." +
                method +
                " missing"
            );
          });
        });
    });

    const start = startERP();

    check("ERP_START_IS_SYNCHRONOUS", () => {
      this.assertSync(start, "startERP");
      this.assert(
        start.status === "READY",
        "ERP did not reach READY"
      );
    });

    check("REGISTRY_STARTED", () => {
      this.assert(
        ModuleRegistry.initialized === true,
        "ModuleRegistry is not initialized"
      );
      this.assert(
        ModuleRegistry.startCompleted === true,
        "Module startup did not complete"
      );
      this.assert(
        ModuleRegistry.isReady() === true,
        "Critical module readiness failed"
      );
    });

    check("ALL_MANIFEST_ITEMS_REGISTERED", () => {
      this.assert(
        ModuleRegistry.count() ===
          ERP_MODULE_MANIFEST.list().length,
        "Manifest and registry counts differ"
      );
    });

    check("MANIFEST_WRAPPERS_PRESERVED", () => {
      ERP_MODULE_MANIFEST.list()
        .forEach((name) => {
          const registered =
            ModuleRegistry.get(name);
          const source =
            ERP_MODULE_MANIFEST.get(name);

          this.assert(
            registered &&
              registered.lifecycle === source,
            name +
              " lifecycle wrapper was lost"
          );
        });
    });

    check("DEPENDENCY_ORDER", () => {
      const graph =
        ModuleRegistry.validateGraph();
      const order = graph.order;

      this.assert(
        order.indexOf("KPIEngine") <
          order.indexOf("KPISubscriptions"),
        "KPIEngine must start before KPISubscriptions"
      );
    });

    check("PHASE_ORDER", () => {
      const summary =
        ModuleRegistry.summary();
      const phases =
        summary.phases.map(
          (item) => item.phase
        );

      this.assert(
        JSON.stringify(phases) ===
          JSON.stringify(
            ModuleRegistry.phases
          ),
        "Module phases ran out of order"
      );
    });

    check("CRITICAL_MODULES_READY", () => {
      Object.values(ModuleRegistry.modules)
        .filter(
          (module) =>
            module.enabled &&
            module.autoStart &&
            module.critical
        )
        .forEach((module) => {
          this.assert(
            module.status ===
              ModuleRegistry.statuses.READY,
            module.name +
              " critical module is not READY"
          );
        });
    });

    check("IMPLEMENTATIONS_WERE_INVOKED", () => {
      Object.values(ModuleRegistry.modules)
        .filter(
          (module) =>
            module.status ===
              ModuleRegistry.statuses.READY
        )
        .forEach((module) => {
          const wrapper = module.lifecycle;

          this.assert(
            wrapper.initialized === true,
            module.name +
              " wrapper was not initialized"
          );
          this.assert(
            wrapper.started === true,
            module.name +
              " wrapper was not started"
          );
        });
    });

    check("SYSTEM_REPORTS_MODULE_MODE", () => {
      const modules =
        SystemInit.health().modules;

      this.assert(
        modules.mode === "RUNNING" ||
          modules.mode === "DEGRADED",
        "Invalid module mode " +
          modules.mode
      );
      this.assert(
        modules.readyForERP === true,
        "System module report rejected readiness"
      );
    });

    const activeHandlers =
      this.handlerCount();
    const finalReset = resetERP();

    check("RESET_IS_SYNCHRONOUS", () => {
      this.assertSync(
        finalReset,
        "final resetERP"
      );
      this.assert(
        finalReset.status === "RESET",
        "Final reset failed"
      );
    });

    check("MODULE_STATE_CLEARED", () => {
      this.assert(
        ModuleRegistry.initialized === false,
        "ModuleRegistry remained initialized"
      );
      this.assert(
        ModuleRegistry.startCompleted === false,
        "ModuleRegistry remained start-complete"
      );
      this.assert(
        ModuleRegistry.count() === 0,
        "Registered modules were not cleared"
      );
    });

    check("WRAPPER_STATE_CLEARED", () => {
      ERP_MODULE_MANIFEST.list()
        .forEach((name) => {
          const wrapper =
            ERP_MODULE_MANIFEST.get(name);

          this.assert(
            wrapper.registered === false &&
              wrapper.initialized === false &&
              wrapper.started === false,
            name +
              " wrapper state was not cleared"
          );
        });
    });

    check("OWNED_SUBSCRIPTIONS_REMOVED", () => {
      const handlersAfterReset =
        this.handlerCount();

      this.assert(
        handlersAfterReset <= activeHandlers,
        "Reset added EventBus subscriptions"
      );
      this.assert(
        handlersAfterReset >=
          baselineHandlers,
        "Reset removed unmanaged subscriptions"
      );
    });

    return {
      test: "TestModuleLifecycleContract",
      version: this.version,
      status: "PASS",
      checks,
      count: checks.length,
      timestamp:
        new Date().toISOString(),
    };
  },
};

globalThis.TestModuleLifecycleContract =
  TestModuleLifecycleContract;

function runModuleLifecycleContractTest() {
  try {
    const result =
      TestModuleLifecycleContract.run();

    Logger.log(
      "PACKAGE D MODULE CONTRACT PASS checks=" +
        result.count
    );

    return result;
  } catch (error) {
    try {
      resetERP();
    } catch (resetError) {
      Logger.error(
        "PACKAGE D MODULE TEST CLEANUP FAILED " +
          resetError.message
      );
    }

    throw error;
  }
}
