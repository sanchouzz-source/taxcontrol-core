// ============================================================
// ERP Health Test v2.0
// SystemInit based diagnostic launcher
// ============================================================

async function erpHealthTest(){


  Logger.log(
    "========== ERP HEALTH REQUEST =========="
  );


  let report;


  try {


    // ------------------------------------------------
    // BOOT ERP SYSTEM
    // ------------------------------------------------

    if(
      typeof SystemInit !== "undefined" &&
      typeof SystemInit.init === "function"
    ){

      Logger.log(
        "Starting ERP SystemInit..."
      );


      await SystemInit.init();


    }
    else{


      throw new Error(
        "SystemInit not available"
      );


    }



    // ------------------------------------------------
    // COLLECT HEALTH
    // ------------------------------------------------


    if(
      typeof SystemInit.health === "function"
    ){

      report =
        SystemInit.health();

    }
    else{

      report={

        status:"ERROR",

        message:
          "SystemInit.health missing"

      };

    }



    // ------------------------------------------------
    // EXTENDED HEALTH
    // ------------------------------------------------


    const modules = {};


    if(
      typeof ModuleRegistry !== "undefined" &&
      typeof ModuleRegistry.health === "function"
    ){

      modules.ModuleRegistry =
        ModuleRegistry.health();

    }



    if(
      typeof Database !== "undefined" &&
      typeof Database.health === "function"
    ){

      modules.Database =
        Database.health();

    }



    if(
      typeof EventBus !== "undefined" &&
      typeof EventBus.health === "function"
    ){

      modules.EventBus =
        EventBus.health();

    }



    if(
      Object.keys(modules).length
    ){

      report.details =
        report.details || {};


      report.details.modules =
        modules;

    }



  }
  catch(e){


    Logger.error(
      "ERP HEALTH FAILED: "
      + e.message
    );


    report={

      status:"FAILED",

      module:"ERP",

      error:e.message,

      stack:e.stack

    };


  }



  Logger.log(
    "========== ERP HEALTH REPORT =========="
  );


  Logger.log(
    JSON.stringify(
      report,
      null,
      2
    )
  );


  return report;


}