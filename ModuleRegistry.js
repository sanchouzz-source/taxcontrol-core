console.log("ModuleRegistry");


const ModuleRegistry = {


    modules:{},



    register(name, instance){


        this.modules[name]={

            instance:instance,

            status:"REGISTERED"

        };


        Logger.log(
            "MODULE REGISTERED: "
            + name
        );


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



        if(
            typeof module.instance.init === "function"
        ){

            module.instance.init();

        }



        module.status="READY";


        Logger.log(
            name
            +
            " READY"
        );


    },



    initAll(){


        Object.keys(
            this.modules
        )
        .forEach(name=>{


            this.init(name);


        });


    },



    health(){


        return Object.keys(
            this.modules
        )
        .map(name=>({

            Module:name,

            Status:
            this.modules[name].status

        }));


    }


};



globalThis.ModuleRegistry =
ModuleRegistry;