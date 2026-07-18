console.log("AuditEventHandler");

const AuditEventHandler = {

    version: "2.0.0",

    ready: false,

    init() {

        if (this.ready) {

            Logger.log(
                "AuditEventHandler ALREADY READY"
            );

            return;

        }

        this.subscribe();

        this.ready = true;

        Logger.log(
            "AuditEventHandler READY v" +
            this.version
        );

    },



    subscribe() {

        Object.values(EntityRegistry).forEach(meta => {

            if (!meta || !meta.events) {
                return;
            }

            if (meta.events.created) {

                EventBus.subscribe(
                    meta.events.created,
                    event => this.handle(
                        AuditConstants.ACTIONS.CREATE,
                        event
                    )
                );

            }

            if (meta.events.updated) {

                EventBus.subscribe(
                    meta.events.updated,
                    event => this.handle(
                        AuditConstants.ACTIONS.UPDATE,
                        event
                    )
                );

            }

            if (meta.events.deleted) {

                EventBus.subscribe(
                    meta.events.deleted,
                    event => this.handle(
                        AuditConstants.ACTIONS.DELETE,
                        event
                    )
                );

            }

            if (meta.events.restored) {

                EventBus.subscribe(
                    meta.events.restored,
                    event => this.handle(
                        AuditConstants.ACTIONS.RESTORE,
                        event
                    )
                );

            }

            Logger.log(
                "AUDIT REGISTERED ENTITY " +
                meta.entity
            );

        });

    },



    handle(action, event) {

        try {

            if (!event) {

                Logger.log(
                    "AUDIT EMPTY EVENT"
                );

                return;

            }

            const audit = {

                AuditID:
                    IdService.generate("AUDIT"),

                OrganizationID:
                    (
                        typeof OrganizationContext !== "undefined"
                    )
                        ? OrganizationContext.get()
                        : "",

                Entity:
                    event.entity ??
                    event.Entity ??
                    "UNKNOWN",

                EntityID:
                    event.entityId ??
                    event.EntityID ??
                    event.id ??
                    "",

                Action:
                    action,

                UserID:
                    (
                        typeof UserSession !== "undefined" &&
                        UserSession.current
                    )
                        ? UserSession.current.UserID
                        : "SYSTEM",

                CreatedAt:
                    new Date().toISOString(),

                Before:
                    event.before ?? null,

                After:
                    event.after ??
                    event.data ??
                    null

            };

            AuditLog.write(audit);

            Logger.log(

                "AUDIT " +

                audit.Action +

                " " +

                audit.Entity +

                " " +

                audit.EntityID

            );

        }
        catch (e) {

            Logger.log(

                "AUDIT ERROR: " +

                e.message

            );

        }

    },



    health() {

        return HealthContract.create(

            "AuditEventHandler",

            this.ready
                ? "OK"
                : "NOT_READY",

            {

                version:
                    this.version,

                ready:
                    this.ready,

                entities:
                    Object.keys(EntityRegistry).length

            }

        );

    }

};

globalThis.AuditEventHandler = AuditEventHandler;