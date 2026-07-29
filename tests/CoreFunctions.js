// ============================================================
// CoreFunctions v3.1.0
// Test and compatibility facade.
//
// It does not own ERP state and does not declare startERP,
// erpHealth or erpDiag.
// ============================================================

console.log("CoreFunctions v3.1.0");

const CoreFunctions = {
  version: "3.1.0",

  checkCore() {
    const required = [
      "Logger",
      "SystemInit",
      "App",
      "Bootstrap",
    ];

    const missing = required.filter(
      (name) => typeof globalThis[name] === "undefined"
    );

    return {
      ok: missing.length === 0,
      missing,
    };
  },

  start() {
    Logger.log(
      "========== CORE FUNCTIONS START =========="
    );

    const check = this.checkCore();

    if (!check.ok) {
      throw new Error(
        "Missing core: " + check.missing.join(",")
      );
    }

    const result = globalThis.Bootstrap.start();

    if (result && typeof result.then === "function") {
      throw new Error(
        "CoreFunctions.start must remain synchronous"
      );
    }

    return result;
  },

  health() {
    const bootstrap = globalThis.Bootstrap;

    if (!bootstrap) {
      return {
        status: "FAILED",
        error: "Bootstrap unavailable",
      };
    }

    bootstrap.ensureStarted();
    return bootstrap.health();
  },

  diagnostics() {
    const bootstrap = globalThis.Bootstrap;

    if (!bootstrap) {
      return {
        status: "FAILED",
        error: "Bootstrap unavailable",
      };
    }

    bootstrap.ensureStarted();
    return bootstrap.diagnostics();
  },

  startupTest() {
    const test = globalThis.SystemStartupTest;

    if (test && typeof test.fullHealth === "function") {
      return test.fullHealth();
    }

    return {
      status: "WARNING",
      message: "SystemStartupTest unavailable",
    };
  },

  status() {
    const bootstrap = globalThis.Bootstrap;

    return bootstrap
      ? bootstrap.status()
      : {
          status: "FAILED",
          error: "Bootstrap unavailable",
        };
  },
};

globalThis.CoreFunctions = CoreFunctions;

function erpTest() {
  return CoreFunctions.startupTest();
}

Logger.log(
  "CoreFunctions READY v" + CoreFunctions.version
);
