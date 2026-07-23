// ============================================================
// NotificationSubscriptions v1.3.0
// ERP TexControl Event Adapter (улучшенная версия)
// ============================================================

console.log("NotificationSubscriptions v1.3.0");

const NotificationSubscriptions = {
  version: "1.3.0",
  initialized: false,
  _handlers: {},

  // ---- КАРТА СОБЫТИЙ (расширенная) ----
  eventMap: {
    // Логистика
    "TRANSPORT_ORDER_CREATED": "onTransportOrderCreated",
    "TRANSPORT_ORDER_UPDATED": "onTransportOrderUpdated",
    "TRIP_ASSIGNED": "onTripAssigned",
    "TRIP_STARTED": "onTripStarted",
    "TRIP_COMPLETED": "onTripCompleted",
    "TRIP_DELAYED": "onTripDelayed",
    // Финансы
    "PAYMENT_RECEIVED": "onPaymentReceived",
    "PAYMENT_OVERDUE": "onPaymentOverdue",
    "EXPENSE_CREATED": "onExpenseCreated",
    // Документы
    "DOCUMENT_EXPIRED": "onDocumentExpired",
    "CONTRACT_EXPIRED": "onContractExpired",
    // Система
    "MODULE_FAILED": "onModuleFailed",
    "FAILED_EVENT_CREATED": "onFailedEventCreated",
    // Клиенты (дополнительно)
    "CLIENT_CREATED": "onClientCreated"
  },

  // ---- ИНИЦИАЛИЗАЦИЯ ----
  init() {
    if (this.initialized) {
      Logger.log("NotificationSubscriptions already initialized");
      return;
    }

    if (typeof EventBus === "undefined") {
      throw new Error("NotificationSubscriptions: EventBus unavailable");
    }

    if (typeof NotificationService === "undefined") {
      Logger.warn("NotificationService unavailable, notifications disabled");
    }

    this.register();
    this.initialized = true;
    Logger.log("NotificationSubscriptions READY v" + this.version);
  },

  // ---- РЕГИСТРАЦИЯ ПОДПИСОК (цикл по карте) ----
  register() {
    try {
      for (const [eventName, handlerName] of Object.entries(this.eventMap)) {
        // Сохраняем обработчик с привязкой контекста
        const handler = (event) => this[handlerName](event);
        this._handlers[eventName] = handler;

        EventBus.subscribe(eventName, handler, {
          name: "Notification_" + handlerName
        });
        Logger.debug(`NotificationSubscriptions: subscribed to ${eventName}`);
      }
    } catch (e) {
      Logger.error("NotificationSubscriptions: subscription failed – " + e.message);
      throw e;
    }
  },

  // ---- ОСТАНОВКА (отписка) ----
  stop() {
    if (!this.initialized) return;
    try {
      for (const [eventName, handler] of Object.entries(this._handlers)) {
        EventBus.off(eventName, handler);
      }
      this._handlers = {};
      this.initialized = false;
      Logger.log("NotificationSubscriptions STOPPED");
    } catch (e) {
      Logger.error("NotificationSubscriptions: stop failed – " + e.message);
    }
  },

  // ---- ВСПОМОГАТЕЛЬНЫЙ МЕТОД ----
  _extract(event) {
    return event?.after ?? event?.data ?? event ?? null;
  },

  // ---- ЕДИНЫЙ МЕТОД ОТПРАВКИ ----
  send(type, payload) {
    if (typeof NotificationService !== "undefined" && typeof NotificationService.send === "function") {
      NotificationService.send({ type, payload });
    } else {
      Logger.log(`Notification skipped: ${type}`);
    }
  },

  // ---- ОБРАБОТЧИКИ СОБЫТИЙ ----
  onTransportOrderCreated(event) {
    const order = this._extract(event);
    if (!order) return;
    Logger.log(`📦 NOTIFY: Transport order created ${order.id || order.TransportOrderID}`);
    this.send("ORDER_CREATED", order);
  },

  onTransportOrderUpdated(event) {
    const order = this._extract(event);
    if (!order) return;
    Logger.log(`📝 NOTIFY: Transport order updated ${order.id || order.TransportOrderID}`);
    this.send("ORDER_UPDATED", order);
  },

  onTripAssigned(event) {
    const trip = this._extract(event);
    if (!trip) return;
    Logger.log(`🚚 NOTIFY: Trip assigned ${trip.id || trip.TripID}`);
    this.send("TRIP_ASSIGNED", trip);
  },

  onTripStarted(event) {
    const trip = this._extract(event);
    if (!trip) return;
    Logger.log(`▶️ NOTIFY: Trip started ${trip.id || trip.TripID}`);
    this.send("TRIP_STARTED", trip);
  },

  onTripCompleted(event) {
    const trip = this._extract(event);
    if (!trip) return;
    Logger.log(`✅ NOTIFY: Trip completed ${trip.id || trip.TripID}`);
    this.send("TRIP_COMPLETED", trip);
  },

  onTripDelayed(event) {
    const trip = this._extract(event);
    if (!trip) return;
    Logger.log(`⏰ NOTIFY: Trip delayed ${trip.id || trip.TripID}`);
    this.send("TRIP_DELAYED", trip);
  },

  onPaymentReceived(event) {
    const payment = this._extract(event);
    if (!payment) return;
    Logger.log(`💰 NOTIFY: Payment received ${payment.id || payment.TransactionID}`);
    this.send("PAYMENT_RECEIVED", payment);
  },

  onPaymentOverdue(event) {
    const payment = this._extract(event);
    if (!payment) return;
    Logger.log(`⚠️ NOTIFY: Payment overdue ${payment.id || payment.TransactionID}`);
    this.send("PAYMENT_OVERDUE", payment);
  },

  onExpenseCreated(event) {
    const expense = this._extract(event);
    if (!expense) return;
    Logger.log(`💸 NOTIFY: Expense created ${expense.id || expense.ExpenseID}`);
    this.send("EXPENSE_CREATED", expense);
  },

  onDocumentExpired(event) {
    const doc = this._extract(event);
    if (!doc) return;
    Logger.log(`📄 NOTIFY: Document expired ${doc.id || doc.DocumentID}`);
    this.send("DOCUMENT_EXPIRED", doc);
  },

  onContractExpired(event) {
    const contract = this._extract(event);
    if (!contract) return;
    Logger.log(`📑 NOTIFY: Contract expired ${contract.id || contract.ContractID}`);
    this.send("CONTRACT_EXPIRED", contract);
  },

  onModuleFailed(event) {
    const moduleData = this._extract(event);
    if (!moduleData) return;
    Logger.log(`🔴 NOTIFY: Module failed ${moduleData.moduleName || 'unknown'}`);
    this.send("MODULE_FAILED", moduleData);
  },

  onFailedEventCreated(event) {
    const failedEvent = this._extract(event);
    if (!failedEvent) return;
    Logger.log(`🔴 NOTIFY: Failed event created ${failedEvent.eventId || 'unknown'}`);
    this.send("FAILED_EVENT_CREATED", failedEvent);
  },

  onClientCreated(event) {
    const client = this._extract(event);
    if (!client) return;
    Logger.log(`👤 NOTIFY: Client created ${client.id || client.ClientID}`);
    this.send("CLIENT_CREATED", client);
  },

  // ---- HEALTH ----
  health() {
    return HealthContract.create(
      "NotificationSubscriptions",
      this.initialized ? "OK" : "WARNING",
      {
        version: this.version,
        initialized: this.initialized,
        subscriptions: Object.keys(this._handlers)
      }
    );
  }
};

// ---- РЕГИСТРАЦИЯ В ModuleRegistry ----
if (typeof ModuleRegistry !== "undefined") {
  ModuleRegistry.register("NotificationSubscriptions", {
    version: NotificationSubscriptions.version,
    phase: "DOMAIN",               // оставляем как в исходном варианте
    dependencies: ["EventBus"],
    init: () => NotificationSubscriptions.init(),
    stop: () => NotificationSubscriptions.stop(),
    health: () => NotificationSubscriptions.health()
  });
}

globalThis.NotificationSubscriptions = NotificationSubscriptions;
Logger.log("NotificationSubscriptions LOADED v" + NotificationSubscriptions.version);