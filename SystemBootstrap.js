/**
 * ============================================================
 * ERP BOOTSTRAP v2.2
 *
 * Единая точка входа ERP
 *
 * Запуск:
 *
 * startERP()
 *
 * Проверка:
 *
 * erpHealth()
 * erpDiag()
 *
 * ============================================================
 */


console.log("ERP Bootstrap v2.2");



globalThis.__ERP_STATE__ =
globalThis.__ERP_STATE__ || {


    started:false,


    starting:false,


    startedAt:null,


    error:null

};





/**
 * ============================================================
 * START ERP
 * ============================================================
 */


async function startERP(){



    const state =
        globalThis.__ERP_STATE__;



    // защита от двойного запуска

    if(state.started){


        Logger.log(
            "⚠ ERP already started"
        );


        return erpHealth();

    }



    if(state.starting){


        Logger.log(
            "⏳ ERP boot already running"
        );


        return;

    }



    state.starting=true;



    Logger.log(
        "========== ERP START REQUEST =========="
    );



    try{


        if(
            typeof SystemInit === "undefined"
        ){

            throw new Error(
                "SystemInit not found"
            );

        }



        /*
         * Главный запуск
         */

        const result =
            await SystemInit.init();




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



        state.error=e.message;


        state.starting=false;


        state.started=false;



        Logger.error(
            "💥 ERP BOOT FAILED: "
            + e.message
        );



        throw e;

    }


}





/**
 * ============================================================
 * HEALTH COMMAND
 * ============================================================
 */


function erpHealth(){


    Logger.log(
        "========== ERP HEALTH =========="
    );


    if(
        typeof SystemInit==="undefined"
    ){

        Logger.log(
            "❌ SystemInit missing"
        );

        return;

    }



    const health =
        SystemInit.health();



    Logger.log(
        JSON.stringify(
            health,
            null,
            2
        )
    );


    return health;

}





/**
 * ============================================================
 * DIAGNOSTICS COMMAND
 * ============================================================
 */


function erpDiag(){



    Logger.log(
        "========== ERP DIAGNOSTICS =========="
    );



    if(
        typeof ERPDiagnostics==="undefined"
    ){

        Logger.log(
            "❌ ERPDiagnostics missing"
        );


        return;

    }



    return ERPDiagnostics.run();

}





/**
 * ============================================================
 * RESET FOR DEVELOPMENT
 * ============================================================
 */


function resetERP(){



    globalThis.__ERP_STATE__={

        started:false,

        starting:false,

        startedAt:null,

        error:null

    };



    if(
        typeof SystemInit!=="undefined"
    ){

        SystemInit.reset?.();

    }



    Logger.log(
        "ERP RESET COMPLETE"
    );

}




/**
 * ============================================================
 * GLOBAL EXPORT
 * ============================================================
 */


globalThis.startERP=startERP;

globalThis.erpHealth=erpHealth;

globalThis.erpDiag=erpDiag;

globalThis.resetERP=resetERP;



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