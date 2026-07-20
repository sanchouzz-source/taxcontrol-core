console.log("TripEventHandler");

const TripEventHandler = {
  version: "0.2.0",
  entity: null, // будет заполнено в init

  init() {
    if (typeof EntityRegistry === "undefined") {
      throw new Error("TripEventHandler: EntityRegistry unavailable");
    }
    this.entity = EntityRegistry.TRIP;
    if (!this.entity) {
      throw new Error("TripEventHandler: ENTITY TRIP not found");
    }

    if (typeof EventBus === "undefined") {
      throw new Error("TripEventHandler: EventBus unavailable");
    }

    EventBus.subscribe(
      this.entity.events.created,
      this.onCreated.bind(this)
    );
    EventBus.subscribe(
      this.entity.events.updated,
      this.onUpdated.bind(this)
    );
    EventBus.subscribe(
      this.entity.events.deleted,
      this.onDeleted.bind(this)
    );
    EventBus.subscribe(
      this.entity.events.restored,
      this.onRestored.bind(this)
    );

    Logger.log("TripEventHandler READY v" + this.version);
    return true;
  },

  // Универсальное извлечение данных из события
  extract(payload) {
    if (!payload) return null;
    return payload.after ?? payload.data ?? payload;
  },

  // Получение ID поездки
  getTripId(trip) {
    if (!trip) return "";
    return trip[this.entity.idField] || "";
  },

  onCreated(event) {
    try {
      const trip = this.extract(event);
      if (!trip) return;
      Logger.log("TRIP CREATED " + this.getTripId(trip));
    } catch (error) {
      Logger.error("TripEventHandler CREATED ERROR " + error.message);
    }
  },

  onUpdated(event) {
    try {
      const trip = this.extract(event);
      if (!trip) return;
      Logger.log("TRIP UPDATED " + this.getTripId(trip));
    } catch (error) {
      Logger.error("TripEventHandler UPDATED ERROR " + error.message);
    }
  },

  onDeleted(event) {
    try {
      const trip = this.extract(event);
      if (!trip) return;
      Logger.log("TRIP DELETED " + this.getTripId(trip));
    } catch (error) {
      Logger.error("TripEventHandler DELETED ERROR " + error.message);
    }
  },

  onRestored(event) {
    try {
      const trip = this.extract(event);
      if (!trip) return;
      Logger.log("TRIP RESTORED " + this.getTripId(trip));
    } catch (error) {
      Logger.error("TripEventHandler RESTORED ERROR " + error.message);
    }
  },

  health() {
    return HealthContract.create(
      "TripEventHandler",
      "OK",
      {
        version: this.version,
        entity: this.entity?.entity || "TRIP",
        dependencies: {
          EventBus: !!EventBus,
          EntityRegistry: !!EntityRegistry
        }
      }
    );
  }
};

globalThis.TripEventHandler = TripEventHandler;