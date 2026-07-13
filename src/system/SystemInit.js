console.log("SystemInit");


const SystemInit = {


    version:"0.2.1",


    initialized:false,



    init(){


        if(this.initialized){

            Logger.log(
                "SYSTEM ALREADY INITIALIZED"
            );

            return;

        }



        Logger.log(
            "🚀 SYSTEM INIT START"
        );



        try{


            this.initCore();


            this.initModules();


            this.initEvents();



            this.initialized=true;



            Logger.log(
                "✅ SYSTEM INIT COMPLETE"
            );


        }
        catch(error){


            Logger.error(
                "SYSTEM INIT FAILED "
                +
                error.message
            );


            throw error;

        }


    },




    initCore(){


        Logger.log(
            "CORE SERVICES INIT"
        );



        Database.init?.();


        EventBus.init?.();



        Logger.log(
            "CORE SERVICES READY"
        );


    },





    initModules(){


        Logger.log(
            "MODULE INITIALIZATION START"
        );



        ModuleLoader.loadCore();



        ModuleRegistry.initAll();



        Logger.log(
            "MODULE INITIALIZATION COMPLETE"
        );


    },





    initEvents(){


        if(
            typeof EventSubscriptions !== "undefined"
        ){


            EventSubscriptions.init();


        }


    },





    health(){


        return {


            status:
            this.initialized
            ?
            "OK"
            :
            "NOT_READY",


            module:
            "SystemInit",


            version:
            this.version,


            dependencies:{


                Database:
                !!Database,


                EventBus:
                !!EventBus,


                ModuleLoader:
                !!ModuleLoader


            }


        };


    }


};



globalThis.SystemInit =
SystemInit;



Logger.log(
"SystemInit READY"
);