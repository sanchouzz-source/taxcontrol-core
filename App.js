console.log("App");


/**
 * ============================================================
 * App v3.1.0
 *
 * TaxControl ERP Application Facade
 *
 * Application lifecycle controller
 *
 * ============================================================
 */


const App = {


    version:"3.1.0",

    apiVersion:"3.0",

    name:"TaxControl ERP",

    platform:"Google Apps Script",


    state:{

        started:false,

        starting:false,

        startedAt:null,

        lastError:null

    },





    // ============================================================
    // INIT
    // ============================================================

    init(){


        Logger.log(
            "APP INIT"
        );


        if(
            typeof CoreFunctions==="undefined"
        ){

            throw new Error(
                "CoreFunctions not loaded"
            );

        }


        return true;


    },







    // ============================================================
    // START ERP
    // ============================================================


    async start(){


        this.init();



        if(this.state.started){

            Logger.warn(
                "ERP already started"
            );

            return {

                status:"ALREADY_STARTED",

                startedAt:
                this.state.startedAt

            };

        }



        if(this.state.starting){

            throw new Error(
                "ERP startup already running"
            );

        }




        try{


            this.state.starting=true;



            Logger.log(
                "========== ERP BOOT START =========="
            );



            const result =
                await CoreFunctions.start();



            this.state.started=true;

            this.state.starting=false;

            this.state.startedAt =
                new Date();



            Logger.log(
                "========== ERP BOOT COMPLETE =========="
            );



            return {

                status:"READY",

                result,

                startedAt:
                this.state.startedAt

            };


        }
        catch(e){


            this.state.starting=false;

            this.state.lastError =
                e.message;



            Logger.error(
                "ERP START FAILED "
                +e.message
            );


            throw e;


        }



    },








    // ============================================================
    // HEALTH
    // ============================================================


    health(){


        try{


            const modules={};



            if(
                typeof CoreFunctions!=="undefined"
            ){

                modules.core =
                    CoreFunctions.health();

            }



            if(
                typeof RepositoryFactory!=="undefined"
            ){

                modules.repositories =
                    RepositoryFactory.health();

            }



            if(
                typeof SchemaRegistry!=="undefined"
            ){

                modules.schema =
                    SchemaRegistry.health();

            }



            return {


                module:"App",

                version:this.version,

                status:
                this.state.started
                ?"OK"
                :"WARNING",


                state:this.state,


                modules,


                timestamp:
                new Date().toISOString()


            };


        }
        catch(e){


            return {


                module:"App",

                status:"ERROR",

                error:e.message,


                timestamp:
                new Date().toISOString()


            };


        }



    },







    // ============================================================
    // DIAGNOSTICS
    // ============================================================


    diagnostics(){


        return {


            application:this.name,

            version:this.version,


            state:this.state,


            core:
            typeof CoreFunctions!=="undefined"
            ?
            CoreFunctions.diagnostics?.()
            :
            null,



            repositories:
            typeof RepositoryFactory!=="undefined"
            ?
            RepositoryFactory.diagnostics()
            :
            null,



            schema:
            typeof SchemaRegistry!=="undefined"
            ?
            SchemaRegistry.diagnostics()
            :
            null,


            timestamp:
            new Date().toISOString()


        };


    },








    // ============================================================
    // RESET DEVELOPMENT
    // ============================================================


    reset(){


        Logger.warn(
            "ERP RESET START"
        );



        try{



            this.state={

                started:false,

                starting:false,

                startedAt:null,

                lastError:null

            };





            // глобальное состояние

            globalThis.__ERP_STATE__={

                started:false,

                starting:false,

                startedAt:null

            };







            // SystemInit

            if(
                typeof SystemInit!=="undefined"
            ){

                SystemInit.initialized=false;

                SystemInit.started={};

                SystemInit.bootLog=[];

            }








            // SchemaRegistry

            if(
                typeof SchemaRegistry!=="undefined"
            ){

                SchemaRegistry.reinitialize?.();

            }







            // SchemaManager

            if(
                typeof SchemaManager!=="undefined"
            ){

                SchemaManager.initialized=false;

                SchemaManager.schema={};

            }







            // RepositoryFactory

            if(
                typeof RepositoryFactory!=="undefined"
            ){

                RepositoryFactory.reset?.();

            }







            // RepositoryRegistry

            if(
                typeof RepositoryRegistry!=="undefined"
                &&
                RepositoryRegistry.reset
            ){

                RepositoryRegistry.reset();

            }







            // Database

            if(
                typeof Database!=="undefined"
            ){

                Database.initialized=false;

            }








            // EventBus

            if(
                typeof EventBus!=="undefined"
            ){

                EventBus.handlers={};

            }







            // Modules

            if(
                typeof ModuleRegistry!=="undefined"
                &&
                ModuleRegistry.reset
            ){

                ModuleRegistry.reset();

            }





            Logger.log(
                "ERP RESET COMPLETE"
            );



            return {


                status:"OK",

                message:
                "ERP reset completed"


            };



        }
        catch(e){


            Logger.error(
                "ERP RESET FAILED "
                +e.message
            );



            return {

                status:"ERROR",

                error:e.message

            };


        }



    },








    // ============================================================
    // INFO
    // ============================================================


    info(){


        return {


            application:this.name,


            version:this.version,


            apiVersion:this.apiVersion,


            platform:this.platform,


            architecture:
            [
                "SystemInit",
                "CoreFunctions",
                "SchemaRegistry",
                "RepositoryFactory",
                "ModuleRegistry"
            ],


            timestamp:
            new Date().toISOString()


        };


    }


};









// ============================================================
// GLOBAL COMMAND API
// ============================================================



async function erpStart(){

    return App.start();

}





function erpHealth(){

    return App.health();

}





function erpDiag(){

    return App.diagnostics();

}





function erpReset(){

    return App.reset();

}





function erpInfo(){

    return App.info();

}







globalThis.App=App;




Logger.log(
    "App READY v"+App.version
);