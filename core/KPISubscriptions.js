// ============================================================
// KPISubscriptions v1.2.0 – Адаптер бизнес-событий → KPI команды
// ============================================================
console.log("KPISubscriptions v1.2");

const KPISubscriptions = {
  version: "1.2.0",
  initialized: false,
  _handlers: {},            // хранилище ссылок на обработчики для отписки

  // ---- КАРТА СОБЫТИЙ: событие → метод-обработчик ----
  eventMap: {
    "TRIP_COMPLETED": "onTripCompleted",
    "FINANCIAL_TRANSACTION_CREATED": "onTransactionCreated"
  },

  // ---- ИНИЦИАЛИЗАЦИЯ ----
  init() {
    if (this.initialized) {
      Logger.log("KPISubscriptions ALREADY INITIALIZED");
      return;
    }

    if (typeof EventBus === "undefined") {
      throw new Error("KPISubscriptions: EventBus unavailable");
    }

    // Проверяем KPIEngine (не обязательная зависимость, но нужна для работы)
    if (typeof KPIEngine === "undefined") {
      Logger.warn("KPISubscriptions: KPIEngine not available, updates will be logged only");
    }

    this.register();
    this.initialized = true;
    Logger.log("KPISubscriptions READY v" + this.version);
  },

  // ---- РЕГИСТРАЦИЯ ПОДПИСОК (по карте событий) ----
  register() {
    try {
      for (const [eventName, handlerName] of Object.entries(this.eventMap)) {
        // Создаём обработчик с привязкой контекста
        const handler = (event) => this[handlerName](event);
        // Сохраняем ссылку для последующей отписки
        this._handlers[handlerName] = handler;

        EventBus.subscribe(eventName, handler, {
          name: "KPI_" + handlerName
        });
        Logger.debug(`KPISubscriptions: subscribed to ${eventName}`);
      }
    } catch (e) {
      Logger.error("KPISubscriptions: subscription failed – " + e.message);
      throw e;
    }
  },

  // ---- ОСТАНОВКА (отписка по сохранённым ссылкам) ----
  stop() {
    if (!this.initialized) return;

    try {
      for (const [eventName, handlerName] of Object.entries(this.eventMap)) {
        const handler = this._handlers[handlerName];
        if (handler) {
          EventBus.off(eventName, handler);
          delete this._handlers[handlerName];
        }
      }
      this.initialized = false;
      Logger.log("KPISubscriptions STOPPED");
    } catch (e) {
      Logger.error("KPISubscriptions: stop failed – " + e.message);
    }
  },

  // ---- ОБРАБОТЧИКИ (генерируют KPI команды) ----
  onTripCompleted(event) {
    try {
      const trip = this._extract(event);
      if (!trip) {
        Logger.warn("KPISubscriptions: TRIP_COMPLETED without payload");
        return;
      }

      // Формируем KPI команду (универсальный формат)
      const command = {
        type: "REVENUE_UPDATED",
        source: "TRIP_COMPLETED",
        entityId: trip.TripID || trip.id,
        payload: {
          revenue: trip.Revenue || trip.revenue || 0,
          trip: trip
        }
      };

      Logger.log(`KPI: Trip completed ${command.entityId}, revenue ${command.payload.revenue}`);

      // Отправляем команду в KPIEngine
      if (typeof KPIEngine !== "undefined" && typeof KPIEngine.handleCommand === "function") {
        KPIEngine.handleCommand(command);
      } else {
        Logger.debug("KPIEngine.handleCommand not available");
      }
    } catch (e) {
      Logger.error("KPISubscriptions TRIP_COMPLETED ERROR: " + e.message);
    }
  },

  onTransactionCreated(event) {
    try {
      const transaction = this._extract(event);
      if (!transaction) {
        Logger.warn("KPISubscriptions: FINANCIAL_TRANSACTION_CREATED without payload");
        return;
      }

      const command = {
        type: "TRANSACTION_CREATED",
        source: "FINANCIAL_TRANSACTION_CREATED",
        entityId: transaction.TransactionID || transaction.id,
        payload: {
          transaction: transaction,
          amount: transaction.Amount || transaction.amount || 0
        }
      };

      Logger.log(`KPI: Transaction created ${command.entityId}`);

      if (typeof KPIEngine !== "undefined" && typeof KPIEngine.handleCommand === "function") {
        KPIEngine.handleCommand(command);
      } else {
        Logger.debug("KPIEngine.handleCommand not available");
      }
    } catch (e) {
      Logger.error("KPISubscriptions FINANCIAL_TRANSACTION_CREATED ERROR: " + e.message);
    }
  },

  // ---- ВСПОМОГАТЕЛЬНЫЙ МЕТОД ИЗВЛЕЧЕНИЯ ДАННЫХ ----
  _extract(event) {
    if (!event) return null;
    return event.after ?? event.data ?? event;
  },

  // ---- HEALTH ----
  health() {
    return HealthContract.create(
      "KPISubscriptions",
      this.initialized ? "OK" : "WARNING",
      {
        version: this.version,
        initialized: this.initialized,
        subscriptions: Object.keys(this.eventMap)
      }
    );
  }
};

// ---- РЕГИСТРАЦИЯ В ModuleRegistry (phase: SERVICES) ----
if (typeof ModuleRegistry !== "undefined") {
  ModuleRegistry.register("KPISubscriptions", {
    version: KPISubscriptions.version,
    phase: "SERVICES",                     // Теперь в слое SERVICES
    dependencies: ["EventBus"],            // KPIEngine не обязателен – проверяем через typeof
    init: () => KPISubscriptions.init(),
    stop: () => KPISubscriptions.stop(),
    health: () => KPISubscriptions.health()
  });
}

globalThis.KPISubscriptions = KPISubscriptions;
Logger.log("KPISubscriptions LOADED v" + KPISubscriptions.version);