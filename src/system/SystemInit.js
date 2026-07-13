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


            // 1. Базовые сервисы


            if(Database){

                Database.init?.();

            }



            if(EventBus){

                EventBus.init?.();

            }




            // 2. Загрузка модулей


            ModuleLoader.loadCore();





            // 3. Запуск модулей


            ModuleRegistry.initAll();





            // 4. Подписки событий


            if(EventSubscriptions){

                EventSubscriptions.initEventSubscriptions();

            }






            this.initialized=true;




            Logger.log(
                "✅ SYSTEM INIT COMPLETE"
            );



        }


        catch(error){


            Logger.error(
                "SYSTEM INIT FAILED: "
                +
                error.message
            );


            throw error;


        }



    },






    health(){



        return HealthContract.create(


            "SystemInit",


            this.initialized
            ?
            "OK"
            :
            "NOT_READY",


            {


                version:this.version,


                initialized:this.initialized,


                dependencies:{


                    Database:
                    !!globalThis.Database,


                    EventBus:
                    !!globalThis.EventBus,


                    ModuleLoader:
                    !!globalThis.ModuleLoader



                }


            }



        );



    }




};



globalThis.SystemInit =
SystemInit;


Logger.log(
"SystemInit READY"
);