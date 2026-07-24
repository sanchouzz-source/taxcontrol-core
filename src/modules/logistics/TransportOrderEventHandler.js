console.log("TransportOrderEventHandler v2.4");

const TransportOrderEventHandler = {
  version: "2.4.0",
  initialized: false,
  ready: false,
  entityName: "TRANSPORT_ORDER",
  entity: null,
  subscriptions: [],

  // Счётчики для health
  processed: 0,
  failed: 0,
  lastEvent: null,

  // ----- ИНИЦИАЛИЗАЦИЯ -----
  init() {
    if (this.initialized) {
      Logger.info("TransportOrderEventHandler ALREADY INITIALIZED");
      return true;
    }

    if (typeof EntityRegistry === "undefined")
      throw new Error("EntityRegistry unavailable");

    this.entity = EntityRegistry.get(this.entityName);
    if (!this.entity)
      throw new Error("ENTITY NOT FOUND " + this.entityName);

    if (typeof EventBus === "undefined")
      throw new Error("EventBus unavailable");

    this.registerEvents();

    this.initialized = true;
    this.ready = true;

    Logger.info("TransportOrderEventHandler READY v" + this.version);
    return true;
  },

  // ----- ПОДПИСКА ТОЛЬКО НА CRUD СОБЫТИЯ ОТ РЕПОЗИТОРИЯ -----
  registerEvents() {
    this.subscribe(
      EntityEvents.TRANSPORT_ORDER.CREATED,
      this.onCreated
    );
    this.subscribe(
      EntityEvents.TRANSPORT_ORDER.UPDATED,
      this.onUpdated
    );
    this.subscribe(
      EntityEvents.TRANSPORT_ORDER.DELETED,
      this.onDeleted
    );
    this.subscribe(
      EntityEvents.TRANSPORT_ORDER.RESTORED,
      this.onRestored
    );
  },

  subscribe(event, handler) {
    if (!event) return;
    const name = "TransportOrder_" + handler.name;
    const bound = handler.bind(this);
    EventBus.subscribe(event, bound, { name: name });
    this.subscriptions.push({ event: event, handler: name });
  },

  // ----- ОБРАБОТЧИКИ -----
  onCreated(event) {
    this.onEvent(event, "CREATED");
  },
  onUpdated(event) {
    this.onEvent(event, "UPDATED");
  },
  onDeleted(event) {
    this.onEvent(event, "DELETED");
  },
  onRestored(event) {
    this.onEvent(event, "RESTORED");
  },

  // ----- БИЗНЕС-ЛОГИКА (БЕЗ ПУБЛИКАЦИИ НОВЫХ СОБЫТИЙ) -----
  onEvent(event, type) {
    try {
      const entity = event.after || event.data || event;
      if (!entity) {
        throw new Error("TransportOrder entity missing");
      }

      const entityId = entity.TransportOrderID || event.entityId || "";
      if (!entityId) {
        throw new Error("TransportOrder ID missing");
      }

      Logger.info(`TRANSPORT ORDER ${type} ${entityId}`);

      // ---- ЗДЕСЬ МОЖЕТ БЫТЬ БИЗНЕС-ЛОГИКА (расчёты, уведомления и т.п.) ----
      // НО НЕ ПУБЛИКОВАТЬ НОВЫЕ СОБЫТИЯ!
      // BusinessEventProcessor уже опубликует бизнес-событие, если его вызывают.

      this.processed++;
      this.lastEvent = new Date().toISOString();

    } catch (e) {
      this.failed++;
      Logger.error(`TransportOrder BUSINESS ERROR ${type}: ${e.message}`);
    }
  },

  // ----- ОБРАБОТЧИК ОТ BUSINESS EVENT PROCESSOR (если вызывают) -----
  handle(erpEvent) {
    if (!erpEvent) return;
    const type = erpEvent.type || "UNKNOWN";
    this.onEvent(erpEvent, type);
  },

  // ----- HEALTH -----
  health() {
    return HealthContract.create(
      "TransportOrderEventHandler",
      this.ready ? "OK" : "WARNING",
      {
        version: this.version,
        subscriptions: this.subscriptions.length,
        processed: this.processed,
        failed: this.failed,
        lastEvent: this.lastEvent || null,
        uptime: this.ready && this.initialized ? "active" : "inactive"
      }
    );
  }
};

globalThis.TransportOrderEventHandler = TransportOrderEventHandler;
Logger.info("TransportOrderEventHandler READY v2.4.0");