console.log("RepositoryFactory");



const RepositoryFactory = {



version:"1.2.0",



repositories:{},



initialized:false,






init(){



    if(this.initialized){


        Logger.debug(
            "RepositoryFactory ALREADY READY"
        );


        return;


    }






    Logger.debug(
        "RepositoryFactory INIT"
    );






    this.autoRegister();






    this.initialized=true;






    Logger.debug(

        "RepositoryFactory READY v"
        +
        this.version

    );


},







autoRegister(){



    const entities =
        EntityRegistry.list();






    entities.forEach(entity=>{



        const meta =
            EntityRegistry.get(
                entity
            );





        let repository =
            null;






        switch(meta.repository){



            case "ClientRepository":

                repository =
                    globalThis.ClientRepository;

                break;





            case "TripRepository":

                repository =
                    globalThis.TripRepository;

                break;





            case "KPIRepository":

                repository =
                    globalThis.KPIRepository;

                break;





            case "ClientFinanceProfileRepository":

                repository =
                    globalThis.ClientFinanceProfileRepository;

                break;



        }





        if(repository){



            this.register(
                entity,
                repository
            );



        }
        else{


            Logger.debug(

                "NO REPOSITORY FOR "
                +
                entity

            );


        }





    });



},







register(name,repository){





    if(!repository){


        throw new Error(

            "Repository missing: "
            +
            name

        );


    }






    const required=[



        "create",


        "findById",


        "findAll",


        "update",


        "delete",


        "restore",


        "exists"



    ];







    required.forEach(method=>{





        if(
            typeof repository[method]
            !==
            "function"
        ){



            throw new Error(

                "Repository "
                +
                name
                +
                " missing method "
                +
                method

            );


        }




    });







    this.repositories[name]=repository;







    Logger.debug(

        "REGISTERED REPOSITORY: "
        +
        name

    );



},







get(name){





    const repository =
        this.repositories[name];






    if(!repository){



        throw new Error(

            "Repository not registered: "
            +
            name

        );


    }






    return repository;



},







has(name){


    return !!this.repositories[name];


},







list(){



    return Object.keys(
        this.repositories
    );


},







health(){



return HealthContract.create(


    "RepositoryFactory",


    this.initialized
    ?
    "OK"
    :
    "WARNING",



    {


        version:this.version,


        repositories:this.list()



    }


);



}



};








globalThis.RepositoryFactory =
RepositoryFactory;





Logger.log(

"RepositoryFactory GLOBAL REGISTERED v"
+
RepositoryFactory.version

);