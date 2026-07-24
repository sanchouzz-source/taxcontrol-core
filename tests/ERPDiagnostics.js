// ============================================================
// ERP Diagnostics v3.1.0
// Compatible:
// SystemInit v2.1.x
// SchemaManager v3.x
// Database v3.x
// EventBus v2.3
// ModuleRegistry v1.10
// ============================================================

console.log("ERP Diagnostics v3.1.0");


const ERPDiagnostics = {


  version: "3.1.0",


  // ============================================================
  // RUN
  // ============================================================

  run(options = {}) {

    const report = this.buildReport();

    if (options.json) {
      return report;
    }

    this.print(report);

    return report;
  },



  // ============================================================
  // BUILD REPORT
  // ============================================================

  buildReport(){

    return {

      timestamp:
        new Date().toISOString(),

      system:
        this.system(),

      components:
        this.components(),

      entities:
        this.entities(),

      database:
        this.database(),

      repositories:
        this.repositories(),

      events:
        this.events(),

      modules:
        this.modules(),

      health:
        this.health()

    };

  },



  // ============================================================
  // SYSTEM
  // ============================================================

  system(){

    return {

      version:
        SystemInit?.version || null,


      initialized:
        SystemInit?.initialized || false,


      startedAt:
        SystemInit?.startedAt || null,


      uptime:
        SystemInit?.startedAt
        ?
        Date.now()
        -
        new Date(SystemInit.startedAt).getTime()
        :
        0

    };

  },



  // ============================================================
  // COMPONENTS
  // ============================================================

  components(){

    const check = (name)=>{

      const obj = globalThis[name];


      if(!obj){
        return "NOT_FOUND";
      }


      if(obj.ready === true){
        return "READY";
      }


      if(obj.initialized === true){
        return "READY";
      }


      if(
        typeof obj.health === "function"
      ){
        return "READY";
      }


      return "LOADED";

    };


    return {


      Config:
        check("Config"),


      Logger:
        check("Logger"),


      SchemaManager:
        check("SchemaManager"),


      Database:
        check("Database"),


      EntityMetadata:
        check("EntityMetadata"),


      EntityRegistry:
        check("EntityRegistry"),


      RepositoryFactory:
        check("RepositoryFactory"),


      RepositoryRegistry:
        check("RepositoryRegistry"),


      EventBus:
        check("EventBus"),


      BusinessEventProcessor:
        check("BusinessEventProcessor"),


      ModuleRegistry:
        check("ModuleRegistry")


    };


  },



  // ============================================================
  // ENTITIES
  // ============================================================

  entities(){

    try{


      if(
        typeof EntityRegistry !== "undefined"
        &&
        EntityRegistry.list
      ){

        const list =
          EntityRegistry.list();


        return {

          count:list.length,

          items:list

        };

      }


    }
    catch(e){

      return {
        error:e.message
      };

    }


    return {
      count:0,
      items:[]
    };

  },



  // ============================================================
  // DATABASE
  // ============================================================

  database(){

    let schema=[];


    try{


      if(
        SchemaManager
        &&
        SchemaManager.getSchema
      ){

        schema =
          Object.keys(
            SchemaManager.getSchema() || {}
          );

      }


    }
    catch(e){

      schema=[
        "ERROR: "+e.message
      ];

    }



    return {


      initialized:
        Database?.initialized || false,


      ready:
        Database?.ready || false,


      tables:
        schema,


      count:
        schema.length


    };

  },



  // ============================================================
  // REPOSITORIES
  // ============================================================

  repositories(){


    return {


      factory:

        RepositoryFactory?.registry
        ?
        Object.keys(
          RepositoryFactory.registry
        )
        :
        [],



      registry:

        RepositoryRegistry?.repositories
        ?
        Object.keys(
          RepositoryRegistry.repositories
        )
        :
        []

    };


  },



  // ============================================================
  // EVENTS
  // ============================================================

  events(){


    let events=[];


    try{


      if(
        EventBus
        &&
        EventBus.list
      ){

        events =
          EventBus.list();

      }


    }
    catch(e){}



    return {


      ready:
        EventBus?.ready || false,


      count:
        events.length,


      events


    };


  },



  // ============================================================
  // MODULES
  // ============================================================

  modules(){

    try{


      if(
        ModuleRegistry
        &&
        ModuleRegistry.modules
      ){

        return Object.keys(
          ModuleRegistry.modules
        );

      }


    }
    catch(e){}


    return [];

  },



  // ============================================================
  // HEALTH
  // ============================================================

  health(){


    try{


      if(
        typeof SystemInit !== "undefined"
        &&
        SystemInit.health
      ){

        return SystemInit.health();

      }


    }
    catch(e){

      return {
        error:e.message
      };

    }


    return {};

  },



  // ============================================================
  // PRINT
  // ============================================================

  print(report){


    Logger.log(
      "========== ERP DIAGNOSTICS "
      +
      this.version
      +
      " =========="
    );



    Logger.log(
      "SYSTEM:"
      +
      (
        report.system.initialized
        ?
        " READY"
        :
        " NOT READY"
      )
    );



    Logger.log("\nCOMPONENTS");


    Object.entries(
      report.components
    )
    .forEach(([name,status])=>{


      const icon =
        status==="READY"
        ?
        "✔"
        :
        "⚠";


      Logger.log(
        `${icon} ${name}: ${status}`
      );


    });



    Logger.log("\nENTITIES");

    Logger.log(
      JSON.stringify(
        report.entities,
        null,
        2
      )
    );



    Logger.log("\nDATABASE");

    Logger.log(
      JSON.stringify(
        report.database,
        null,
        2
      )
    );



    Logger.log("\nREPOSITORIES");

    Logger.log(
      JSON.stringify(
        report.repositories,
        null,
        2
      )
    );



    Logger.log("\nEVENT BUS");

    Logger.log(
      JSON.stringify(
        report.events,
        null,
        2
      )
    );



    Logger.log("\nMODULES");

    Logger.log(
      JSON.stringify(
        report.modules,
        null,
        2
      )
    );



    Logger.log(
      "\n========== END ERP DIAGNOSTICS =========="
    );


  }


};



// ============================================================
// GLOBAL COMMANDS
// ============================================================


globalThis.erpDiag = function(){

  return ERPDiagnostics.run();

};



globalThis.erpDiagJSON = function(){

  return ERPDiagnostics.run({
    json:true
  });

};



globalThis.erpHealth = function(){

  return ERPDiagnostics.health();

};



globalThis.ERPDiagnostics =
  ERPDiagnostics;



Logger.log(
  "ERP Diagnostics READY v"
  +
  ERPDiagnostics.version
);