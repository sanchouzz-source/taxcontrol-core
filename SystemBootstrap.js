/**
 * ============================================================
 * ERP BOOTSTRAP v2.3
 *
 * Unified ERP Entry Point
 *
 * Architecture:
 *
 * startERP()
 *      |
 *      v
 * Bootstrap.start()
 *      |
 *      v
 * SystemInit.init()
 *
 *
 * Commands:
 *
 * startERP()
 *
 * erpHealth()
 *
 * erpDiag()
 *
 * resetERP()
 *
 * ============================================================
 */


console.log("ERP Bootstrap v2.3");




// ============================================================
// GLOBAL ERP STATE
// ============================================================


globalThis.__ERP_STATE__ =
globalThis.__ERP_STATE__ || {


    started:false,


    starting:false,


    startedAt:null,


    error:null,


    version:"2.3.0"

};





// ============================================================
// START ERP
// ============================================================


async function startERP(){


    const state =
        globalThis.__ERP_STATE__;



    // already started

    if(state.started){


        Logger.warn(
            "ERP already started"
        );


        return erpHealth();

    }



    // startup lock

    if(state.starting){


        Logger.warn(
            "ERP startup already running"
        );


        return;

    }



    state.starting=true;


    state.error=null;



    Logger.log(
        "========== ERP START REQUEST =========="
    );



    try{


        if(
            typeof Bootstrap === "undefined"
        ){

            throw new Error(
                "Bootstrap controller missing"
            );

        }



        /*
         * Единственная точка запуска
         */

        const result =
            await Bootstrap.start();



        state.started=true;


        state.starting=false;


        state.startedAt =
            new Date().toISOString();



        Logger.log(
            "🚀 ERP BOOT COMPLETE"
        );



        return result;



    }
    catch(e){



        state.started=false;


        state.starting=false;


        state.error =
            e.message;



        Logger.error(

            "💥 ERP BOOT FAILED: "
            +
            e.message

        );



        throw e;


    }


}







// ============================================================
// HEALTH
// ============================================================


function erpHealth(){



    Logger.log(
        "========== ERP HEALTH =========="
    );



    try{


        let health=null;



        if(
            typeof Bootstrap !== "undefined" &&
            Bootstrap.health
        ){


            health =
                Bootstrap.health();


        }
        else if(
            typeof SystemInit !== "undefined"
        ){


            health =
                SystemInit.health();


        }
        else{


            health={

                status:"FAILED",

                message:
                "ERP health service unavailable"

            };


        }



        Logger.log(

            JSON.stringify(
                health,
                null,
                2
            )

        );



        return health;



    }
    catch(e){


        const error={

            status:"FAILED",

            error:e.message

        };


        Logger.error(
            e.message
        );


        return error;


    }


}







// ============================================================
// DIAGNOSTICS
// ============================================================


function erpDiag(){


    Logger.log(
        "========== ERP DIAGNOSTICS =========="
    );



    try{


        if(
            typeof Bootstrap !== "undefined" &&
            Bootstrap.diagnostics
        ){


            return Bootstrap.diagnostics();


        }



        if(
            typeof ERPDiagnostics !== "undefined"
        ){


            return ERPDiagnostics.run();


        }



        return {


            status:"WARNING",

            message:
            "Diagnostics unavailable"


        };



    }
    catch(e){


        Logger.error(
            "ERP DIAG FAILED "+
            e.message
        );


        return {


            status:"FAILED",

            error:e.message


        };


    }


}







// ============================================================
// RESET DEVELOPMENT MODE
// ============================================================


function resetERP(){



    Logger.warn(
        "========== ERP RESET =========="
    );



    try{


        if(
            typeof Bootstrap !== "undefined" &&
            Bootstrap.reset
        ){

            Bootstrap.reset();

        }



        if(
            typeof SystemInit !== "undefined" &&
            SystemInit.reset
        ){

            SystemInit.reset();

        }



        globalThis.__ERP_STATE__={


            started:false,


            starting:false,


            startedAt:null,


            error:null,


            version:"2.3.0"


        };



        Logger.log(
            "ERP RESET COMPLETE"
        );



        return true;



    }
    catch(e){


        Logger.error(
            "ERP RESET FAILED "+
            e.message
        );


        return false;


    }


}







// ============================================================
// GLOBAL EXPORT
// ============================================================


globalThis.startERP =
    startERP;


globalThis.erpHealth =
    erpHealth;


globalThis.erpDiag =
    erpDiag;


globalThis.resetERP =
    resetERP;







// ============================================================
// READY
// ============================================================


Logger.log(
"ERP COMMANDS READY:"
);


Logger.log(
"  startERP()"
);


Logger.log(
"  erpHealth()"
);


Logger.log(
"  erpDiag()"
);


Logger.log(
"  resetERP()"
);