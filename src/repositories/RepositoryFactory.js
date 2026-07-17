console.log("RepositoryFactory");

const RepositoryFactory = {

    version: "1.0.0",

    ready: false,

    repositories: {},

    aliases: {

        CLIENT: "ClientRepository",
        TRIP: "TripRepository",
        KPI: "KPIRepository"

    },



    init() {

        if (this.ready) {

            Logger.log(
                "RepositoryFactory ALREADY READY"
            );

            return;

        }

        Logger.log(
            "RepositoryFactory INIT"
        );

        this.registerAll();

        this.ready = true;

        Logger.log(
            "RepositoryFactory READY v" +
            this.version
        );

    },



    registerAll() {

        Object.entries(this.aliases)
            .forEach(([entity, repositoryName]) => {

                const repository =
                    globalThis[repositoryName];

                if (!repository) {

                    Logger.log(
                        "Repository NOT FOUND: " +
                        repositoryName
                    );

                    return;

                }

                this.validate(repositoryName, repository);

                this.repositories[entity] =
                    repository;

                Logger.log(
                    "REPOSITORY REGISTERED: " +
                    entity +
                    " -> " +
                    repositoryName
                );

            });

    },



    validate(name, repository) {

        const required = [

            "create",
            "findById",
            "findAll",
            "update",
            "delete",
            "restore",
            "exists"

        ];

        required.forEach(method => {

            if (typeof repository[method] !== "function") {

                throw new Error(

                    "Repository " +
                    name +
                    " missing method " +
                    method

                );

            }

        });

        Logger.log(
            "REPOSITORY CONTRACT OK: " +
            name
        );

    },



    get(entity) {

        const repository =
            this.repositories[entity];

        if (!repository) {

            throw new Error(

                "Repository not registered: " +
                entity

            );

        }

        return repository;

    },



    has(entity) {

        return !!this.repositories[entity];

    },



    register(entity, repository) {

        this.validate(entity, repository);

        this.repositories[entity] =
            repository;

        Logger.log(
            "REPOSITORY ADDED: " +
            entity
        );

    },



    unregister(entity) {

        delete this.repositories[entity];

        Logger.log(
            "REPOSITORY REMOVED: " +
            entity
        );

    },



    list() {

        return Object.keys(
            this.repositories
        );

    },



    health() {

        return HealthContract.create(

            "RepositoryFactory",

            this.ready
                ? "OK"
                : "NOT_READY",

            {

                version: this.version,

                repositories:
                    Object.keys(
                        this.repositories
                    ).length

            }

        );

    }

};

globalThis.RepositoryFactory =
    RepositoryFactory;

Logger.log(
    "RepositoryFactory READY v1.0.0"
);