console.log("CoreFunctions");


/**
 * ============================================================
 * CoreFunctions v3.0.0
 *
 * Unified ERP Control API
 *
 * Единственная точка управления ERP
 * ============================================================
 */


const CoreFunctions = {

    version:"3.0.0",


    // ------------------------------------------------
    // Проверка ядра
    // ------------------------------------------------

    checkCore(){

        const required=[
            "SystemInit",
            "Logger"
        ];


        const missing=[];


        required.forEach(name=>{

            if(typeof globalThis[name]==="undefined"){
                missing.push(name);
            }

        });


        return {
            ok:missing.length===0,
            missing
        };

    },



    // ------------------------------------------------
    // START ERP
    // ------------------------------------------------

    async start(){

        Logger.log(
            "========== CORE FUNCTIONS START =========="
        );


        const check=this.checkCore();


        if(!check.ok){

            throw new Error(
                "Missing core: "+
                check.missing.join(",")
            );

        }


        globalThis.__ERP_STATE__ =
            globalThis.__ERP_STATE__ ||
            {
                started:false,
                startedAt:null
            };



        if(globalThis.__ERP_STATE__.started){

            Logger.warn(
                "ERP already started"
            );

            return this.health();

        }



        try{


            const result =
                await SystemInit.init();



            globalThis.__ERP_STATE__.started=true;

            globalThis.__ERP_STATE__.startedAt =
                new Date().toISOString();



            Logger.log(
                "ERP START SUCCESS"
            );


            return result;


        }
        catch(e){


            Logger.error(
                "ERP START FAILED "+
                e.message
            );


            globalThis.__ERP_STATE__.started=false;


            throw e;

        }


    },



    // ------------------------------------------------
    // HEALTH
    // ------------------------------------------------

    health(){


        try{


            if(typeof ERPDiagnostics!=="undefined"
                &&
               ERPDiagnostics.run){


                return ERPDiagnostics.run();

            }



            if(typeof SystemInit!=="undefined"
                &&
               SystemInit.health){


                return SystemInit.health();

            }



            return {

                status:"WARNING",
                message:
                "Diagnostics unavailable"

            };


        }
        catch(e){

            return {

                status:"ERROR",
                error:e.message

            };

        }

    },




    // ------------------------------------------------
    // DIAGNOSTICS
    // ------------------------------------------------

    diagnostics(){


        try{


            if(typeof ERPDiagnostics!=="undefined"
                &&
               ERPDiagnostics.diagnostics){


                return ERPDiagnostics.diagnostics();

            }



            return {


                system:
                SystemInit?.diagnostics?.()


            };


        }
        catch(e){

            return {

                status:"ERROR",
                error:e.message

            };

        }

    },





    // ------------------------------------------------
    // FULL TEST
    // ------------------------------------------------

    startupTest(){


        if(typeof SystemStartupTest!=="undefined"
            &&
           SystemStartupTest.fullHealth){


            return SystemStartupTest.fullHealth();

        }


        return {

            status:"WARNING",
            message:
            "SystemStartupTest unavailable"

        };


    },





    // ------------------------------------------------
    // STATUS
    // ------------------------------------------------

    status(){

        return {


            version:this.version,


            state:
            globalThis.__ERP_STATE__ || {},


            system:
            typeof SystemInit!=="undefined"
            ?
            SystemInit.initialized
            :
            false


        };

    }



};



// ===================================================
// GLOBAL API
// ===================================================


globalThis.CoreFunctions =
    CoreFunctions;



// ===================================================
// COMMANDS
// ===================================================


function startERP(){

    return CoreFunctions.start();

}



function erpHealth(){

    return CoreFunctions.health();

}



function erpDiag(){

    return CoreFunctions.diagnostics();

}



function erpTest(){

    return CoreFunctions.startupTest();

}



Logger.log(
"CoreFunctions READY v"+
CoreFunctions.version
);