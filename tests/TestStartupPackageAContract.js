// ============================================================
// TestStartupPackageAContract v1.0.0
//
// Integration contract for the canonical synchronous startup.
// Run runStartupPackageAContractTest() in one GAS execution.
// ============================================================

const TestStartupPackageAContract = {
  version: "1.0.0",

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  },

  assertSync(result, name) {
    this.assert(
      !(result && typeof result.then === "function"),
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

    const initialReset = resetERP();

    check("INITIAL_RESET", () => {
      this.assertSync(initialReset, "resetERP");
      this.assert(
        Bootstrap.state.started === false,
        "Bootstrap remained started after reset"
      );
      this.assert(
        App.state.started === false,
        "App remained started after reset"
      );
      this.assert(
        SystemInit.initialized === false,
        "SystemInit remained initialized after reset"
      );
    });

    const firstStart = startERP();

    check("CANONICAL_START", () => {
      this.assertSync(firstStart, "startERP");
      this.assert(
        firstStart.status === "READY",
        "First start did not return READY"
      );
      this.assert(
        Bootstrap.isReady(),
        "Bootstrap did not confirm readiness"
      );
      this.assert(
        App.isReady(),
        "App did not confirm readiness"
      );
      this.assert(
        SystemInit.initialized === true,
        "SystemInit is not initialized"
      );
    });

    const bootCount = Bootstrap.state.bootCount;
    const repeatedStart = startERP();

    check("IDEMPOTENT_START", () => {
      this.assertSync(repeatedStart, "repeated startERP");
      this.assert(
        repeatedStart.status === "ALREADY_STARTED",
        "Repeated start was not idempotent"
      );
      this.assert(
        Bootstrap.state.bootCount === bootCount,
        "Repeated start changed bootCount"
      );
    });

    const aliasStart = erpStart();
    const facadeStart = ERPBootstrap.start();
    const sequenceStart = StartupSequence.run();
    const coreStart = CoreFunctions.start();

    check("COMPATIBILITY_FACADES", () => {
      [
        ["erpStart", aliasStart],
        ["ERPBootstrap.start", facadeStart],
        ["StartupSequence.run", sequenceStart],
        ["CoreFunctions.start", coreStart],
      ].forEach(([name, result]) => {
        this.assertSync(result, name);
        this.assert(
          result.status === "ALREADY_STARTED",
          name + " did not delegate idempotently"
        );
      });

      this.assert(
        Bootstrap.state.bootCount === bootCount,
        "Compatibility facade started ERP twice"
      );
    });

    const finalReset = resetERP();

    check("FULL_RESET", () => {
      this.assertSync(finalReset, "resetERP");
      this.assert(
        finalReset.status === "RESET",
        "resetERP did not return RESET"
      );
      this.assert(
        Bootstrap.state.started === false,
        "Bootstrap remained started"
      );
      this.assert(
        App.state.started === false,
        "App remained started"
      );
      this.assert(
        SystemInit.initialized === false,
        "SystemInit remained initialized"
      );
    });

    return {
      test: "TestStartupPackageAContract",
      version: this.version,
      status: "PASS",
      checks,
      timestamp: new Date().toISOString(),
    };
  },
};

globalThis.TestStartupPackageAContract =
  TestStartupPackageAContract;

function runStartupPackageAContractTest() {
  const result = TestStartupPackageAContract.run();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
