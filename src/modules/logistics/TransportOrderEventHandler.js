console.log("TransportOrderEventHandler v1.0");


const TransportOrderEventHandler = {

  version: "1.0.0",

  initialized: false,

  ready: false,

  entityName: "TRANSPORT_ORDER",

  entity: null,

  subscriptions: [],


  init() {

    if (this.initialized) {
      Logger.log(
        "TransportOrderEventHandler ALREADY READY"
      );
      return true;
    }


    if (typeof EntityRegistry === "undefined") {
      throw new Error(
        "TransportOrderEventHandler: EntityRegistry unavailable"
      );
    }


    this.entity =
      EntityRegistry.get(this.entityName);


    if (!this.entity) {
      throw new Error(
        "TransportOrderEventHandler ENTITY NOT FOUND "
        + this.entityName
      );
    }


    if (typeof EventBus === "undefined") {
      throw new Error(
        "TransportOrderEventHandler: EventBus unavailable"
      );
    }


    this.subscribe(
      this.entity.events.created,
      this.onCreated
    );


    this.subscribe(
      this.entity.events.updated,
      this.onUpdated
    );


    this.subscribe(
      this.entity.events.deleted,
      this.onDeleted
    );


    this.subscribe(
      this.entity.events.restored,
      this.onRestored
    );


    this.initialized = true;
    this.ready = true;


    Logger.log(
      "TransportOrderEventHandler READY v"
      + this.version
    );


    return true;
  },


  subscribe(event, handler) {

    if (!event) return;


    const bound =
      handler.bind(this);


    bound.handlerName =
      "TransportOrderEventHandler_"
      + handler.name;


    EventBus.subscribe(
      event,
      bound
    );


    this.subscriptions.push({
      event:event,
      handler:bound.handlerName
    });

  },


  extract(payload){

    if (!payload)
      return null;


    return (
      payload.after ??
      payload.data ??
      payload
    );

  },


  getId(payload){

    const entity =
      this.extract(payload);


    if (!entity)
      return "";


    return entity.TransportOrderID || "";

  },


  onCreated(event){

    try {

      const order =
        this.extract(event);


      Logger.log(
        "TRANSPORT ORDER CREATED "
        + this.getId(event)
      );


      this.notifyBusiness(
        "CREATED",
        order
      );


    }
    catch(e){

      Logger.error(
        "TransportOrder CREATED ERROR "
        + e.message
      );

    }

  },


  onUpdated(event){

    try {

      Logger.log(
        "TRANSPORT ORDER UPDATED "
        + this.getId(event)
      );


      this.notifyBusiness(
        "UPDATED",
        this.extract(event)
      );

    }
    catch(e){

      Logger.error(
        "TransportOrder UPDATED ERROR "
        + e.message
      );

    }

  },


  onDeleted(event){

    try {

      Logger.log(
        "TRANSPORT ORDER DELETED "
        + this.getId(event)
      );


      this.notifyBusiness(
        "DELETED",
        this.extract(event)
      );

    }
    catch(e){

      Logger.error(
        "TransportOrder DELETED ERROR "
        + e.message
      );

    }

  },


  onRestored(event){

    try {

      Logger.log(
        "TRANSPORT ORDER RESTORED "
        + this.getId(event)
      );


      this.notifyBusiness(
        "RESTORED",
        this.extract(event)
      );

    }
    catch(e){

      Logger.error(
        "TransportOrder RESTORED ERROR "
        + e.message
      );

    }

  },


  notifyBusiness(action,data){

    const event = {

      entity:
        this.entityName,

      action:action,

      data:data,

      timestamp:
        new Date()

    };


    /*
      Передача бизнес события
    */


    if (
      typeof AuditEventHandler !== "undefined"
    ){

      AuditEventHandler.handle?.(
        event
      );

    }


    if (
      typeof KPIEngine !== "undefined"
    ){

      KPIEngine.process?.(
        event
      );

    }


    if (
      typeof FinanceEngine !== "undefined"
    ){

      FinanceEngine.process?.(
        event
      );

    }


    if (
      typeof DashboardEngine !== "undefined"
    ){

      DashboardEngine.process?.(
        event
      );

    }

  },


  health(){

    return HealthContract.create(

      "TransportOrderEventHandler",

      this.ready
        ? "OK"
        : "WARNING",

      {

        version:this.version,

        entity:this.entityName,

        subscriptions:
          this.subscriptions.length

      }

    );

  }

};


globalThis.TransportOrderEventHandler =
  TransportOrderEventHandler;


Logger.log(
  "TransportOrderEventHandler READY v"
  + TransportOrderEventHandler.version
);