// ============================================================
// ERP Diagnostics v1.1
// ============================================================

console.log("ERP Diagnostics v1.1");


const ERPDiagnostics = {

  run(options = {}) {

    const report = this.buildReport();


    if(options.json){
      return report;
    }


    this.print(report);

    return report;
  },


  buildReport(){

    return {

      timestamp:
        new Date().toISOString(),


      system:{
        status:
          SystemInit?.initialized
          ? "OK"
          : "WARNING",

        version:
          SystemInit?.version || null,

        startedAt:
          SystemInit?.startedAt || null
      },


      components:this.components(),


      modules:this.modules(),


      dependencies:this.dependencies(),


      database:this.database(),


      events:this.events()

    };

  },


  components(){

    return {

      Database:
        Database?.initialized
        ? "READY"
        : "FAILED",


      EventBus:
        EventBus?.ready
        ? "READY"
        : "FAILED",


      BusinessEventProcessor:
        BusinessEventProcessor?.ready
        ? "READY"
        : "FAILED",


      ModuleRegistry:
        ModuleRegistry?.initialized
        ? "READY"
        : "FAILED"

    };

  },


  modules(){

    const result={};


    if(!ModuleRegistry)
      return result;


    for(const [name,mod]
      of Object.entries(ModuleRegistry.modules||{})){

      result[name]={

        status:
          mod.status,


        version:
          mod.version,


        phase:
          mod.phase,


        dependencies:
          mod.dependencies,


        error:
          mod.error || null,


        startedAt:
          mod.startedAt

      };

    }


    return result;

  },


  dependencies(){

    if(
      !ModuleRegistry ||
      !ModuleRegistry.getDependencyGraph
    )
      return {};


    return ModuleRegistry
      .getDependencyGraph();

  },


  database(){

    return {

      initialized:
        Database?.initialized || false,


      tables:
        SchemaManager?.getSchema
        ?
        Object.keys(
          SchemaManager.getSchema()||{}
        )
        :
        []

    };

  },


  events(){

    return {

      ready:
        EventBus?.ready || false,


      subscriptions:
        EventBus?.list
        ?
        EventBus.list()
        :
        []

    };

  },


  print(report){


    Logger.log(
      "===== ERP DIAGNOSTICS ====="
    );


    Logger.log(
      `SYSTEM ${report.system.status}`
    );


    Logger.log("\nCOMPONENTS");


    for(
      const [k,v]
      of Object.entries(report.components)
    ){

      Logger.log(
        ` ${v==="READY"?"✔":"✘"} ${k}: ${v}`
      );

    }



    Logger.log("\nMODULES");


    for(
      const [name,m]
      of Object.entries(report.modules)
    ){

      const icon =
        m.status==="READY"
        ?"✔"
        :
        m.status==="FAILED"
        ?"✘"
        :
        "⏳";


      Logger.log(
        ` ${icon} ${name} ${m.status}`
      );


      if(m.error)
      {
        Logger.log(
          `    ERROR: ${m.error}`
        );
      }

    }



    Logger.log("\nDEPENDENCY GRAPH");


    for(
      const [name,deps]
      of Object.entries(report.dependencies)
    ){

      Logger.log(
        deps.length
        ?
        ` ${name} → ${deps.join(", ")}`
        :
        ` ${name}`
      );

    }


    Logger.log(
      "===== END ====="
    );

  }

};


globalThis.ERP={

 diagnostics:
   ()=>ERPDiagnostics.run(),

 diagnosticsJSON:
   ()=>ERPDiagnostics.run({
     json:true
   })

};


Logger.log(
 "ERP Diagnostics READY"
);