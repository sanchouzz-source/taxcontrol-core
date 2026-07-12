console.log("SystemInit");



const SystemInit = {



    version:"0.1.1",



    initialized:false,






    init(){





        if(this.initialized){



            Logger.log(

                "SYSTEM ALREADY INITIALIZED"

            );


            return;


        }






        Logger.log(

            "ERP INIT START"

        );









        // =========================
        // SAFE CORE
        // =========================


        if(
            typeof SafeCore !== "undefined"
        ){


            SafeCore.init();


        }









        // =========================
        // DATABASE
        // =========================


        if(
            typeof SchemaManager !== "undefined"
        ){


            SchemaManager.init();


        }








        // =========================
        // ID REGISTRY
        // =========================


        if(
            typeof Registry !== "undefined"
        ){


            Registry.init();


        }











        // =========================
        // MODULE LOADER
        // =========================


        if(

            typeof ModuleLoader
            !==
            "undefined"

        ){



            ModuleLoader.loadCore();


            ModuleLoader.initAll();



        }

        else{



            Logger.log(

                "ModuleLoader NOT FOUND"

            );


        }









        // =========================
        // EVENT SUBSCRIPTIONS
        // =========================


        if(

            typeof EventSubscriptions
            !==
            "undefined"

        ){



            EventSubscriptions
            .initEventSubscriptions();



            Logger.log(

                "EventSubscriptions READY"

            );


        }









        this.initialized=true;






        Logger.log(

            "ERP INIT COMPLETE"

        );





    },









    health(){



        return HealthContract.create(


            "SystemInit",


            this.initialized
            ?
            "OK"
            :
            "WARNING",



            {


                version:this.version,


                initialized:
                this.initialized,



                dependencies:{



                    Database:
                    typeof Database
                    !==
                    "undefined",



                    EventBus:
                    typeof EventBus
                    !==
                    "undefined",



                    ModuleLoader:
                    typeof ModuleLoader
                    !==
                    "undefined"



                }



            }


        );



    }




};






globalThis.SystemInit =
SystemInit;