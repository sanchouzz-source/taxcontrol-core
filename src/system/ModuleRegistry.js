console.log("ModuleRegistry");


const ModuleRegistry = {


    version:"0.1.1",


    modules:{},



    register(name, instance){


        if(!name || !instance){


            Logger.log(
                "MODULE REGISTER FAILED: "
                + name
            );


            return false;

        }



        if(this.modules[name]){


            Logger.log(

                "MODULE ALREADY REGISTERED: "
                + name

            );


            return false;

        }




        this.modules[name]={


            instance:instance,


            status:"REGISTERED",


            error:null,


            initialized:false



        };



        Logger.log(

            "MODULE REGISTERED: "
            + name

        );



        return true;


    },






    init(name){



        const module =
            this.modules[name];




        if(!module){


            Logger.log(

                "MODULE NOT FOUND: "
                + name

            );


            return;


        }





        if(module.initialized){


            Logger.log(

                name
                +
                " ALREADY INITIALIZED"

            );


            return;


        }






        try{



            if(

                typeof module.instance.init
                ===
                "function"

            ){



                module.instance.init();



            }





            module.status="READY";


            module.initialized=true;


            module.error=null;




            Logger.log(

                name
                +
                " READY"

            );



        }


        catch(error){



            module.status="ERROR";


            module.error =
                error.message;



            Logger.log(

                name
                +
                " ERROR: "
                +
                error.message

            );


        }



    },







    initAll(){



        Object.keys(
            this.modules
        )
        .forEach(name=>{


            this.init(name);


        });



    },









    get(name){


        return this.modules[name];

    },








    health(){



        return HealthContract.create(


            "ModuleRegistry",


            "OK",


            {


                version:this.version,


                modules:

                    Object.keys(
                        this.modules
                    )
                    .map(name=>({



                        Module:name,


                        Status:
                        this.modules[name].status,


                        Error:
                        this.modules[name].error



                    }))



            }



        );


    }




};




globalThis.ModuleRegistry =
ModuleRegistry;