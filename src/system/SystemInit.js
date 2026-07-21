console.log("SystemInit v0.8.0");


const SystemInit = {

  version: "0.8.0",
  initialized:false,
  startedAt:null,
  modulesStarted:[],


  init(){

    if(this.initialized){

      Logger.log(
        "ERP SYSTEM ALREADY RUNNING"
      );

      return this.health();
    }


    Logger.log(
      "===== ERP SYSTEM START v" +
      this.version +
      " ====="
    );


    try{


      // ============================
      // 1 DATABASE
      // ============================

      this.start(
        "SchemaManager"
      );


      this.start(
        "Database"
      );



      // ============================
      // 2 CORE
      // ============================

      this.start(
        "Registry"
      );


      this.start(
        "EntityRegistry"
      );


      // ============================
      // 3 EVENTS
      // ============================

      this.start(
        "EventBus"
      );

this.start(
 "BusinessEventProcessor"
);

      // ============================
      // 4 MODULES
      // ============================

      if(
        typeof ModuleLoader !== "undefined"
      ){

        ModuleLoader.loadCore();

        ModuleLoader.initAll();

        this.modulesStarted.push(
          "ModuleLoader"
        );

      }



      // ============================
      // 5 EVENT HANDLERS
      // ============================


      const handlers=[

        "AuditEventHandler",
        "ClientEventHandler",
        "TransportOrderEventHandler",
        "TripEventHandler",
        "LogisticsEventSubscriptions"

      ];


      handlers.forEach(
        h=>this.start(h)
      );



      // ============================
      // 6 BUSINESS ENGINES
      // ============================


      [
        "FinanceEngine",
        "KPIEngine",
        "DashboardEngine"

      ].forEach(
        e=>this.start(e)
      );



      this.initialized=true;

      this.startedAt=
        new Date().toISOString();



      Logger.log(
        "===== ERP SYSTEM READY v"+
        this.version+
        " ====="
      );


    }

    catch(e){

      Logger.log(
        "ERP SYSTEM FAILED "+
        e.message
      );

      throw e;
    }



    return this.health();

  },




  start(name){

    if(
      typeof globalThis[name]==="undefined"
    ){

      Logger.log(
        "SKIP "+name+
        " NOT FOUND"
      );

      return false;
    }


    const obj=
      globalThis[name];


    if(
      typeof obj.init==="function"
    ){

      obj.init();

      this.modulesStarted.push(name);


      Logger.log(
        name+
        " STARTED"
      );

      return true;
    }


    return false;

  },





  health(){


    return HealthContract.create(

      "SystemInit",

      this.initialized
      ?
      "OK"
      :
      "WARNING",


      {

        version:this.version,

        startedAt:this.startedAt,


        modules:
          this.modulesStarted,


        dependencies:{


          SchemaManager:
          typeof SchemaManager!=="undefined",


          Database:
          typeof Database!=="undefined",


          EntityRegistry:
          typeof EntityRegistry!=="undefined",


          EventBus:
          typeof EventBus!=="undefined",


          RepositoryFactory:
          typeof RepositoryFactory!=="undefined"

        }

      }

    );

  }


};



globalThis.SystemInit=SystemInit;


Logger.log(
"SystemInit READY v"+
SystemInit.version
);