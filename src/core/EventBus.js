console.log("EventBus v2.3");

const EventBus = {
  version: "2.3.0",
  events: {},
  history: [],
  ready: false,
  _processing: new Set(),
  _idCounter: 0,

  init() {
    if (this.ready) {
      Logger.log("EventBus ALREADY READY");
      return;
    }
    this.ready = true;
    Logger.log("EventBus READY v" + this.version);
  },

  // ---- ГЕНЕРАТОРЫ ID ----
  _generateId() {
    this._idCounter++;
    const timestamp = Date.now().toString(36);
    const counter = this._idCounter.toString(36).padStart(6, '0');
    return `EVT${timestamp}${counter}`;
  },

  _generateCorrelationId() {
    const now = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 8);
    return `COR${now}${rand}`;
  },

  /*
  ====================================
  SUBSCRIBE
  ====================================
  */
  subscribe(eventName, handler, options = {}) {
    if (!eventName) {
      throw new Error("EventBus event required");
    }
    if (typeof handler !== "function") {
      throw new Error("EventBus handler must function");
    }
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    const handlerName = options.name || handler.name || "anonymous";

    const exists = this.events[eventName].some(
      item => item.name === handlerName || item.handler === handler
    );

    if (exists) {
      Logger.debug("SKIP DUPLICATE SUBSCRIPTION " + eventName + " " + handlerName);
      return { event: eventName, duplicate: true };
    }

    this.events[eventName].push({
      handler,
      name: handlerName,
      createdAt: new Date().toISOString()
    });

    Logger.debug("SUBSCRIBED " + eventName + " " + handlerName);
    return { event: eventName, handler, name: handlerName };
  },

  on(eventName, handler, options = {}) {
    return this.subscribe(eventName, handler, options);
  },

  /*
  ====================================
  UNSUBSCRIBE
  ====================================
  */
  off(eventName, handler) {
    if (!this.events[eventName]) return;
    this.events[eventName] = this.events[eventName].filter(
      item => item.handler !== handler
    );
  },

  /*
  ====================================
  PUBLISH (улучшенная защита от циклов, корреляция, расширенный метаданные)
  ====================================
  */
  publish(eventName, payload = {}, options = {}) {
    if (!eventName) {
      throw new Error("Event name required");
    }

    const source = options.source || payload.metadata?.source || "ERP";
    const userId = options.userId || payload.metadata?.userId || null;
    const tenantId = options.tenantId || payload.metadata?.tenantId || null;

    // ---- Защита от циклов (учитываем entityId) ----
    const entityId = payload.entityId || payload.id || '';
    const key = `${eventName}:${source}:${entityId}`;

    if (this._processing.has(key)) {
      Logger.warn(`CYCLE DETECTED: ${eventName} from ${source} for ${entityId} – skipping`);
      return {
        event: eventName,
        cyclical: true,
        source,
        entityId
      };
    }
    this._processing.add(key);

    // ---- Генерация ID и корреляции ----
    const eventId = payload.id || this._generateId();
    const correlationId = payload.correlationId || this._generateCorrelationId();
    const retryCount = (payload.metadata?.retryCount || 0);

    // ---- Формирование нового Event Envelope ----
    const envelope = {
      id: eventId,
      correlationId: correlationId,
      name: eventName,
      entity: payload.entity || null,
      entityId: payload.entityId || null,
      payload: payload.data || payload,
      before: payload.before || null,
      after: payload.after || null,
      metadata: {
        source: source,
        userId: userId,
        tenantId: tenantId,
        timestamp: new Date().toISOString(),
        version: payload.version || "1.0",
        retryCount: retryCount
      }
    };

    // Дополнительные метаданные
    if (payload.metadata) {
      Object.assign(envelope.metadata, payload.metadata);
    }

    // ---- Сохранение в историю ----
    this.history.push({
      id: eventId,
      correlationId: correlationId,
      event: eventName,
      entity: envelope.entity,
      entityId: envelope.entityId,
      source: source,
      status: "PUBLISHED",
      timestamp: envelope.metadata.timestamp
    });

    const listeners = [...(this.events[eventName] || [])];
    Logger.log("EVENT " + eventName + " HANDLERS " + listeners.length);

    let executed = 0;

    // ---- Безопасная рассылка с очисткой _processing в finally ----
    try {
      for (const item of listeners) {
        try {
          item.handler(envelope);
          executed++;
        } catch (handlerError) {
          Logger.error(`EVENT HANDLER ERROR (${item.name}): ${handlerError.message}`);
        }
      }
    } finally {
      // Гарантированно удаляем ключ из стека обработки
      this._processing.delete(key);
    }

    return {
      event: eventName,
      handlers: listeners.length,
      executed,
      eventId,
      correlationId
    };
  },

  emit(eventName, payload = {}, options = {}) {
    return this.publish(eventName, payload, options);
  },

  dispatch(eventName, payload = {}, options = {}) {
    return this.publish(eventName, payload, options);
  },

  // ---- ПРОСМОТР ЦЕПОЧКИ СОБЫТИЙ ----
  trace(correlationId) {
    const events = this.history.filter(e => e.correlationId === correlationId);
    if (events.length === 0) {
      Logger.debug(`No events found for correlationId: ${correlationId}`);
    }
    return events;
  },

  // ---- СПИСОК ВСЕХ КОРРЕЛЯЦИЙ (для диагностики) ----
  correlations() {
    const result = {};
    this.history.forEach(e => {
      if (e.correlationId) {
        if (!result[e.correlationId]) {
          result[e.correlationId] = [];
        }
        result[e.correlationId].push({
          event: e.event,
          entityId: e.entityId,
          timestamp: e.timestamp
        });
      }
    });
    return result;
  },

  // ---- СТАНДАРТНЫЕ МЕТОДЫ ----
  list() {
    return Object.keys(this.events);
  },

  listeners(eventName) {
    return (this.events[eventName] || []).length;
  },

  clear() {
    this.events = {};
    this._processing.clear();
    Logger.debug("EVENT BUS CLEARED");
  },

  debug() {
    Logger.log(JSON.stringify(this.events, null, 2));
  },

  health() {
    return HealthContract.create(
      "EventBus",
      this.ready ? "OK" : "WARNING",
      {
        version: this.version,
        events: this.list(),
        handlers: Object.values(this.events).reduce(
          (total, list) => total + list.length,
          0
        ),
        history: this.history.length
      }
    );
  }
};

globalThis.EventBus = EventBus;
Logger.log("EventBus READY v2.3.0");