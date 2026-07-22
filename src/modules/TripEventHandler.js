console.log("TripEventHandler v1.1");


const TripEventHandler = {

  version: "1.1.0",

  initialized: false,
  ready: false,

  entityName: "TRIP",
  entity: null,

  subscriptions: [],

  errorQueue: [],

  retryLimit: 3,


  // ==============================
  // INIT
  // ==============================

  init() {

    if (this.initialized) {

      Logger.log(
        "TripEventHandler ALREADY INITIALIZED"
      );

      return true;
    }


    if (typeof EntityRegistry === "undefined") {

      throw new Error(
        "TripEventHandler: EntityRegistry unavailable"
      );

    }


    this.entity =
      EntityRegistry.get(this.entityName);


    if (!this.entity) {

      throw new Error(
        "TripEventHandler: ENTITY TRIP not found"
      );

    }


    if (typeof EventBus === "undefined") {

      throw new Error(
        "TripEventHandler: EventBus unavailable"
      );

    }


    this.registerEvents();


    this.initialized = true;
    this.ready = true;


    Logger.log(
      "TripEventHandler READY v" +
      this.version
    );


    Logger.log(
      "SUBSCRIPTIONS " +
      JSON.stringify(this.subscriptions)
    );


    return true;

  },


  // ==============================
  // EVENT REGISTER
  // ==============================

  registerEvents() {


    if (
      typeof EntityEvents === "undefined" ||
      !EntityEvents.TRIP
    ) {

      throw new Error(
        "TripEventHandler: TRIP events unavailable"
      );

    }



    this.subscribe(
      EntityEvents.TRIP.CREATED,
      this.onCreated
    );


    this.subscribe(
      EntityEvents.TRIP.UPDATED,
      this.onUpdated
    );


    this.subscribe(
      EntityEvents.TRIP.DELETED,
      this.onDeleted
    );


    this.subscribe(
      EntityEvents.TRIP.RESTORED,
      this.onRestored
    );


  },


  subscribe(event, handler) {


    if (!event || !handler) {
      return;
    }


    const name =
      "TripEventHandler_" +
      handler.name;



    // защита от повторной регистрации

    const exists =
      this.subscriptions.some(
        s => s.handler === name
      );


    if (exists) {

      return;

    }



    EventBus.subscribe(

      event,

      handler.bind(this),

      {
        name:name
      }

    );



    this.subscriptions.push({

      event:event,

      handler:name

    });


  },



  // ==============================
  // HELPERS
  // ==============================


  extract(payload) {

    if (!payload)
      return null;


    return (
      payload.after ??
      payload.data ??
      payload
    );

  },



  getTripId(payload) {


    const trip =
      this.extract(payload);


    if (!trip)
      return "";



    return (
      trip[this.entity.idField] ||
      trip.TripID ||
      ""
    );

  },



  // ==============================
  // ERP EVENT
  // ==============================


  createERPEvent(type,event){


    if (
      typeof ERPEventContract === "undefined"
    ){

      throw new Error(
        "ERPEventContract unavailable"
      );

    }



    return ERPEventContract.create({

      entity:this.entityName,


      type:type,


      entityId:
        this.getTripId(event),



      before:
        event.before || null,



      after:
        event.after ||
        this.extract(event),



      source:
        "TripEventHandler",



      user:null,



      timestamp:
        new Date().toISOString()

    });


  },



  // ==============================
  // VALIDATION
  // ==============================


  validate(event){


    if(!event)
      return false;



    return !!(

      event.entity &&

      event.type &&

      event.entityId &&

      event.timestamp

    );


  },



  // ==============================
  // BUSINESS PIPELINE
  // ==============================


  publish(event){


    if(
      typeof BusinessEventProcessor === "undefined"
    ){

      throw new Error(
        "BusinessEventProcessor unavailable"
      );

    }



    BusinessEventProcessor.process(event);


  },



  // ==============================
  // RETRY / ERROR QUEUE
  // ==============================


  retry(type,event,error){


    Logger.error(

      "TRIP EVENT ERROR " +

      type +

      " " +

      error.message

    );



    this.errorQueue.push({

      entity:this.entityName,

      type:type,

      event:event,

      error:error.message,

      attempt:1,

      maxAttempts:this.retryLimit,

      timestamp:
        new Date().toISOString()

    });


  },



  // ==============================
  // PROCESS
  // ==============================


  process(type,event){


    try {


      Logger.log(

        "ERP EVENT TRIP " +

        type +

        " " +

        this.getTripId(event)

      );



      const erpEvent =

        this.createERPEvent(
          type,
          event
        );



      if(
        !this.validate(erpEvent)
      ){

        throw new Error(
          "INVALID ERP EVENT"
        );

      }



      this.publish(
        erpEvent
      );



    }

    catch(e){


      this.retry(
        type,
        event,
        e
      );


    }


  },



  // ==============================
  // HANDLERS
  // ==============================


  onCreated(event){

    this.process(
      "CREATED",
      event
    );

  },



  onUpdated(event){

    this.process(
      "UPDATED",
      event
    );

  },



  onDeleted(event){

    this.process(
      "DELETED",
      event
    );

  },



  onRestored(event){

    this.process(
      "RESTORED",
      event
    );

  },



  // ==============================
  // HEALTH
  // ==============================


  health(){


    return HealthContract.create(

      "TripEventHandler",


      this.ready
        ? "OK"
        : "WARNING",



      {

        version:this.version,


        entity:this.entityName,


        subscriptions:
          this.subscriptions.length,


        errorQueue:
          this.errorQueue.length,



        dependencies:{


          EventBus:
            typeof EventBus !== "undefined",



          EntityRegistry:
            typeof EntityRegistry !== "undefined",



          ERPEventContract:
            typeof ERPEventContract !== "undefined",



          BusinessEventProcessor:
            typeof BusinessEventProcessor !== "undefined"

        }

      }

    );


  }


};



globalThis.TripEventHandler =
  TripEventHandler;


Logger.log(
  "TripEventHandler LOADED v1.1.0"
);