// ============================================================
// KPIEngine v1.1.0
// Managed KPI Event Consumer
//
// Package E contract:
// - consumes canonical event payloads
// - subscriptions belong to ModuleRegistry lifecycle
// - reset removes all owned handlers
// ============================================================

console.log("KPIEngine v1.1.0");

const KPIEngine = {
  version: "1.1.0",
  initialized: false,
  subscriptions: [],
  processed: 0,
  failed: 0,

  init() {
    if (this.initialized) {
      return true;
    }

    if (
      typeof EventBus === "undefined" ||
      typeof EventBus.subscribe !== "function"
    ) {
      throw new Error(
        "KPIEngine requires EventBus"
      );
    }

    const token = EventBus.subscribe(
      "TRIP_PROFIT_CALCULATED",
      (event) => this.onTripProfit(event),
      {
        name: "KPI_TripProfitCalculated",
        owner: "KPIEngine",
      }
    );

    this.subscriptions.push({
      event: "TRIP_PROFIT_CALCULATED",
      token,
    });
    this.initialized = true;

    this._log(
      "log",
      "KPIEngine READY v" + this.version
    );
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

  extract(event) {
    if (
      typeof ERPEventContract !== "undefined" &&
      typeof ERPEventContract.payloadOf ===
        "function"
    ) {
      return ERPEventContract.payloadOf(event);
    }

    return (
      event?.after ??
      event?.payload ??
      event?.data ??
      event ??
      null
    );
  },

  onTripProfit(event) {
    try {
      const payload = this.extract(event);

      if (
        !payload ||
        !payload.transaction ||
        !payload.trip
      ) {
        throw new Error(
          "TRIP_PROFIT_CALCULATED payload invalid"
        );
      }

      if (
        typeof KPIService === "undefined" ||
        typeof KPIService.createProfitKPI !==
          "function"
      ) {
        throw new Error(
          "KPIService.createProfitKPI unavailable"
        );
      }

      const result =
        KPIService.createProfitKPI(
          payload.trip,
          payload.transaction,
          payload.profit
        );

      if (
        result &&
        typeof result.then === "function"
      ) {
        throw new Error(
          "KPI handler must be synchronous"
        );
      }

      this.processed++;
      return result;
    } catch (error) {
      this.failed++;
      this._log(
        "error",
        "KPI EVENT ERROR " + error.message
      );
      return false;
    }
  },

  handleCommand(command) {
    if (
      typeof KPIService !== "undefined" &&
      typeof KPIService.handleCommand ===
        "function"
    ) {
      return KPIService.handleCommand(command);
    }

    this._log(
      "debug",
      "KPI command accepted without adapter " +
      (command?.type || "UNKNOWN")
    );
    return false;
  },

  stop() {
    if (
      typeof EventBus !== "undefined" &&
      typeof EventBus.unsubscribe ===
        "function"
    ) {
      this.subscriptions.forEach((item) => {
        EventBus.unsubscribe(
          item.event,
          item.token
        );
      });
    }

    this.subscriptions = [];
    this.initialized = false;
    return true;
  },

  reset() {
    this.stop();
    this.processed = 0;
    this.failed = 0;
    return true;
  },

  health() {
    const details = {
      version: this.version,
      initialized: this.initialized,
      subscriptions:
        this.subscriptions.length,
      processed: this.processed,
      failed: this.failed,
    };

    if (
      typeof HealthContract !== "undefined" &&
      typeof HealthContract.create === "function"
    ) {
      return HealthContract.create(
        "KPIEngine",
        this.initialized
          ? "OK"
          : "WARNING",
        details
      );
    }

    return {
      module: "KPIEngine",
      status:
        this.initialized ? "OK" : "WARNING",
      ...details,
    };
  },
};

globalThis.KPIEngine = KPIEngine;
