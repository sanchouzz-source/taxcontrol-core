console.log("ModuleRegistry");


const ModuleRegistry = {


    modules:{},


    register(name, instance){


        if(!name || !instance){

            Logger.log(
                "MODULE REGISTER FAILED: INVALID DATA"
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


            registeredAt:
            new Date().toISOString(),


            error:null


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


            return false;

        }




        if(module.status==="READY"){


            Logger.log(

                name
                +
                " ALREADY READY"

            );


            return true;

        }





        try{


            module.status="INITIALIZING";



            if(

                typeof module.instance.init
                ===
                "function"

            ){


                module.instance.init();


            }



            module.status="READY";



            Logger.log(

                name
                +
                " READY"

            );


            return true;



        }

        catch(error){



            module.status="FAILED";


            module.error =
            error.message;



            Logger.log(

                "MODULE FAILED: "
                +
                name
                +
                " "
                +
                error.message

            );



            return false;


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


        return this.modules[name] || null;


    },





    health(){



        return {


            status:"OK",


            module:"ModuleRegistry",


            version:"0.1",


            details:


            Object.keys(this.modules)
            .map(name=>({


                Module:name,


                Status:
                this.modules[name].status,


                Error:
                this.modules[name].error


            }))



        };


    }



};




globalThis.ModuleRegistry =
ModuleRegistry;