console.log("CoreRegistry");



const CoreRegistry = {


    version:"0.1.0",


    loaded:{},


    initialized:false,




    register(name, component){


        if(!component){


            Logger.warn(
                "CORE REGISTER FAILED: "
                +
                name
            );


            return false;

        }



        if(this.loaded[name]){


            Logger.log(

                "CORE ALREADY REGISTERED "
                +
                name

            );


            return false;

        }



        this.loaded[name]=component;



        Logger.log(

            "CORE REGISTERED: "
            +
            name

        );



        return true;


    },






    initAll(){



        Object.keys(
            this.loaded
        )
        .forEach(name=>{


            const component =
                this.loaded[name];



            if(
                typeof component.init==="function"
            ){


                component.init();


            }



        });




        this.initialized=true;




        Logger.log(

            "CORE REGISTRY READY v"
            +
            this.version

        );



    },








    get(name){


        return this.loaded[name];


    },








    health(){


        return HealthContract.create(


            "CoreRegistry",


            this.initialized
            ?
            "OK"
            :
            "WARNING",



            {


                version:this.version,


                coreComponents:
                    Object.keys(
                        this.loaded
                    )



            }



        );

    }



};





globalThis.CoreRegistry =
CoreRegistry;