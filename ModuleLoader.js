console.log("ModuleLoader");


const ModuleLoader = {


    loadCore(){


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


                Registry.register(
                    name,
                    module
                );


            }


        });


    },



    initAll(){


        Object.keys(
            Registry.modules
        )
        .forEach(name=>{


            Registry.initialize(
                name
            );


        });


    }


};



globalThis.ModuleLoader =
ModuleLoader;