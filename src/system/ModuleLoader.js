console.log("ModuleLoader");



const ModuleLoader = {



    version:"0.1.1",



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


            "DashboardEngine"



        ];







        modules.forEach(name=>{



            const module =
                globalThis[name];





            if(module){



                ModuleRegistry.register(

                    name,

                    module

                );



                this.loaded.push(name);



            }

            else{



                Logger.log(

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




    },









    health(){



        return HealthContract.create(


            "ModuleLoader",


            "OK",


            {


                version:this.version,


                loaded:this.loaded,


                initialized:this.initialized



            }


        );



    }




};




globalThis.ModuleLoader =
ModuleLoader;