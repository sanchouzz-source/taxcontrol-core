// ============================================================
// StartupSequence v1.1.0
// Deprecated compatibility facade.
//
// The former manual component loop is intentionally disabled.
// SystemInit owns component order; Bootstrap owns ERP startup.
// ============================================================

const StartupSequence = {
  version: "1.1.0",
  deprecated: true,

  legacySteps: [
    "Logger",
    "HealthContract",
    "EntityMetadata",
    "EntityRegistry",
    "SchemaRegistry",
    "Database",
    "BaseRepository",
    "RepositoryFactory",
    "RepositoryRegistry",
    "EventBus",
    "ServiceRegistry",
    "FinanceEngine",
    "KPIEngine",
    "DashboardEngine",
  ],

  run() {
    Logger.warn(
      "StartupSequence.run() is deprecated; delegating to Bootstrap.start()"
    );

    const bootstrap = globalThis.Bootstrap;

    if (!bootstrap || typeof bootstrap.start !== "function") {
      throw new Error("Bootstrap.start unavailable");
    }

    return bootstrap.start();
  },

  health() {
    return {
      module: "StartupSequence",
      version: this.version,
      status: "DEPRECATED",
      delegatedTo: "Bootstrap.start",
    };
  },
};

globalThis.StartupSequence = StartupSequence;
