// ============================================================
// BusinessEventProcessor v2.0.0
// Canonical Business Event Processor
//
// Package E contract:
// - accepts only the ERPEventContract v2 shape internally
// - never republishes an already published event
// - never republishes repository CRUD lifecycle events
// - audit delivery belongs to the event/audit subscriber layer
// - lifecycle and handlers are synchronous for Google Apps Script
// ============================================================

console.log("BusinessEventProcessor v2.0.0");

const BusinessEventProcessor = {
  version: "2.0.0",

  ready: false,
  processed: 0,
  failed: 0,
  duplicates: 0,
  publishSuppressed: 0,
  lastProcessed: null,
  startTime: null,
  eventCounter: 0,

  CLEANUP_INTERVAL: 100,
  CACHE_TTL_SECONDS: 86400,
  MAX_MEMORY_CACHE: 5000,

  HANDLERS: {},
  handlerCache: {},
  _memoryCache: {},
  _memoryCacheKeys: [],

  init() {
    if (this.ready) {
      return true;
    }

    if (
      typeof ERPEventContract === "undefined" ||
      typeof ERPEventContract.create !== "function"
    ) {
      throw new Error(
        "BusinessEventProcessor requires ERPEventContract"
      );
    }

    if (
      typeof EventBus === "undefined" ||
      typeof EventBus.emit !== "function"
    ) {
      throw new Error(
        "BusinessEventProcessor requires EventBus"
      );
    }

    this.startTime = Date.now();
    this.ready = true;
    this.cleanupProcessedEvents();
    this._log(
      "log",
      "BusinessEventProcessor READY v" +
      this.version
    );
    return true;
  },

  reset() {
    this.ready = false;
    this.processed = 0;
    this.failed = 0;
    this.duplicates = 0;
    this.publishSuppressed = 0;
    this.lastProcessed = null;
    this.startTime = null;
    this.eventCounter = 0;
    this.HANDLERS = {};
    this.handlerCache = {};
    this._memoryCache = {};
    this._memoryCacheKeys = [];
    return true;
  },

  _log(level, message) {
    const logger = globalThis.Logger;

    if (
      logger &&
      typeof logger[level] === "function"
    ) {
      logger[level](message);
      return;
    }

    const target =
      typeof console[level] === "function"
        ? console[level]
        : console.log;

    target.call(console, message);
  },

  _assertSync(result, label) {
    if (
      result &&
      typeof result.then === "function"
    ) {
      throw new Error(
        label +
        " must be synchronous in Google Apps Script"
      );
    }

    return result;
  },

  registerHandler(entity, handler) {
    const name =
      ERPEventContract.normalizeName(entity);

    if (!name || !handler) {
      throw new Error(
        "Business handler requires entity and handler"
      );
    }

    this.HANDLERS[name] = handler;
    delete this.handlerCache[name];
    return true;
  },

  unregisterHandler(entity) {
    const name =
      ERPEventContract.normalizeName(entity);

    delete this.HANDLERS[name];
    delete this.handlerCache[name];
    return true;
  },

  normalize(event) {
    if (
      ERPEventContract.isCanonical(event)
    ) {
      return event;
    }

    return ERPEventContract.create(event);
  },

  process(event, options = {}) {
    if (!this.ready) {
      this.init();
    }

    const started = Date.now();
    let envelope = null;
    let success = false;
    let duplicate = false;
    let error = null;
    let publishResult = null;

    try {
      envelope = this.normalize(event);

      if (this.isProcessed(envelope.id)) {
        duplicate = true;
        this.duplicates++;

        return {
          status: "DUPLICATE",
          event: envelope,
          published: false,
        };
      }

      this.dispatch(envelope);
      this.markProcessed(envelope);

      success = true;
      this.processed++;
      this.lastProcessed =
        new Date().toISOString();

      publishResult =
        this.publishBusinessEvent(
          envelope,
          options
        );

      return {
        status: "SUCCESS",
        event: envelope,
        published:
          publishResult.published === true,
        publishResult,
      };
    } catch (caught) {
      error = caught;
      this.failed++;
      this.failedEvent(
        envelope || event,
        caught
      );

      this._log(
        "error",
        "BUSINESS PROCESS ERROR " +
        caught.message
      );

      return {
        status: "FAILED",
        event: envelope || event || null,
        published: false,
        error: caught.message,
      };
    } finally {
      this.logExecution(
        envelope || event,
        success,
        error,
        duplicate,
        Date.now() - started
      );

      this.eventCounter++;

      if (
        this.eventCounter %
          this.CLEANUP_INTERVAL ===
        0
      ) {
        this.cleanupProcessedEvents();
      }
    }
  },

  publishBusinessEvent(event, options = {}) {
    const result = {
      published: false,
      suppressed: false,
      handlers: 0,
      reason: null,
      error: null,
    };

    try {
      const envelope = this.normalize(event);

      if (
        envelope.metadata?.publishedBy ===
        "EventBus"
      ) {
        this.publishSuppressed++;
        result.suppressed = true;
        result.reason = "ALREADY_PUBLISHED";
        return result;
      }

      if (
        typeof EventBus.isLifecycleEvent ===
          "function" &&
        EventBus.isLifecycleEvent(envelope.name)
      ) {
        this.publishSuppressed++;
        result.suppressed = true;
        result.reason =
          "CRUD_OWNED_BY_BASE_REPOSITORY";
        return result;
      }

      if (options.publish === false) {
        this.publishSuppressed++;
        result.suppressed = true;
        result.reason = "PUBLISH_DISABLED";
        return result;
      }

      const emitted = EventBus.emit(
        envelope.name,
        envelope,
        {
          source:
            envelope.source ||
            "BusinessEventProcessor",
          metadata: {
            processedBy:
              "BusinessEventProcessor",
          },
        }
      );

      this._assertSync(
        emitted,
        "EventBus.emit"
      );

      result.handlers =
        emitted.handlers || 0;
      result.published =
        emitted.suppressed !== true;
      result.suppressed =
        emitted.suppressed === true;
      result.reason =
        emitted.reason || null;
      return result;
    } catch (caught) {
      result.error = caught.message;
      this.recordPublishFailure(event, caught);
      return result;
    }
  },

  recordPublishFailure(event, error) {
    try {
      if (
        typeof FailedEventRepository !==
          "undefined" &&
        typeof FailedEventRepository.create ===
          "function"
      ) {
        FailedEventRepository.create({
          eventId: event?.id || "unknown",
          entity:
            event?.entity || "UNKNOWN",
          type: event?.type || "UNKNOWN",
          payload: JSON.stringify(event || {}),
          error: error.message,
          status: "PENDING",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (ignored) {
      // Reliability logging must not fail the caller.
    }

    this.failedEvent(event, error);
  },

  dispatch(event) {
    const entity =
      ERPEventContract.normalizeName(
        event.entity
      );
    let handler = this.HANDLERS[entity];

    if (!handler && this.handlerCache[entity]) {
      handler = this.handlerCache[entity];
    }

    if (!handler && entity) {
      const handlerName =
        this.getHandlerName(entity);

      handler = globalThis[handlerName] || null;

      if (handler) {
        this.handlerCache[entity] = handler;
      }
    }

    if (!handler) {
      return false;
    }

    return this._invokeHandler(
      handler,
      event
    );
  },

  getHandlerName(entity) {
    return String(entity || "")
      .split("_")
      .filter(Boolean)
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1).toLowerCase()
      )
      .join("") + "EventHandler";
  },

  _invokeHandler(handler, event) {
    let result;

    if (
      typeof handler === "function"
    ) {
      result = handler(event);
    } else if (
      typeof handler.handle === "function"
    ) {
      result = handler.handle(event);
    } else if (
      typeof handler.onEvent === "function"
    ) {
      result = handler.onEvent(event);
    } else if (
      typeof handler.process === "function"
    ) {
      result =
        handler.process.length >= 2
          ? handler.process(
              event.type,
              event
            )
          : handler.process(event);
    } else {
      throw new Error(
        "Business handler has no callable method"
      );
    }

    return this._assertSync(
      result,
      "Business event handler"
    );
  },

  isProcessed(id) {
    if (!id) {
      return false;
    }

    try {
      if (
        typeof CacheService !== "undefined"
      ) {
        const cache =
          CacheService.getScriptCache();

        if (cache.get(id)) {
          return true;
        }
      }
    } catch (ignored) {
      // Memory fallback is checked below.
    }

    try {
      const executionLog =
        globalThis.EventExecutionLog;

      if (
        executionLog &&
        typeof executionLog.exists ===
          "function" &&
        executionLog.exists(id)
      ) {
        return true;
      }
    } catch (ignored) {
      // Memory fallback is checked below.
    }

    const storedAt = this._memoryCache[id];

    if (!storedAt) {
      return false;
    }

    if (
      Date.now() - storedAt <
      this.CACHE_TTL_SECONDS * 1000
    ) {
      return true;
    }

    delete this._memoryCache[id];
    this._memoryCacheKeys =
      this._memoryCacheKeys.filter(
        (key) => key !== id
      );
    return false;
  },

  markProcessed(event) {
    if (!event || !event.id) {
      return false;
    }

    let cached = false;

    try {
      if (
        typeof CacheService !== "undefined"
      ) {
        CacheService.getScriptCache().put(
          event.id,
          "1",
          this.CACHE_TTL_SECONDS
        );
        cached = true;
      }
    } catch (ignored) {
      cached = false;
    }

    if (!cached) {
      this._addToMemoryCache(event.id);
    }

    try {
      const executionLog =
        globalThis.EventExecutionLog;

      if (
        executionLog &&
        typeof executionLog.markProcessed ===
          "function"
      ) {
        executionLog.markProcessed(event.id);
      }
    } catch (ignored) {
      // Event processing has already succeeded.
    }

    return true;
  },

  _addToMemoryCache(id) {
    if (this._memoryCache[id]) {
      this._memoryCache[id] = Date.now();
      return;
    }

    while (
      this._memoryCacheKeys.length >=
      this.MAX_MEMORY_CACHE
    ) {
      const oldest =
        this._memoryCacheKeys.shift();
      delete this._memoryCache[oldest];
    }

    this._memoryCache[id] = Date.now();
    this._memoryCacheKeys.push(id);
  },

  cleanupProcessedEvents() {
    const cutoff =
      Date.now() -
      this.CACHE_TTL_SECONDS * 1000;

    this._memoryCacheKeys =
      this._memoryCacheKeys.filter((id) => {
        if (this._memoryCache[id] < cutoff) {
          delete this._memoryCache[id];
          return false;
        }

        return true;
      });

    return true;
  },

  failedEvent(event, error) {
    try {
      if (
        typeof EventRetryQueue !==
          "undefined" &&
        typeof EventRetryQueue.enqueue ===
          "function"
      ) {
        EventRetryQueue.enqueue(event, error);
      }
    } catch (ignored) {
      // Retry infrastructure is optional here.
    }
  },

  logExecution(
    event,
    success,
    error,
    duplicate,
    duration
  ) {
    try {
      if (!event) {
        return false;
      }

      const data = {
        eventId: event.id || null,
        entity:
          event.entity || "UNKNOWN",
        eventType:
          event.type || "UNKNOWN",
        status:
          duplicate
            ? "DUPLICATE"
            : success
              ? "SUCCESS"
              : "FAILED",
        processor:
          "BusinessEventProcessor",
        error:
          error ? error.message : null,
        executionTime: duration,
        timestamp: new Date().toISOString(),
      };
      const executionLog =
        globalThis.EventExecutionLog;

      if (
        executionLog &&
        typeof executionLog.log === "function"
      ) {
        executionLog.log(data);
      }

      return true;
    } catch (ignored) {
      return false;
    }
  },

  health() {
    const details = {
      version: this.version,
      ready: this.ready,
      processed: this.processed,
      failed: this.failed,
      duplicates: this.duplicates,
      publishSuppressed:
        this.publishSuppressed,
      handlers:
        Object.keys(this.HANDLERS).length,
      cacheEntries:
        this._memoryCacheKeys.length,
      lastProcessed: this.lastProcessed,
    };

    if (
      typeof HealthContract !== "undefined" &&
      typeof HealthContract.create === "function"
    ) {
      return HealthContract.create(
        "BusinessEventProcessor",
        this.ready ? "OK" : "WARNING",
        details
      );
    }

    return {
      module: "BusinessEventProcessor",
      status:
        this.ready ? "OK" : "WARNING",
      ...details,
    };
  },
};

globalThis.BusinessEventProcessor =
  BusinessEventProcessor;
