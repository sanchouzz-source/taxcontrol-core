console.log("ModuleRegistry");



const ModuleRegistry = {


    version:"0.4.0",


    modules:{},



    initialized:false,





    register(name,module){



        if(!module){


            Logger.warn(

                "MODULE REGISTER FAILED "
                +
                name

            );


            return false;

        }





        if(this.modules[name]){


            Logger.log(

                "MODULE ALREADY REGISTERED "
                +
                name

            );


            return false;

        }





        this.modules[name]=module;



        Logger.log(

            "MODULE REGISTERED: "
            +
            name

        );



        return true;


    },







    initAll(){



        Object.keys(
            this.modules
        )
        .forEach(name=>{



            const module =
                this.modules[name];



            if(
                typeof module.init==="function"
            ){


                try{


                    module.init();



                }
                catch(e){


                    Logger.error(

                        "MODULE INIT ERROR "
                        +
                        name
                        +
                        " "
                        +
                        e.message

                    );


                }



            }



        });




        this.initialized=true;



        Logger.log(

            "MODULE REGISTRY READY v"
            +
            this.version

        );



    },







    get(name){


        return this.modules[name];


    },








    health(){



        return HealthContract.create(


            "ModuleRegistry",


            this.initialized
            ?
            "OK"
            :
            "WARNING",




            {


                version:this.version,


                modules:
                    Object.keys(
                        this.modules
                    )



            }



        );



    }



};




globalThis.ModuleRegistry =
ModuleRegistry;