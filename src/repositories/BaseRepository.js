console.log("BaseRepository");

const BaseRepository = {

    version: "2.0.0",

    create(
        table,
        data,
        entity,
        permission
    ) {

        SecurityGuard.check(
            permission + "_CREATE"
        );

        if (!data.ID) {
            data.ID =
                IdService.generate(entity);
        }

        data.OrganizationID =
            OrganizationContext.get();

        data.CreatedAt =
            data.CreatedAt ??
            new Date().toISOString();

        data.UpdatedAt =
            data.CreatedAt;

        const result =
            Database.insert(
                table,
                data
            );

        EventBus.emit(
            entity + "_CREATED",
            this.createEvent(
                entity,
                AuditConstants.ACTION_CREATE,
                null,
                result
            )
        );

        return result;

    },



    findById(
        table,
        id,
        entity,
        permission
    ) {

        SecurityGuard.check(
            permission + "_READ"
        );

        return Database.find(
            table,
            id
        );

    },



    findAll(
        table,
        filters = {},
        entity,
        permission
    ) {

        SecurityGuard.check(
            permission + "_READ"
        );

        return Database.query(
            table,
            filters
        );

    },



    update(
        table,
        id,
        data,
        entity,
        permission
    ) {

        SecurityGuard.check(
            permission + "_UPDATE"
        );

        const existing =
            Database.find(
                table,
                id
            );

        if (!existing) {

            throw new Error(
                entity + " not found"
            );

        }

        Versioning.save(
            entity,
            id,
            existing
        );

        const updated = {

            ...existing,

            ...data,

            UpdatedAt:
                new Date().toISOString()

        };

        const result =
            Database.update(
                table,
                id,
                updated
            );

        EventBus.emit(
            entity + "_UPDATED",
            this.createEvent(
                entity,
                AuditConstants.ACTION_UPDATE,
                existing,
                result
            )
        );

        return result;

    },



    delete(
        table,
        id,
        entity,
        permission
    ) {

        SecurityGuard.check(
            permission + "_DELETE"
        );

        const existing =
            Database.find(
                table,
                id
            );

        if (!existing) {

            throw new Error(
                entity + " not found"
            );

        }

        Versioning.save(
            entity,
            id,
            existing
        );

        const result =
            Database.update(
                table,
                id,
                {

                    ...existing,

                    Deleted: true,

                    UpdatedAt:
                        new Date().toISOString()

                }

            );

        EventBus.emit(
            entity + "_DELETED",
            this.createEvent(
                entity,
                AuditConstants.ACTION_DELETE,
                existing,
                result
            )
        );

        return result;

    },



    restore(
        table,
        id,
        entity,
        permission
    ) {

        SecurityGuard.check(
            permission + "_RESTORE"
        );

        const existing =
            Database.find(
                table,
                id
            );

        if (!existing) {

            throw new Error(
                entity + " not found"
            );

        }

        Versioning.save(
            entity,
            id,
            existing
        );

        const result =
            Database.update(
                table,
                id,
                {

                    ...existing,

                    Deleted: false,

                    UpdatedAt:
                        new Date().toISOString()

                }

            );

        EventBus.emit(
            entity + "_RESTORED",
            this.createEvent(
                entity,
                AuditConstants.ACTION_RESTORE,
                existing,
                result
            )
        );

        return result;

    },



    exists(
        table,
        id
    ) {

        return !!Database.find(
            table,
            id
        );

    },



    createEvent(
        entity,
        action,
        before,
        after
    ) {

        return {

            entity,

            entityId:
                this.extractEntityId(after),

            action,

            before,

            after,

            userId:
                (
                    typeof UserSession !== "undefined" &&
                    UserSession.current
                )
                    ? UserSession.current.UserID
                    : "SYSTEM",

            organizationId:
                (
                    typeof OrganizationContext !== "undefined"
                )
                    ? OrganizationContext.get()
                    : "",

            timestamp:
                new Date().toISOString()

        };

    },



    extractEntityId(record) {

        if (!record) {
            return "";
        }

        return (

            record.ID ??

            record.ClientID ??

            record.TripID ??

            record.KPIID ??

            record.InvoiceID ??

            record.DriverID ??

            record.VehicleID ??

            ""

        );

    },



    health() {

        return HealthContract.create(

            "BaseRepository",

            "OK",

            {

                version:
                    this.version

            }

        );

    }

};

globalThis.BaseRepository =
    BaseRepository;

Logger.log(
    "BaseRepository READY v2.0.0"
);