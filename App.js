console.log("App");


/**
 * ============================================================
 * App v3.0.0
 *
 * TaxControl ERP Application Facade
 *
 * Единственная точка управления приложением
 * ============================================================
 */


const App = {


    version:"3.0.0",


    name:"TaxControl ERP",



    platform:"Google Apps Script",




    /**
     * Проверка готовности ядра
     */

    init(){


        Logger.log(
            "ERP APP INIT"
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





    /**
     * Полный запуск ERP
     *
     * Главная команда:
     *
     * erpStart()
     */

    async start(){


        this.init();



        Logger.log(
            "========== ERP START REQUEST =========="
        );



        const result =
            await CoreFunctions.start();



        Logger.log(
            "========== ERP START COMPLETE =========="
        );



        return result;


    },





    /**
     * Проверка состояния
     *
     * НЕ запускает систему
     */

    health(){


        Logger.log(
            "========== ERP HEALTH =========="
        );



        try{


            if(
                typeof CoreFunctions!=="undefined"
            ){

                return CoreFunctions.health();

            }



            return {

                status:"WARNING",

                message:
                "CoreFunctions unavailable"

            };


        }
        catch(e){


            return {

                status:"ERROR",

                module:"App",

                error:e.message,

                timestamp:
                new Date().toISOString()

            };


        }

    },





    /**
     * Полная диагностика
     */

    diagnostics(){


        try{


            if(
                typeof CoreFunctions!=="undefined"
            ){

                return CoreFunctions.diagnostics();

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







    /**
     * Полный сброс ERP
     *
     * Только разработка
     */

    reset(){


        Logger.warn(
            "ERP RESET START"
        );



        try{


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




            // Registry

            if(
                typeof SchemaRegistry!=="undefined"
            ){

                SchemaRegistry.reinitialize?.();

            }




            // Schema

            if(
                typeof SchemaManager!=="undefined"
            ){

                SchemaManager.initialized=false;

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
                "ERP RESET FAILED "+
                e.message
            );


            return {

                status:"ERROR",

                error:e.message

            };

        }

    },







    /**
     * Информация о приложении
     */

    info(){


        return {


            application:
            this.name,


            version:
            this.version,


            platform:
            this.platform,


            architecture:
            "SystemInit + CoreFunctions + ModuleRegistry",


            timestamp:
            new Date().toISOString()


        };


    }


};





// ==================================================
// GLOBAL COMMAND API
// ==================================================



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