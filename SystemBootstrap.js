// ============================================================
// ERPBootstrap v4.1.0
// Deprecated compatibility facade.
//
// It has no state and declares no public ERP commands.
// Canonical entry point: startERP() in Bootstrap.js.
// ============================================================

console.log("ERPBootstrap v4.1.0");

const ERPBootstrap = {
  version: "4.1.0",
  deprecated: true,

  get state() {
    const bootstrap = globalThis.Bootstrap;
    return bootstrap ? bootstrap.state : null;
  },

  start() {
    const bootstrap = globalThis.Bootstrap;

    if (!bootstrap || typeof bootstrap.start !== "function") {
      throw new Error("Bootstrap.start unavailable");
    }

    return bootstrap.start();
  },

  health() {
    const bootstrap = globalThis.Bootstrap;

    if (!bootstrap || typeof bootstrap.health !== "function") {
      return {
        module: "ERPBootstrap",
        version: this.version,
        status: "FAILED",
        error: "Bootstrap.health unavailable",
      };
    }

    return bootstrap.health();
  },

  status() {
    const bootstrap = globalThis.Bootstrap;

    return bootstrap &&
      typeof bootstrap.status === "function"
      ? bootstrap.status()
      : {
          status: "FAILED",
          error: "Bootstrap.status unavailable",
        };
  },

  diagnostics() {
    const bootstrap = globalThis.Bootstrap;

    return bootstrap &&
      typeof bootstrap.diagnostics === "function"
      ? bootstrap.diagnostics()
      : {
          status: "FAILED",
          error: "Bootstrap.diagnostics unavailable",
        };
  },

  versionReport() {
    const bootstrap = globalThis.Bootstrap;

    return bootstrap &&
      typeof bootstrap.versionReport === "function"
      ? bootstrap.versionReport()
      : {
          ERPBootstrap: this.version,
          Bootstrap: "-",
        };
  },

  reset() {
    const bootstrap = globalThis.Bootstrap;

    if (!bootstrap || typeof bootstrap.stop !== "function") {
      throw new Error("Bootstrap.stop unavailable");
    }

    return bootstrap.stop();
  },
};

globalThis.ERPBootstrap = ERPBootstrap;

Logger.log(
  "ERPBootstrap compatibility facade READY v" +
    ERPBootstrap.version
);
