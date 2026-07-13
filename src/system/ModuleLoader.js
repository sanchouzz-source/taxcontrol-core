console.log("ModuleLoader");


const ModuleLoader = {


    version:"0.4.0",


    loaded:[],


    initialized:false,



    loadCore(){


        Logger.log(
            "MODULE LOADER START"
        );



        const modules=[


            "TripEventHandler",

            "FinanceEngine",

            "KPIEngine",

            "DashboardEngine",
            "ClientEventHandler"


        ];



        modules.forEach(name=>{


            const module =
                globalThis[name];



            if(module){


                const registered =
                    ModuleRegistry.register(
                        name,
                        module
                    );



                if(registered){


                    this.loaded.push(
                        name
                    );



                    Logger.log(

                        "LOADED "
                        +
                        name

                    );


                }


            }

            else{


                Logger.warn(

                    "MODULE NOT FOUND: "
                    +
                    name

                );


            }



        });



        Logger.log(

            "MODULE LOADER COMPLETE"

        );



    },






    initAll(){



        if(this.initialized){


            Logger.log(

                "MODULES ALREADY INITIALIZED"

            );


            return;


        }




        ModuleRegistry.initAll();



        this.initialized=true;



        Logger.log(

            "MODULE LOADER READY"

        );



    },






    health(){



        return HealthContract.create(


            "ModuleLoader",


            this.initialized
            ?
            "OK"
            :
            "WARNING",



            {

                version:this.version,


                loaded:this.loaded,


                initialized:
                    this.initialized


            }


        );



    }



};




globalThis.ModuleLoader =
ModuleLoader;