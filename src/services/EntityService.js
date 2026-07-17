console.log("EntityService");

const EntityService = {

    version: "2.0.0",

    create(entity, data) {

        const meta = this.getMetadata(entity);

        SecurityGuard.check(
            meta.permissions.create
        );

        return RepositoryFactory
            .get(entity)
            .create(data);

    },



    findById(entity, id) {

        const meta = this.getMetadata(entity);

        SecurityGuard.check(
            meta.permissions.read
        );

        return RepositoryFactory
            .get(entity)
            .findById(id);

    },



    findAll(entity, filters = {}) {

        const meta = this.getMetadata(entity);

        SecurityGuard.check(
            meta.permissions.read
        );

        return RepositoryFactory
            .get(entity)
            .findAll(filters);

    },



    update(entity, id, data) {

        const meta = this.getMetadata(entity);

        SecurityGuard.check(
            meta.permissions.update
        );

        return RepositoryFactory
            .get(entity)
            .update(id, data);

    },



    delete(entity, id) {

        const meta = this.getMetadata(entity);

        SecurityGuard.check(
            meta.permissions.delete
        );

        return RepositoryFactory
            .get(entity)
            .delete(id);

    },



    restore(entity, id) {

        const meta = this.getMetadata(entity);

        SecurityGuard.check(
            meta.permissions.restore
        );

        return RepositoryFactory
            .get(entity)
            .restore(id);

    },



    exists(entity, id) {

        return RepositoryFactory
            .get(entity)
            .exists(id);

    },



    repository(entity) {

        return RepositoryFactory.get(entity);

    },



    getMetadata(entity) {

        const meta = EntityRegistry[entity];

        if (!meta) {

            throw new Error(
                "Unknown entity: " + entity
            );

        }

        return meta;

    },



    health() {

        return HealthContract.create(

            "EntityService",

            "OK",

            {

                version: this.version

            }

        );

    }

};

globalThis.EntityService =
    EntityService;

Logger.log(
    "EntityService READY v2.0.0"
);