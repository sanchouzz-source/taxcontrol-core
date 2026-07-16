console.log("RepositoryFactory");


const RepositoryFactory = {


    version:"0.1.0",


    repositories:{},



    register(
        name,
        repository
    ){


        if(
            !repository
        ){

            throw new Error(
                "Repository missing: "
                +
                name
            );

        }



        this.repositories[name]=repository;



        Logger.log(
            "REPOSITORY REGISTERED: "
            +
            name
        );


    },





    get(name){


        const repo =
            this.repositories[name];



        if(!repo){


            throw new Error(

                "Repository not found: "
                +
                name

            );


        }


        return repo;


    },






    init(){


        Logger.log(
            "RepositoryFactory READY v"
            +
            this.version
        );


    },







    health(){


        return HealthContract.create(

            "RepositoryFactory",

            "OK",

            {

                version:this.version,

                repositories:
                    Object.keys(
                        this.repositories
                    )


            }

        );


    }



};




globalThis.RepositoryFactory =
RepositoryFactory;