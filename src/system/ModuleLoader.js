console.log("ModuleLoader");

if(!globalThis.ModuleLoader){


const ModuleLoader = {




    version:"0.2.0",



    loaded:[],


    loadedMap:{},




    modules:[


        "TripEventHandler",


        "FinanceEngine",


        "KPIEngine",


        "DashboardEngine"


    ],






    loadCore(){



        Logger.log(
            "MODULE LOADER START"
        );





        this.modules.forEach(name=>{



            if(this.loadedMap[name]){


                Logger.log(

                    "MODULE ALREADY LOADED: "
                    +
                    name

                );


                return;


            }






            const module =
                globalThis[name];






            if(!module){



                Logger.warn(

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


                this.loadedMap[name]=true;



                Logger.log(

                    "LOADED: "
                    +
                    name

                );



            }



        });






        Logger.log(

            "MODULE LOADER COMPLETE"

        );




        return this.loaded;


    },









    health(){



        return HealthContract.create(



            "ModuleLoader",



            "OK",



            {


                version:this.version,


                loaded:this.loaded,


                count:
                this.loaded.length



            }



        );



    }






};




globalThis.ModuleLoader =
ModuleLoader;


}





Logger.log(
"ModuleLoader READY"
);