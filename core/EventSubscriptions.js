// ============================================================
// EventSubscriptions v1.1.0
// Managed Dashboard Event Subscriptions
//
// Package E contract:
// - initialized only by ModuleRegistry manifest lifecycle
// - consumes ERPEventContract v2 envelopes
// - owns stable subscription tokens
// - synchronous reset removes every owned handler
// ============================================================

console.log("EventSubscriptions v1.1.0");

const EventSubscriptions = {
  version: "1.1.0",
  initialized: false,
  started: false,
  subscriptions: [],

  stats: {
    received: 0,
    processed: 0,
    failed: 0,
  },

  init() {
    if (this.initialized) {
      return true;
    }

    if (
      typeof EventBus === "undefined" ||
      typeof EventBus.subscribe !== "function"
    ) {
      throw new Error(
        "EventSubscriptions requires EventBus"
      );
    }

    if (
      typeof EntityEvents === "undefined"
    ) {
      throw new Error(
        "EventSubscriptions requires EntityEvents"
      );
    }

    this.registerEntityEvents();
    this.initialized = true;
    this.started = true;

    this._log(
      "log",
      "EventSubscriptions READY v" +
      this.version
    );
    return true;
  },

  start() {
    return this.init();
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

  registerEntityEvents() {
    const groups = [
      "CLIENT",
      "TRIP",
      "TRANSPORT_ORDER",
      "CARRIER",
      "DRIVER",
      "VEHICLE",
      "ROUTE",
      "CARGO",
    ];

    groups.forEach((entity) => {
      const definitions =
        EntityEvents[entity] || {};

      [
        "CREATED",
        "UPDATED",
        "DELETED",
        "RESTORED",
      ].forEach((action) => {
        const eventName =
          definitions[action];

        if (!eventName) {
          return;
        }

        this.subscribe(
          eventName,
          (event) =>
            this.onEntityChanged(event),
          {
            name:
              "Dashboard_" + eventName,
          }
        );
      });
    });

    return true;
  },

  subscribe(
    eventName,
    handler,
    options = {}
  ) {
    if (
      !eventName ||
      typeof handler !== "function"
    ) {
      return false;
    }

    if (
      this.subscriptions.some(
        (item) => item.event === eventName
      )
    ) {
      return false;
    }

    const token = EventBus.subscribe(
      eventName,
      (event) => {
        this.stats.received++;

        try {
          const result = handler(event);

          this._assertSync(
            result,
            "EventSubscriptions handler"
          );
          this.stats.processed++;
          return result;
        } catch (error) {
          this.stats.failed++;
          this._log(
            "error",
            "DASHBOARD EVENT ERROR " +
            eventName +
            " " +
            error.message
          );
          return false;
        }
      },
      {
        name:
          options.name ||
          "Dashboard_" + eventName,
        owner: "EventSubscriptions",
      }
    );

    this.subscriptions.push({
      event: eventName,
      token,
    });
    return true;
  },

  onEntityChanged(event) {
    if (
      typeof ERPEventContract !== "undefined" &&
      typeof ERPEventContract.validate ===
        "function"
    ) {
      const validation =
        ERPEventContract.validate(event);

      if (!validation.valid) {
        throw new Error(
          validation.errors.join("; ")
        );
      }
    }

    return this.refreshDashboard();
  },

  refreshDashboard() {
    if (
      typeof DashboardEngine === "undefined" ||
      typeof DashboardEngine.render !==
        "function"
    ) {
      return false;
    }

    return this._assertSync(
      DashboardEngine.render(true),
      "DashboardEngine.render"
    );
  },

  stop() {
    this.subscriptions.forEach((item) => {
      EventBus.unsubscribe(
        item.event,
        item.token
      );
    });

    this.subscriptions = [];
    this.started = false;
    this.initialized = false;
    return true;
  },

  reset() {
    this.stop();
    this.stats = {
      received: 0,
      processed: 0,
      failed: 0,
    };
    return true;
  },

  health() {
    const details = {
      version: this.version,
      initialized: this.initialized,
      started: this.started,
      subscriptions:
        this.subscriptions.length,
      events: this.subscriptions.map(
        (item) => item.event
      ),
      stats: {
        ...this.stats,
      },
    };

    if (
      typeof HealthContract !== "undefined" &&
      typeof HealthContract.create === "function"
    ) {
      return HealthContract.create(
        "EventSubscriptions",
        this.initialized ? "OK" : "WARNING",
        details
      );
    }

    return {
      module: "EventSubscriptions",
      status:
        this.initialized ? "OK" : "WARNING",
      ...details,
    };
  },
};

globalThis.EventSubscriptions =
  EventSubscriptions;
