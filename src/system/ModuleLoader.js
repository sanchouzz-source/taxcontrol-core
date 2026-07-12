console.log("ModuleLoader");



const ModuleLoader = {



    version:"0.1",



    loaded:[],



    coreModules:[


        "TripEventHandler",


        "FinanceEngine",


        "KPIEngine",


        "DashboardEngine"


    ],







    loadCore(){



        Logger.log(

            "MODULE LOADER START"

        );





        this.coreModules
        .forEach(name=>{





            try{



                const module =
                globalThis[name];






                if(!module){



                    Logger.log(

                        "MODULE NOT FOUND: "
                        +
                        name

                    );



                    return;


                }






                const registered =

                ModuleRegistry.register(

                    name,

                    module

                );








                if(registered){



                    this.loaded.push(name);



                }





            }



            catch(error){



                Logger.log(

                    "MODULE LOAD ERROR: "
                    +
                    name
                    +
                    " "
                    +
                    error.message

                );


            }





        });







        Logger.log(

            "MODULE LOADER COMPLETE"

        );



        return this.loaded;



    },









    getLoaded(){



        return this.loaded;



    },









    health(){



        return HealthContract.create(



            "ModuleLoader",



            "OK",




            {


                version:
                this.version,



                details:{


                    loaded:
                    this.loaded



                }



            }



        );



    }



};





globalThis.ModuleLoader =
ModuleLoader;