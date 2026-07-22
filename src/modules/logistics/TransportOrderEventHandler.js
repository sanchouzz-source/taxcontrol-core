console.log("TransportOrderEventHandler v2.2");

const TransportOrderEventHandler = {
  version: "2.2.0",
  initialized: false,
  ready: false,
  entityName: "TRANSPORT_ORDER",
  entity: null,
  subscriptions: [],

  // Счётчики для health
  processed: 0,
  failed: 0,
  lastEvent: null,

  // Защита от циклов (глубина вложенности)
  MAX_DEPTH: 3,

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

  // ----- ПОДПИСКА НА СОБЫТИЯ -----
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

  // ----- ОБРАБОТЧИКИ СОБЫТИЙ ОТ EVENTBUS -----
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

  // ----- ЕДИНЫЙ МЕТОД БИЗНЕС-ЛОГИКИ -----
  onEvent(event, type) {
    try {
      // Извлекаем сущность
      let entity = event.after || event.data || event;
      if (!entity) {
        throw new Error("TransportOrder entity missing");
      }

      const entityId = entity.TransportOrderID || event.entityId || "";
      if (!entityId) {
        throw new Error("TransportOrder ID missing");
      }

      Logger.info(`TRANSPORT ORDER ${type} ${entityId}`);

      // Проверка глубины вложенности (защита от циклов)
      const depth = event._depth || 0;
      if (depth >= this.MAX_DEPTH) {
        Logger.warn(`Max depth reached for ${entityId}, skipping further publication`);
        return;
      }

      // Создаём доменное событие через контракт (если доступен)
      let domainEvent;
      if (typeof DomainEventContract !== "undefined" && DomainEventContract.create) {
        domainEvent = DomainEventContract.create({
          entity: this.entityName,
          entityId: entityId,
          type: type,
          payload: entity,
          source: "TransportOrderEventHandler",
          timestamp: new Date().toISOString(),
          _depth: depth + 1
        });
      } else {
        // fallback – ручное создание с проверкой
        domainEvent = {
          entity: this.entityName,
          entityId: entityId,
          type: type,
          payload: entity,
          source: "TransportOrderEventHandler",
          timestamp: new Date().toISOString(),
          _depth: depth + 1,
          _version: "1.0"
        };
      }

      // Публикуем событие в EventBus (без суффикса _BUSINESS)
      const eventName = `TRANSPORT_ORDER_${type}`;
      this._emitEvent(eventName, domainEvent);

      // Обновляем счётчики
      this.processed++;
      this.lastEvent = new Date().toISOString();

    } catch (e) {
      this.failed++;
      Logger.error(`TransportOrder BUSINESS ERROR ${type}: ${e.message}`);
    }
  },

  // ----- БЕЗОПАСНАЯ ПУБЛИКАЦИЯ СОБЫТИЯ -----
  _emitEvent(eventName, payload) {
    // Проверяем наличие EventBus
    if (typeof EventBus === "undefined") {
      Logger.warn("EventBus not available, cannot emit " + eventName);
      return;
    }

    // Определяем, какой метод использовать
    if (typeof EventBus.emit === "function") {
      EventBus.emit(eventName, payload, { source: "TransportOrderEventHandler" });
    } else if (typeof EventBus.publish === "function") {
      EventBus.publish(eventName, payload, { source: "TransportOrderEventHandler" });
    } else if (typeof EventBus.dispatch === "function") {
      EventBus.dispatch(eventName, payload, { source: "TransportOrderEventHandler" });
    } else {
      Logger.error("EventBus has no emit/publish/dispatch method");
    }
  },

  // ----- ОБРАБОТЧИК ОТ BUSINESS EVENT PROCESSOR (если вызывают) -----
  handle(erpEvent) {
    if (!erpEvent) return;
    const type = erpEvent.type || "UNKNOWN";
    // Для совместимости передаём как есть (он уже содержит после/до)
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
Logger.info("TransportOrderEventHandler READY v2.2.0");