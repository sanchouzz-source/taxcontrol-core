console.log("BusinessEventProcessor v1.6");

const BusinessEventProcessor = {
  version: "1.6.0",

  ready: false,
  processed: 0,
  failed: 0,
  duplicates: 0,
  auditFailed: 0,
  lastProcessed: null,
  startTime: null,
  eventCounter: 0,
  CLEANUP_INTERVAL: 100,
  CACHE_TTL_SECONDS: 86400, // 24 часа
  MAX_MEMORY_CACHE: 5000,   // максимальный размер памяти fallback

  // Кеш обработчиков (ускоряет dispatch)
  handlerCache: {},
  // Явно зарегистрированные обработчики (приоритет)
  HANDLERS: {},
  // Fallback кеш (память) с ограничением
  _memoryCache: {},
  _memoryCacheKeys: [], // для FIFO

  // ----- ИНИЦИАЛИЗАЦИЯ -----
  init() {
    if (this.ready) return;
    this.startTime = Date.now();
    this.ready = true;
    this.cleanupProcessedEvents();
    Logger.info("BusinessEventProcessor READY v" + this.version);
  },

  // ----- РЕГИСТРАЦИЯ ОБРАБОТЧИКА (опционально) -----
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
      // 1. Валидация
      if (!event) throw new Error("EMPTY ERP EVENT");
      if (!event.entity) throw new Error("EVENT ENTITY REQUIRED");
      if (!event.id) Logger.warn("EVENT WITHOUT ID, deduplication disabled");

      Logger.info(`BUSINESS EVENT ${event.entity} ${event.type} (${event.id || 'no-id'})`);

      // 2. Проверка дубликата (CacheService + таблица)
      if (this.isProcessed(event.id)) {
        Logger.warn(`DUPLICATE EVENT ${event.id}`);
        duplicate = true;
        this.duplicates++;
        return;
      }

      // 3. Диспетчеризация
      this.dispatch(event);

      // 4. Отметка об успешной обработке (ДО аудита)
      this.markProcessed(event);
      success = true;
      this.processed++;
      this.lastProcessed = new Date().toISOString();

      // 5. Аудит (не должен валить бизнес)
      this.processAudit(event);

    } catch (e) {
      success = false;
      error = e;
      this.failed++;
      Logger.error(`BUSINESS PROCESS ERROR ${e.message}`);
      this.failedEvent(event, e);
    } finally {
      // 6. Техническое логирование (всегда)
      const duration = Date.now() - started;
      this.logExecution(event, success, error, duplicate, duration);
      // 7. Периодическая очистка кэша
      this.eventCounter++;
      if (this.eventCounter % this.CLEANUP_INTERVAL === 0) {
        this.cleanupProcessedEvents();
      }
    }
  },

  // ----- ПРОВЕРКА ДУБЛЯ (CacheService + таблица) -----
  isProcessed(id) {
    if (!id) return false;
    // Сначала CacheService
    try {
      const cache = CacheService.getScriptCache();
      if (cache.get(id)) return true;
    } catch (e) {
      // игнорируем
    }

    // Проверка в таблице EventExecutionLog
    try {
      const logger = globalThis.EventExecutionLog;
      if (logger && typeof logger.exists === "function") {
        if (logger.exists(id)) return true;
      }
    } catch (e) {
      // игнорируем
    }

    // Fallback память
    if (this._memoryCache[id]) {
      const age = Date.now() - this._memoryCache[id];
      if (age < this.CACHE_TTL_SECONDS * 1000) {
        return true;
      } else {
        delete this._memoryCache[id];
        const idx = this._memoryCacheKeys.indexOf(id);
        if (idx > -1) this._memoryCacheKeys.splice(idx, 1);
      }
    }
    return false;
  },

  markProcessed(event) {
    if (!event.id) return;
    // Запись в CacheService
    try {
      const cache = CacheService.getScriptCache();
      cache.put(event.id, "1", this.CACHE_TTL_SECONDS);
    } catch (e) {
      // если CacheService недоступен, пишем в память
      this._addToMemoryCache(event.id);
    }
    // Также запись в таблицу (для надежности) – делаем асинхронно
    try {
      const logger = globalThis.EventExecutionLog;
      if (logger && typeof logger.markProcessed === "function") {
        logger.markProcessed(event.id);
      }
    } catch (e) {
      // игнорируем
    }
  },

  // ----- ПАМЯТЬ CACHE С ОГРАНИЧЕНИЕМ -----
  _addToMemoryCache(id) {
    if (this._memoryCacheKeys.length >= this.MAX_MEMORY_CACHE) {
      const oldest = this._memoryCacheKeys.shift();
      delete this._memoryCache[oldest];
    }
    this._memoryCache[id] = Date.now();
    this._memoryCacheKeys.push(id);
  },

  // ----- ОЧИСТКА КЭША (только память) -----
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
    // Если кеш всё ещё переполнен, удаляем самые старые
    while (this._memoryCacheKeys.length > this.MAX_MEMORY_CACHE) {
      const oldest = this._memoryCacheKeys.shift();
      delete this._memoryCache[oldest];
    }
  },

  // ----- ДИСПЕТЧЕР (с кешированием обработчиков) -----
  dispatch(event) {
    const entity = event.entity;

    // 1. Явно зарегистрированный
    let handler = this.HANDLERS[entity];
    if (handler) {
      this._invokeHandler(handler, event);
      return;
    }

    // 2. Кеш поиска
    if (this.handlerCache[entity]) {
      this._invokeHandler(this.handlerCache[entity], event);
      return;
    }

    // 3. Поиск по имени
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
      handler.handle(event);
    } else if (typeof handler.process === "function") {
      handler.process(event);
    } else if (typeof handler.onEvent === "function") {
      handler.onEvent(event);
    } else {
      Logger.warn(`Handler ${handler.constructor?.name || 'unknown'} has no process method`);
    }
  },

  // ----- АУДИТ (безопасный) -----
  processAudit(event) {
    try {
      const audit = globalThis.AuditEventHandler;
      if (audit && typeof audit.onEvent === "function") {
        audit.onEvent(event);
      }
    } catch (e) {
      this.auditFailed++;
      Logger.error(`AUDIT ERROR ${e.message}`);
      // Записываем в лог, что аудит упал
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
      } catch (logError) {
        // игнорируем
      }
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

  // ----- ТЕХНИЧЕСКОЕ ЛОГИРОВАНИЕ (единый метод) -----
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
Logger.info("BusinessEventProcessor LOADED v1.6.0");