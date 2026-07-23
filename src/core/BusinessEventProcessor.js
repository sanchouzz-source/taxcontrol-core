console.log("BusinessEventProcessor v1.8");

const BusinessEventProcessor = {
  version: "1.8.0",

  ready: false,
  processed: 0,
  failed: 0,
  duplicates: 0,
  auditFailed: 0,
  lastProcessed: null,
  startTime: null,
  eventCounter: 0,
  CLEANUP_INTERVAL: 100,
  CACHE_TTL_SECONDS: 86400,
  MAX_MEMORY_CACHE: 5000,

  handlerCache: {},
  HANDLERS: {},
  _memoryCache: {},
  _memoryCacheKeys: [],

  // ----- ИНИЦИАЛИЗАЦИЯ -----
  init() {
    if (this.ready) return;
    this.startTime = Date.now();
    this.ready = true;
    this.cleanupProcessedEvents();
    Logger.info("BusinessEventProcessor READY v" + this.version);
  },

  // ----- РЕГИСТРАЦИЯ ОБРАБОТЧИКА -----
  registerHandler(entity, handler) {
    if (!entity || !handler) return;
    this.HANDLERS[entity] = handler;
    Logger.debug(`Handler registered: ${entity}`);
  },

  // ----- ОСНОВНОЙ МЕТОД ОБРАБОТКИ -----
  process(event) {
    if (!this.ready) this.init();

    let success = false;
    let duplicate = false;
    let error = null;
    const started = Date.now();

    try {
      if (!event) throw new Error("EMPTY ERP EVENT");
      if (!event.entity) throw new Error("EVENT ENTITY REQUIRED");
      if (!event.id) Logger.warn("EVENT WITHOUT ID, deduplication disabled");

      Logger.info(`BUSINESS EVENT ${event.entity} ${event.type} (${event.id || 'no-id'})`);

      // Проверка дубликата
      if (this.isProcessed(event.id)) {
        Logger.warn(`DUPLICATE EVENT ${event.id}`);
        duplicate = true;
        this.duplicates++;
        return;
      }

      // 1. Бизнес-обработка
      this.dispatch(event);

      // 2. Отметка об успешной обработке (сохраняем состояние)
      this.markProcessed(event);
      success = true;
      this.processed++;
      this.lastProcessed = new Date().toISOString();

      // 3. Публикация бизнес-события (может упасть, но бизнес уже выполнен)
      const publishResult = this.publishBusinessEvent(event);
      if (!publishResult.published) {
        // Если публикация не удалась, записываем в failed и retry (уже сделано внутри publishBusinessEvent)
        // Но не меняем success, т.к. бизнес-процесс выполнен
      }

      // 4. Аудит (не должен валить бизнес)
      this.processAudit(event);

    } catch (e) {
      success = false;
      error = e;
      this.failed++;
      Logger.error(`BUSINESS PROCESS ERROR ${e.message}`);
      this.failedEvent(event, e);
    } finally {
      const duration = Date.now() - started;
      this.logExecution(event, success, error, duplicate, duration);
      this.eventCounter++;
      if (this.eventCounter % this.CLEANUP_INTERVAL === 0) {
        this.cleanupProcessedEvents();
      }
    }
  },

  // ----- ПУБЛИКАЦИЯ БИЗНЕС-СОБЫТИЯ В EVENTBUS (с валидацией и retry) -----
  publishBusinessEvent(event) {
    const result = {
      published: false,
      handlers: 0,
      error: null
    };

    try {
      if (!event || !event.entity || !event.type) {
        throw new Error("Cannot publish business event: missing entity or type");
      }

      const eventName = `${event.entity}_${event.type}`;

      // ---- Валидация схемы (если есть ERPEventSchemaRegistry) ----
      if (typeof ERPEventSchemaRegistry !== "undefined" && ERPEventSchemaRegistry.validate) {
        const validation = ERPEventSchemaRegistry.validate(eventName, event);
        if (!validation.valid) {
          throw new Error(`Schema validation failed: ${validation.error}`);
        }
      }

      // ---- Обогащение события (correlationId, causationId, version) ----
      const enrichedEvent = {
        ...event,
        version: event.version || "1.0",
        correlationId: event.correlationId || event.id || null,
        causationId: event.causationId || null,
        timestamp: event.timestamp || new Date().toISOString()
      };

      Logger.debug(`Publishing business event: ${eventName}`);

      // ---- Отправка в EventBus ----
      if (typeof EventBus !== "undefined" && EventBus.emit) {
        const emitResult = EventBus.emit(eventName, enrichedEvent, { source: "BusinessEventProcessor" });
        result.handlers = emitResult?.handlers || 0;
        result.published = true;
        Logger.debug(`Business event ${eventName} published, handlers: ${result.handlers}`);
      } else {
        throw new Error("EventBus not available");
      }

    } catch (e) {
      result.error = e.message;
      Logger.error(`Failed to publish business event: ${e.message}`);

      // ---- Обработка ошибки: запись в FailedEvent и RetryQueue ----
      try {
        const failedEventData = {
          eventId: event?.id || "unknown",
          entity: event?.entity || "UNKNOWN",
          type: event?.type || "UNKNOWN",
          payload: JSON.stringify(event || {}),
          error: e.message,
          status: "PENDING",
          timestamp: new Date().toISOString()
        };

        // Запись в FailedEventRepository (если есть)
        if (typeof FailedEventRepository !== "undefined" && FailedEventRepository.create) {
          FailedEventRepository.create(failedEventData);
        }

        // Добавление в очередь ретрая (если есть)
        if (typeof EventRetryQueue !== "undefined" && EventRetryQueue.enqueue) {
          EventRetryQueue.enqueue(event, e);
        }
      } catch (retryError) {
        Logger.error(`Failed to record failed event: ${retryError.message}`);
      }
    }

    return result;
  },

  // ----- ПРОВЕРКА ДУБЛЯ -----
  isProcessed(id) {
    if (!id) return false;
    try {
      const cache = CacheService.getScriptCache();
      if (cache.get(id)) return true;
    } catch (e) { /* игнорируем */ }
    // Проверка в таблице EventExecutionLog
    try {
      const logger = globalThis.EventExecutionLog;
      if (logger && typeof logger.exists === "function") {
        if (logger.exists(id)) return true;
      }
    } catch (e) { /* игнорируем */ }
    // Fallback память
    if (this._memoryCache[id]) {
      const age = Date.now() - this._memoryCache[id];
      if (age < this.CACHE_TTL_SECONDS * 1000) return true;
      else {
        delete this._memoryCache[id];
        const idx = this._memoryCacheKeys.indexOf(id);
        if (idx > -1) this._memoryCacheKeys.splice(idx, 1);
      }
    }
    return false;
  },

  markProcessed(event) {
    if (!event.id) return;
    try {
      const cache = CacheService.getScriptCache();
      cache.put(event.id, "1", this.CACHE_TTL_SECONDS);
    } catch (e) {
      this._addToMemoryCache(event.id);
    }
    try {
      const logger = globalThis.EventExecutionLog;
      if (logger && typeof logger.markProcessed === "function") {
        logger.markProcessed(event.id);
      }
    } catch (e) { /* игнорируем */ }
  },

  _addToMemoryCache(id) {
    if (this._memoryCacheKeys.length >= this.MAX_MEMORY_CACHE) {
      const oldest = this._memoryCacheKeys.shift();
      delete this._memoryCache[oldest];
    }
    this._memoryCache[id] = Date.now();
    this._memoryCacheKeys.push(id);
  },

  cleanupProcessedEvents() {
    const now = Date.now();
    const ttlMs = this.CACHE_TTL_SECONDS * 1000;
    for (const id in this._memoryCache) {
      if (now - this._memoryCache[id] > ttlMs) {
        delete this._memoryCache[id];
        const idx = this._memoryCacheKeys.indexOf(id);
        if (idx > -1) this._memoryCacheKeys.splice(idx, 1);
      }
    }
    while (this._memoryCacheKeys.length > this.MAX_MEMORY_CACHE) {
      const oldest = this._memoryCacheKeys.shift();
      delete this._memoryCache[oldest];
    }
  },

  // ----- ДИСПЕТЧЕР -----
  dispatch(event) {
    const entity = event.entity;
    let handler = this.HANDLERS[entity];
    if (handler) {
      this._invokeHandler(handler, event);
      return;
    }
    if (this.handlerCache[entity]) {
      this._invokeHandler(this.handlerCache[entity], event);
      return;
    }
    const handlerName = this.getHandlerName(entity);
    Logger.debug(`Dispatcher -> ${handlerName}`);
    handler = globalThis[handlerName];
    if (handler) {
      this.handlerCache[entity] = handler;
      this._invokeHandler(handler, event);
      return;
    }
    Logger.warn(`No handler for entity ${entity}`);
  },

  getHandlerName(entity) {
    return entity
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('') + 'EventHandler';
  },

  _invokeHandler(handler, event) {
    if (typeof handler.handle === "function") {
      return handler.handle(event);
    } else if (typeof handler.process === "function") {
      return handler.process(event);
    } else if (typeof handler.onEvent === "function") {
      return handler.onEvent(event);
    } else {
      Logger.warn(`Handler ${handler.constructor?.name || 'unknown'} has no process method`);
      return null;
    }
  },

  // ----- АУДИТ -----
  processAudit(event) {
    try {
      const audit = globalThis.AuditEventHandler;
      if (audit && typeof audit.onEvent === "function") {
        audit.onEvent(event);
      }
    } catch (e) {
      this.auditFailed++;
      Logger.error(`AUDIT ERROR ${e.message}`);
      try {
        const logger = globalThis.EventExecutionLog;
        if (logger && typeof logger.log === "function") {
          logger.log({
            eventId: event.id || null,
            entity: event.entity || "UNKNOWN",
            eventType: event.type || "UNKNOWN",
            status: "AUDIT_FAILED",
            processor: "BusinessEventProcessor",
            error: e.message,
            timestamp: new Date().toISOString()
          });
        }
      } catch (logError) { /* игнорируем */ }
    }
  },

  // ----- ОБРАБОТКА ОШИБОК (ретрай) -----
  failedEvent(event, error) {
    if (!event) return;
    const retry = globalThis.EventRetryQueue;
    if (retry && typeof retry.enqueue === "function") {
      retry.enqueue(event, error);
    }
  },

  // ----- ТЕХНИЧЕСКОЕ ЛОГИРОВАНИЕ -----
  logExecution(event, success, error, duplicate, duration) {
    try {
      if (!event) return;
      const logData = {
        eventId: event.id || null,
        entity: event.entity || "UNKNOWN",
        eventType: event.type || "UNKNOWN",
        status: duplicate ? "DUPLICATE" : (success ? "SUCCESS" : "FAILED"),
        processor: "BusinessEventProcessor",
        error: error ? error.message : null,
        executionTime: duration,
        timestamp: new Date().toISOString()
      };
      const logger = globalThis.EventExecutionLog;
      if (logger && typeof logger.log === "function") {
        logger.log(logData);
      } else {
        Logger.debug(`EXECUTION LOG: ${JSON.stringify(logData)}`);
      }
    } catch (e) {
      Logger.error(`LOG ERROR ${e.message}`);
    }
  },

  // ----- HEALTH -----
  health() {
    const total = this.processed + this.failed + this.duplicates;
    const rate = this.processed === 0 ? 0 : (this.duplicates / this.processed * 100);
    return HealthContract.create(
      "BusinessEventProcessor",
      this.ready ? "OK" : "WARNING",
      {
        version: this.version,
        processed: this.processed,
        failed: this.failed,
        duplicates: this.duplicates,
        auditFailed: this.auditFailed,
        duplicateRate: rate.toFixed(2) + "%",
        eventsPerMinute: this.startTime
          ? ((this.processed + this.failed + this.duplicates) / ((Date.now() - this.startTime) / 60000)).toFixed(2)
          : 0,
        cacheMode: "CacheService + Table + Memory(FIFO)",
        cacheTTL: this.CACHE_TTL_SECONDS + "s",
        cleanupInterval: this.CLEANUP_INTERVAL,
        uptime: this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) + "s" : "0s",
        lastProcessed: this.lastProcessed || null
      }
    );
  }
};

globalThis.BusinessEventProcessor = BusinessEventProcessor;
Logger.info("BusinessEventProcessor LOADED v1.8.0");