// ============================================================
// KPISubscriptions.js – Подписки на события для обновления KPI
// (аналог CRMSubscriptions)
// ============================================================
console.log("KPISubscriptions v1.0");

const KPISubscriptions = {
  version: "1.0.0",

  init() {
    if (typeof EventBus === "undefined") {
      throw new Error("EventBus unavailable for KPISubscriptions");
    }
    this.register();
    Logger.log("KPISubscriptions READY v" + this.version);
  },

  register() {
    // Подписка на завершение поездки (обновление revenue KPI)
    EventBus.subscribe(
      "TRIP_COMPLETED",
      this.onTripCompleted,
      { name: "KPI_TripCompleted" }
    );

    // Подписка на создание финансовой транзакции (обновление profit KPI)
    EventBus.subscribe(
      "FINANCIAL_TRANSACTION_CREATED",
      this.onTransactionCreated,
      { name: "KPI_TransactionCreated" }
    );
  },

  onTripCompleted(event) {
    Logger.log("KPI: Trip completed, updating revenue KPI for " + event.entityId);
  },

  onTransactionCreated(event) {
    Logger.log("KPI: Transaction created, updating financial KPI for " + event.entityId);
  }
};

// ---- РЕГИСТРАЦИЯ В ModuleRegistry ----
if (typeof ModuleRegistry !== "undefined") {
  ModuleRegistry.register("KPISubscriptions", {
    version: KPISubscriptions.version,
    phase: "DOMAIN",
    dependencies: ["EventBus"],
    init: () => KPISubscriptions.init()
  });
}

globalThis.KPISubscriptions = KPISubscriptions;