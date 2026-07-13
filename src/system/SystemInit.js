console.log("SystemInit");



const SystemInit = {


    version:"0.2.0",


    initialized:false,



    init(){


        if(this.initialized){

            Logger.warn(
                "System already initialized"
            );

            return;

        }



        Logger.log(
            "ERP INIT START"
        );



        // 1. Database

        this.initDatabase();



        // 2. EventBus

        this.initEventBus();



        // 3. Modules

        this.initModules();



        // 4. Events

        this.initEvents();



        this.initialized=true;



        Logger.log(
            "ERP INIT COMPLETE"
        );


    },




    initDatabase(){


        if(
            typeof Database==="undefined"
        ){

            throw new Error(
                "Database missing"
            );

        }


        Database.init?.();



        Logger.log(
            "Database READY"
        );


    },




    initEventBus(){


        if(
            typeof EventBus==="undefined"
        ){

            throw new Error(
                "EventBus missing"
            );

        }



        EventBus.init?.();



        Logger.log(
            "EventBus READY"
        );


    },





    initModules(){



        ModuleLoader.loadCore();



        ModuleRegistry.initAll();



    },





    initEvents(){



        if(
            EventSubscriptions
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