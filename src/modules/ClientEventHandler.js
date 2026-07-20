console.log("ClientEventHandler v0.6");

const ClientEventHandler = {
  version: "0.6.0",
  initialized: false,
  ready: false,
  entityName: "CLIENT",
  entity: null,
  subscriptions: [],

  /*
  ====================================
  INIT
  ====================================
  */
  init() {
    if (this.initialized) {
      Logger.log("ClientEventHandler ALREADY READY");
      return true;
    }

    if (typeof EntityRegistry === "undefined") {
      throw new Error("ClientEventHandler: EntityRegistry unavailable");
    }

    this.entity = EntityRegistry.get(this.entityName);
    if (!this.entity) {
      throw new Error("ClientEventHandler: ENTITY NOT FOUND " + this.entityName);
    }

    if (typeof EventBus === "undefined") {
      throw new Error("ClientEventHandler: EventBus unavailable");
    }

    this.subscribe(this.entity.events.created, this.onCreated);
    this.subscribe(this.entity.events.updated, this.onUpdated);
    this.subscribe(this.entity.events.deleted, this.onDeleted);
    this.subscribe(this.entity.events.restored, this.onRestored);

    this.initialized = true;
    this.ready = true;

    Logger.log("ClientEventHandler READY v" + this.version);
    return true;
  },

  /*
  ====================================
  SUBSCRIBE WRAPPER
  ====================================
  */
  subscribe(event, handler) {
    if (!event) return;
    const bound = handler.bind(this);
    bound.handlerName = "ClientEventHandler_" + handler.name;
    EventBus.subscribe(event, bound);
    this.subscriptions.push({
      event,
      handler: bound.handlerName
    });
  },

  /*
  ====================================
  EXTRACT EVENT DATA
  ====================================
  */
  extract(payload) {
    if (!payload) return null;
    return (
      payload.after ??
      payload.data ??
      payload
    );
  },

  /*
  ====================================
  GET ID
  ====================================
  */
  getId(payload) {
    if (!payload) return "";
    if (payload.entityId) return payload.entityId;
    const entity = this.extract(payload);
    if (!entity) return "";
    return entity[this.entity.idField] || "";
  },

  /*
  ====================================
  LOG EVENT
  ====================================
  */
  log(action, payload) {
    const id = this.getId(payload);
    if (!id) {
      Logger.debug("CLIENT EVENT WITHOUT ID " + action);
      return;
    }
    Logger.log("CLIENT " + action + " EVENT " + id);
  },

  /*
  ====================================
  HANDLERS
  ====================================
  */
  onCreated(event) {
    try {
      const client = this.extract(event);
      if (!client) {
        throw new Error("CLIENT CREATED EMPTY PAYLOAD");
      }
      EventBus.emit("CLIENT_CREATED", client);
      this.log("CREATED", event);
    } catch (error) {
      Logger.error("ClientEventHandler CREATED ERROR " + error.message);
    }
  },

  onUpdated(event) {
    try {
      this.log("UPDATED", event);
    } catch (error) {
      Logger.error("ClientEventHandler UPDATED ERROR " + error.message);
    }
  },

  onDeleted(event) {
    try {
      this.log("DELETED", event);
    } catch (error) {
      Logger.error("ClientEventHandler DELETED ERROR " + error.message);
    }
  },

  onRestored(event) {
    try {
      this.log("RESTORED", event);
    } catch (error) {
      Logger.error("ClientEventHandler RESTORED ERROR " + error.message);
    }
  },

  /*
  ====================================
  HEALTH
  ====================================
  */
  health() {
    return HealthContract.create(
      "ClientEventHandler",
      this.ready ? "OK" : "WARNING",
      {
        version: this.version,
        entity: this.entityName,
        initialized: this.initialized,
        subscriptions: this.subscriptions.length
      }
    );
  }
};

globalThis.ClientEventHandler = ClientEventHandler;
Logger.log("ClientEventHandler READY v" + ClientEventHandler.version);