console.log("TransportOrderEventHandler v1.1");


const TransportOrderEventHandler = {

  version: "1.1.0",

  initialized: false,
  ready: false,

  entityName: "TRANSPORT_ORDER",

  entity: null,

  subscriptions: [],


  init() {


    if (this.initialized) {

      Logger.log(
        "TransportOrderEventHandler ALREADY INITIALIZED"
      );

      return true;
    }


    if (typeof EntityRegistry === "undefined") {

      throw new Error(
        "TransportOrderEventHandler EntityRegistry unavailable"
      );

    }


    this.entity =
      EntityRegistry.get(this.entityName);


    if (!this.entity) {

      throw new Error(
        "ENTITY NOT FOUND " + this.entityName
      );

    }



    if (typeof EventBus === "undefined") {

      throw new Error(
        "EventBus unavailable"
      );

    }



    this.registerEvents();



    this.initialized = true;
    this.ready = true;



    Logger.log(
      "TransportOrderEventHandler READY v" +
      this.version
    );


    Logger.log(
      "SUBSCRIPTIONS " +
      JSON.stringify(this.subscriptions)
    );


    return true;

  },



  registerEvents(){


    this.subscribe(
      EntityEvents.TRANSPORT_ORDER.CREATED,
      this.onCreated
    );


    this.subscribe(
      EntityEvents.TRANSPORT_ORDER.UPDATED,
      this.onUpdated
    );


    this.subscribe(
      EntityEvents.TRANSPORT_ORDER.DELETED,
      this.onDeleted
    );


    this.subscribe(
      EntityEvents.TRANSPORT_ORDER.RESTORED,
      this.onRestored
    );


  },



  subscribe(event, handler){


    if (!event || !handler)
      return;



    const name =
      "TransportOrderEventHandler_" +
      handler.name;



    const bound =
      handler.bind(this);



    EventBus.subscribe(
      event,
      bound,
      {
        name:name
      }
    );



    this.subscriptions.push({

      event:event,

      handler:name

    });


  },



  extract(event){


    if (!event)
      return null;


    return (
      event.after ??
      event.data ??
      event
    );

  },



  getId(event){


    return (

      event.entityId ||

      this.extract(event)
        ?.TransportOrderID ||

      ""

    );

  },



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



  process(action,event){


    try {


      const data =
        this.extract(event);



      Logger.log(

        "TRANSPORT_ORDER " +
        action +
        " " +
        this.getId(event)

      );



      const businessEvent = {


        entity:
          this.entityName,


        action,


        entityId:
          this.getId(event),


        data,


        source:
          "TransportOrderEventHandler",


        timestamp:
          new Date()



      };



      this.notifyBusiness(
        businessEvent
      );


    }

    catch(e){


      Logger.error(

        "TransportOrder EVENT ERROR " +
        e.message

      );


    }


  },



  notifyBusiness(event){



    if(typeof AuditEventHandler!=="undefined"){

      AuditEventHandler.handle?.(
        event
      );

    }



    if(typeof KPIEngine!=="undefined"){

      KPIEngine.process?.(
        event
      );

    }



    if(typeof FinanceEngine!=="undefined"){

      FinanceEngine.process?.(
        event
      );

    }



    if(typeof DashboardEngine!=="undefined"){

      DashboardEngine.process?.(
        event
      );

    }


  },



  health(){


    return HealthContract.create(

      "TransportOrderEventHandler",

      this.ready
      ?"OK"
      :"WARNING",

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
"TransportOrderEventHandler READY v1.1.0"
);