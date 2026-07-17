const RepositoryFactory = {

    VERSION: "1.2.0",

    _repositories: {},

    _initialized: false,


    init() {

        if (this._initialized) {
            Logger?.debug?.(
                "RepositoryFactory ALREADY READY"
            );
            return;
        }


        Logger?.debug?.(
            "RepositoryFactory INIT"
        );


        this.registerDefaults();


        this.validateContract();


        this._initialized = true;


        Logger?.debug?.(
            "RepositoryFactory READY v1.2.0"
        );
    },


    register(entity, repository) {


        if (!entity) {
            throw new Error(
                "RepositoryFactory: entity required"
            );
        }


        if (!repository) {
            throw new Error(
                "RepositoryFactory: repository required"
            );
        }


        const key = String(entity)
            .toUpperCase();


        if (typeof repository.create !== "function") {

            throw new Error(
                `Repository ${key} missing create`
            );

        }


        if (typeof repository.exists !== "function") {

            throw new Error(
                `Repository ${key} missing exists`
            );

        }



        this._repositories[key] = repository;


        Logger?.debug?.(
            `REPOSITORY REGISTERED ${key}`
        );


    },


    registerDefaults(){


        this.register(
            EntityConstants.CLIENT,
            ClientRepository
        );


        this.register(
            EntityConstants.TRIP,
            TripRepository
        );


        this.register(
            EntityConstants.KPI,
            KPIRepository
        );


    },



    exists(entity){


        const key =
            String(entity)
            .toUpperCase();


        return !!this._repositories[key];

    },



    get(entity){


        const key =
            String(entity)
            .toUpperCase();



        const repository =
            this._repositories[key];



        if (!repository) {

            throw new Error(
                `Repository not registered: ${key}`
            );

        }



        return repository;

    },



    validateContract(){


        Object.keys(this._repositories)
            .forEach(key=>{


                const repo =
                    this._repositories[key];


                const required=[
                    "create",
                    "get",
                    "update",
                    "delete",
                    "exists"
                ];



                required.forEach(method=>{


                    if (
                        typeof repo[method]
                        !== "function"
                    ){

                        throw new Error(
                            `Repository ${key} missing ${method}`
                        );

                    }


                });



            });


        Logger?.debug?.(
            "RepositoryFactory CONTRACT OK"
        );

    },


    list(){

        return Object.keys(
            this._repositories
        );

    }

};