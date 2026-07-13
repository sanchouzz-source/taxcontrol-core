console.log("ModuleRegistry");


if(!globalThis.ModuleRegistry){


const ModuleRegistry = {


    version:"0.2.0",


    modules:{},



    order:[

        "TripEventHandler",

        "FinanceEngine",

        "KPIEngine",

        "DashboardEngine"

    ],




    register(name, instance){



        if(!name || !instance){


            Logger.error(
                "MODULE REGISTER FAILED: "
                + name
            );


            return false;


        }




        if(this.modules[name]){


            Logger.warn(

                "MODULE ALREADY REGISTERED: "
                + name

            );


            return false;


        }




        this.modules[name]={


            instance:instance,


            status:"REGISTERED",


            initialized:false,


            error:null,


            startedAt:null



        };





        Logger.log(

            "MODULE REGISTERED: "
            +
            name

        );



        return true;


    },







    init(name){



        const module =
            this.modules[name];



        if(!module){


            Logger.error(

                "MODULE NOT FOUND: "
                +
                name

            );


            return false;


        }





        if(module.initialized){



            Logger.log(

                name
                +
                " ALREADY READY"

            );



            return true;


        }





        try{



            Logger.log(

                "START MODULE: "
                +
                name

            );





            if(
                typeof module.instance.init
                ===
                "function"
            ){



                module.instance.init();



            }




            module.status="READY";


            module.initialized=true;


            module.startedAt=
                new Date()
                .toISOString();



            Logger.log(

                name
                +
                " READY"

            );



            return true;



        }



        catch(error){



            module.status="ERROR";


            module.error=
                error.message;



            Logger.error(

                name
                +
                " FAILED: "
                +
                error.message

            );



            return false;


        }



    },







    initAll(){



        Logger.log(
            "MODULE REGISTRY INIT START"
        );



        this.order.forEach(name=>{


            if(this.modules[name]){


                this.init(name);


            }


        });




        Logger.log(
            "MODULE REGISTRY INIT COMPLETE"
        );


    },








    get(name){


        return (
            this.modules[name]
            ||
            null
        );


    },






    getModules(){


        return this.modules;


    },








    health(){



        const list =

            Object.keys(
                this.modules
            )
            .map(name=>({


                Module:name,


                Status:
                this.modules[name].status,


                Error:
                this.modules[name].error



            }));





        const hasError =

            list.some(
                m =>
                m.Status==="ERROR"
            );






        return HealthContract.create(


            "ModuleRegistry",


            hasError
            ?
            "WARNING"
            :
            "OK",



            {


                version:this.version,


                modules:list



            }


        );



    },









    reset(){



        this.modules={};



        Logger.log(

            "MODULE REGISTRY RESET"

        );



    }



};


globalThis.ModuleRegistry =
ModuleRegistry;


}