console.log("SystemInit");



const SystemInit = {



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





    try{





        if(
            typeof SafeCore!=="undefined"
        ){

            SafeCore.init();

        }





        if(
            typeof SchemaManager!=="undefined"
        ){

            SchemaManager.init();

        }





        if(
            typeof Registry!=="undefined"
        ){

            Registry.init();

        }






        if(
            typeof ModuleLoader!=="undefined"
        ){


            ModuleLoader.loadCore();


        }






        if(
            typeof ModuleRegistry!=="undefined"
        ){


            ModuleRegistry.initAll();


        }






        if(
            typeof EventSubscriptions!=="undefined"
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





    }

    catch(error){



        Logger.log(

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

    "WARNING",



    {


        initialized:
        this.initialized,



        dependencies:{


            EventBus:
            typeof EventBus!=="undefined",



            Database:
            typeof Database!=="undefined"



        }


    }



);



}




};





globalThis.SystemInit =
SystemInit;