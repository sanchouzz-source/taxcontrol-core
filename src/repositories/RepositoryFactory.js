const RepositoryFactory = {

    version:"1.1.0",

    repositories: {},


    init() {

        Logger.debug("RepositoryFactory INIT");


        this.register(
            "CLIENT",
            ClientRepository
        );


        this.register(
            "TRIP",
            TripRepository
        );


        this.register(
            "KPI",
            KPIRepository
        );


        Logger.debug(
          "RepositoryFactory READY v1.1.0"
        );
    },


    register(name, repository) {


        if (!repository) {
            throw new Error(
              "Repository missing: " + name
            );
        }


        const required = [
            "create",
            "get",
            "update",
            "delete",
            "exists"
        ];


        required.forEach(method => {

            if (
              typeof repository[method] !== "function"
            ) {

                throw new Error(
                 `Repository ${name} missing method ${method}`
                );

            }

        });


        this.repositories[name] = repository;


        Logger.debug(
          `REGISTERED REPOSITORY: ${name}`
        );

    },


    get(name) {


        if (
          !this.repositories[name]
        ) {

            throw new Error(
              "Repository not registered: "
              + name
            );

        }


        return this.repositories[name];

    },


    has(name){

        return !!this.repositories[name];

    },


    list(){

        return Object.keys(
            this.repositories
        );

    }

};
globalThis.RepositoryFactory =
    RepositoryFactory;


Logger.log(
    "RepositoryFactory GLOBAL REGISTERED v1.1.0"
);