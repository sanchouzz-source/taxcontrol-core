// ============================================================
// FinanceEngine v1.1.0
// Managed Finance Event Consumer
//
// Package E contract:
// - consumes canonical event.payload/after data
// - subscriptions belong to ModuleRegistry lifecycle
// - reset removes owned subscriptions
// ============================================================

console.log("FinanceEngine v1.1.0");

const FinanceEngine = {
  version: "1.1.0",
  ready: false,
  subscriptions: [],
  processed: 0,
  failed: 0,

  init() {
    if (this.ready) {
      return true;
    }

    if (
      typeof EventBus === "undefined" ||
      typeof EventBus.subscribe !== "function"
    ) {
      throw new Error(
        "FinanceEngine requires EventBus"
      );
    }

    this.subscribe(
      "CLIENT_CREATED",
      this.onClientCreated,
      "Finance_ClientCreated"
    );

    this.subscribe(
      "TRIP_COMPLETED",
      this.onTripCompleted,
      "Finance_TripCompleted"
    );

    this.ready = true;
    this._log(
      "log",
      "FinanceEngine READY v" + this.version
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

  subscribe(eventName, handler, name) {
    const token = EventBus.subscribe(
      eventName,
      (event) => {
        try {
          const result = handler.call(
            this,
            event
          );

          if (
            result &&
            typeof result.then === "function"
          ) {
            throw new Error(
              "Finance handler must be synchronous"
            );
          }

          this.processed++;
          return result;
        } catch (error) {
          this.failed++;
          this._log(
            "error",
            "FINANCE EVENT ERROR " +
            eventName +
            " " +
            error.message
          );
          return false;
        }
      },
      {
        name,
        owner: "FinanceEngine",
      }
    );

    this.subscriptions.push({
      event: eventName,
      token,
    });
    return true;
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

  onClientCreated(event) {
    const client = this.extract(event);

    if (!client) {
      throw new Error(
        "CLIENT_CREATED payload missing"
      );
    }

    return this.createProfile(client);
  },

  onTripCompleted(event) {
    const trip = this.extract(event);

    if (!trip) {
      throw new Error(
        "TRIP_COMPLETED payload missing"
      );
    }

    return this.createTransaction(trip);
  },

  createProfile(client) {
    if (
      typeof EntityService === "undefined" ||
      typeof EntityService.create !== "function"
    ) {
      throw new Error(
        "FinanceEngine requires EntityService"
      );
    }

    return EntityService.create(
      "CLIENT_FINANCE_PROFILE",
      {
        OrganizationID:
          client.OrganizationID,
        ClientID: client.ClientID,
        Balance: 0,
        CreditLimit: 0,
        Status: "ACTIVE",
      }
    );
  },

  createTransaction(trip) {
    if (
      typeof EntityService === "undefined" ||
      typeof EntityService.create !== "function"
    ) {
      throw new Error(
        "FinanceEngine requires EntityService"
      );
    }

    return EntityService.create(
      "FINANCIAL_TRANSACTION",
      {
        OrganizationID:
          trip.OrganizationID,
        Type: "TRIP_PROFIT",
        Entity: "TRIP",
        EntityID: trip.TripID,
        Revenue: Number(trip.Revenue || 0),
        Cost: Number(
          trip.ActualCost || 0
        ),
        Profit:
          Number(trip.Revenue || 0) -
          Number(trip.ActualCost || 0),
      }
    );
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
    this.ready = false;
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
      ready: this.ready,
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
        "FinanceEngine",
        this.ready ? "OK" : "WARNING",
        details
      );
    }

    return {
      module: "FinanceEngine",
      status: this.ready ? "OK" : "WARNING",
      ...details,
    };
  },
};

globalThis.FinanceEngine = FinanceEngine;
