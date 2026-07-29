// ============================================================
// EventBus v3.0.0
// Synchronous Canonical ERP Event Bus
//
// Package E contract:
// - every subscriber receives ERPEventContract v2 envelope
// - BaseRepository is the only CRUD lifecycle publisher
// - subscriptions have stable identities and owners
// - reset removes all transient state and subscriptions
// - Promise handlers are rejected in Google Apps Script
// ============================================================

console.log("EventBus v3.0.0");

const EventBus = {
  version: "3.0.0",

  events: {},
  history: [],
  ready: false,

  _processing: new Set(),
  _subscriptionCounter: 0,
  _historyLimit: 1000,

  metrics: {
    published: 0,
    suppressed: 0,
    delivered: 0,
    handlerFailures: 0,
    cycles: 0,
  },

  lifecycleOwner: "BaseRepository",
  lifecyclePattern:
    /_(CREATED|UPDATED|DELETED|RESTORED)$/,

  init() {
    if (this.ready) {
      return true;
    }

    if (
      typeof ERPEventContract === "undefined" ||
      typeof ERPEventContract.create !== "function"
    ) {
      throw new Error(
        "EventBus requires ERPEventContract"
      );
    }

    if (
      typeof ERPEventContract.init === "function"
    ) {
      this._assertSync(
        ERPEventContract.init(),
        "ERPEventContract.init"
      );
    }

    this.ready = true;
    this._log(
      "log",
      "EventBus READY v" + this.version
    );
    return true;
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

  _normalizeName(eventName) {
    if (
      typeof ERPEventContract !== "undefined" &&
      typeof ERPEventContract.normalizeName ===
        "function"
    ) {
      return ERPEventContract.normalizeName(
        eventName
      );
    }

    return String(eventName || "")
      .trim()
      .toUpperCase();
  },

  isLifecycleEvent(eventName) {
    return this.lifecyclePattern.test(
      this._normalizeName(eventName)
    );
  },

  _source(payload, options) {
    const input =
      payload &&
      typeof payload === "object"
        ? payload
        : {};

    return (
      options.source ||
      input.source ||
      input.metadata?.source ||
      "ERP"
    );
  },

  _looksLikeEnvelope(payload) {
    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) {
      return false;
    }

    return [
      "name",
      "event",
      "type",
      "action",
      "entity",
      "entityId",
      "payload",
      "data",
      "before",
      "after",
      "source",
      "metadata",
      "timestamp",
      "correlationId",
    ].some((field) =>
      Object.prototype.hasOwnProperty.call(
        payload,
        field
      )
    );
  },

  _eventParams(eventName, payload, options) {
    const name = this._normalizeName(eventName);
    const source = this._source(
      payload,
      options
    );
    const input =
      payload &&
      typeof payload === "object" &&
      !Array.isArray(payload)
        ? payload
        : { payload };
    const optionMetadata =
      options.metadata || {};

    if (this._looksLikeEnvelope(input)) {
      const hasExplicitPayload = [
        "payload",
        "data",
        "before",
        "after",
      ].some((field) =>
        Object.prototype.hasOwnProperty.call(
          input,
          field
        )
      );

      return {
        ...input,
        ...(
          hasExplicitPayload
            ? {}
            : { payload: input }
        ),
        name,
        source,
        userId:
          options.userId ||
          input.userId ||
          null,
        tenantId:
          options.tenantId ||
          input.tenantId ||
          null,
        metadata: {
          ...(input.metadata || {}),
          ...optionMetadata,
          source,
          publishedBy: "EventBus",
        },
      };
    }

    const type =
      ERPEventContract.typeFromName(name);
    const lifecycle =
      this.isLifecycleEvent(name);

    return {
      name,
      source,
      entity:
        ERPEventContract.entityFromName(name),
      type,
      action:
        ERPEventContract.actionFromType(type),
      payload: input,
      before:
        lifecycle && type === "DELETED"
          ? input
          : null,
      after:
        lifecycle && type !== "DELETED"
          ? input
          : null,
      userId: options.userId || null,
      tenantId: options.tenantId || null,
      metadata: {
        ...optionMetadata,
        source,
        publishedBy: "EventBus",
      },
    };
  },

  _record(entry) {
    this.history.push(entry);

    if (this.history.length > this._historyLimit) {
      this.history.splice(
        0,
        this.history.length - this._historyLimit
      );
    }

    return entry;
  },

  _suppressedResult(
    eventName,
    source,
    reason
  ) {
    this.metrics.suppressed++;

    const timestamp = new Date().toISOString();

    this._record({
      id: null,
      correlationId: null,
      event: eventName,
      entity: null,
      entityId: null,
      source,
      status: "SUPPRESSED",
      reason,
      timestamp,
    });

    this._log(
      "warn",
      "EVENT SUPPRESSED " +
      eventName +
      " source=" +
      source +
      " reason=" +
      reason
    );

    return {
      event: eventName,
      handlers: 0,
      executed: 0,
      failed: 0,
      suppressed: true,
      reason,
      owner: this.lifecycleOwner,
      source,
      envelope: null,
    };
  },

  subscribe(eventName, handler, options = {}) {
    const name = this._normalizeName(eventName);

    if (!name) {
      throw new Error("EventBus event required");
    }

    if (typeof handler !== "function") {
      throw new Error(
        "EventBus handler must be a function"
      );
    }

    if (!this.events[name]) {
      this.events[name] = [];
    }

    const explicitName =
      options.name || null;
    const owner =
      options.owner ||
      options.module ||
      "UNMANAGED";

    const existing = this.events[name].find(
      (item) =>
        item.handler === handler ||
        (
          explicitName &&
          item.name === explicitName &&
          item.owner === owner
        )
    );

    if (existing) {
      this._log(
        "debug",
        "SKIP DUPLICATE SUBSCRIPTION " +
        name +
        " " +
        (explicitName || existing.name)
      );

      return {
        ...existing,
        duplicate: true,
      };
    }

    this._subscriptionCounter++;

    const item = {
      id:
        "SUB" +
        this._subscriptionCounter
          .toString(36)
          .padStart(6, "0"),
      event: name,
      handler,
      name:
        explicitName ||
        handler.name ||
        "anonymous_" +
        this._subscriptionCounter,
      owner,
      createdAt: new Date().toISOString(),
    };

    this.events[name].push(item);

    this._log(
      "debug",
      "SUBSCRIBED " +
      name +
      " " +
      item.name +
      " owner=" +
      owner
    );

    return {
      ...item,
      duplicate: false,
    };
  },

  on(eventName, handler, options = {}) {
    return this.subscribe(
      eventName,
      handler,
      options
    );
  },

  unsubscribe(eventName, target) {
    const name = this._normalizeName(eventName);
    const list = this.events[name] || [];

    if (!list.length) {
      return 0;
    }

    const next = list.filter((item) => {
      if (target === undefined || target === null) {
        return false;
      }

      if (typeof target === "function") {
        return item.handler !== target;
      }

      if (typeof target === "string") {
        return (
          item.id !== target &&
          item.name !== target
        );
      }

      return (
        item !== target &&
        item.id !== target.id &&
        item.handler !== target.handler
      );
    });

    const removed = list.length - next.length;

    if (next.length) {
      this.events[name] = next;
    } else {
      delete this.events[name];
    }

    return removed;
  },

  off(eventName, target) {
    return this.unsubscribe(eventName, target);
  },

  removeOwner(owner) {
    let removed = 0;

    Object.keys(this.events).forEach(
      (eventName) => {
        const list = this.events[eventName];
        const next = list.filter(
          (item) => item.owner !== owner
        );

        removed += list.length - next.length;

        if (next.length) {
          this.events[eventName] = next;
        } else {
          delete this.events[eventName];
        }
      }
    );

    return removed;
  },

  publish(eventName, payload = {}, options = {}) {
    if (!this.ready) {
      this.init();
    }

    const name = this._normalizeName(eventName);

    if (!name) {
      throw new Error("Event name required");
    }

    const source = this._source(
      payload,
      options
    );

    if (
      this.isLifecycleEvent(name) &&
      source !== this.lifecycleOwner &&
      options.allowLifecycleOverride !== true
    ) {
      return this._suppressedResult(
        name,
        source,
        "CRUD_EVENT_OWNER"
      );
    }

    const params = this._eventParams(
      name,
      payload,
      {
        ...options,
        metadata: {
          ...(options.metadata || {}),
          lifecycleOverride:
            options.allowLifecycleOverride === true,
        },
      }
    );
    const envelope =
      ERPEventContract.create(params);
    const processingKey =
      envelope.name +
      ":" +
      (
        envelope.entityId ||
        envelope.correlationId
      );

    if (this._processing.has(processingKey)) {
      this.metrics.cycles++;

      this._record({
        id: envelope.id,
        correlationId:
          envelope.correlationId,
        event: envelope.name,
        entity: envelope.entity,
        entityId: envelope.entityId,
        source: envelope.source,
        status: "CYCLE_SUPPRESSED",
        timestamp: envelope.timestamp,
      });

      return {
        event: envelope.name,
        handlers: 0,
        executed: 0,
        failed: 0,
        cyclical: true,
        suppressed: true,
        reason: "CYCLE",
        eventId: envelope.id,
        correlationId:
          envelope.correlationId,
        envelope,
      };
    }

    this._processing.add(processingKey);
    this.metrics.published++;

    this._record({
      id: envelope.id,
      correlationId: envelope.correlationId,
      event: envelope.name,
      entity: envelope.entity,
      entityId: envelope.entityId,
      source: envelope.source,
      status: "PUBLISHED",
      timestamp: envelope.timestamp,
    });

    const listeners = [
      ...(this.events[name] || []),
    ];
    let executed = 0;
    let failed = 0;

    try {
      listeners.forEach((item) => {
        try {
          const result =
            item.handler(envelope);

          this._assertSync(
            result,
            "Event handler " + item.name
          );

          executed++;
          this.metrics.delivered++;
        } catch (error) {
          failed++;
          this.metrics.handlerFailures++;

          this._log(
            "error",
            "EVENT HANDLER ERROR (" +
            item.name +
            "): " +
            error.message
          );
        }
      });
    } finally {
      this._processing.delete(processingKey);
    }

    return {
      event: envelope.name,
      handlers: listeners.length,
      executed,
      failed,
      suppressed: false,
      eventId: envelope.id,
      correlationId:
        envelope.correlationId,
      envelope,
    };
  },

  emit(eventName, payload = {}, options = {}) {
    return this.publish(
      eventName,
      payload,
      options
    );
  },

  dispatch(
    eventName,
    payload = {},
    options = {}
  ) {
    return this.publish(
      eventName,
      payload,
      options
    );
  },

  trace(correlationId) {
    return this.history.filter(
      (event) =>
        event.correlationId === correlationId
    );
  },

  correlations() {
    const result = {};

    this.history.forEach((event) => {
      if (!event.correlationId) {
        return;
      }

      if (!result[event.correlationId]) {
        result[event.correlationId] = [];
      }

      result[event.correlationId].push({
        event: event.event,
        entityId: event.entityId,
        status: event.status,
        timestamp: event.timestamp,
      });
    });

    return result;
  },

  list() {
    return Object.keys(this.events);
  },

  listeners(eventName) {
    return (
      this.events[
        this._normalizeName(eventName)
      ] || []
    ).length;
  },

  clearHistory() {
    this.history = [];
    return true;
  },

  clearSubscriptions() {
    this.events = {};
    return true;
  },

  clear() {
    this.clearSubscriptions();
    this._processing = new Set();
    return true;
  },

  reset() {
    this.events = {};
    this.history = [];
    this.ready = false;
    this._processing = new Set();
    this._subscriptionCounter = 0;
    this.metrics = {
      published: 0,
      suppressed: 0,
      delivered: 0,
      handlerFailures: 0,
      cycles: 0,
    };
    return true;
  },

  debug() {
    this._log(
      "log",
      JSON.stringify(this.events, null, 2)
    );
  },

  health() {
    const details = {
      version: this.version,
      ready: this.ready,
      events: this.list(),
      handlers: Object.values(this.events)
        .reduce(
          (total, list) =>
            total + list.length,
          0
        ),
      history: this.history.length,
      lifecycleOwner: this.lifecycleOwner,
      metrics: {
        ...this.metrics,
      },
    };

    if (
      typeof HealthContract !== "undefined" &&
      typeof HealthContract.create === "function"
    ) {
      return HealthContract.create(
        "EventBus",
        this.ready ? "OK" : "WARNING",
        details
      );
    }

    return {
      module: "EventBus",
      status: this.ready ? "OK" : "WARNING",
      ...details,
    };
  },
};

globalThis.EventBus = EventBus;
