console.log("AuditEventHandler");

const AuditEventHandler = {

    version: "2.0.0",

    ready: false,

    init() {

        if (this.ready) {
            Logger.log("AuditEventHandler ALREADY READY");
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

            if (!meta.events) {
                return;
            }

            EventBus.subscribe(
                meta.events.created,
                event => this.handle(
                    AuditConstants.ACTION_CREATE,
                    event
                )
            );

            EventBus.subscribe(
                meta.events.updated,
                event => this.handle(
                    AuditConstants.ACTION_UPDATE,
                    event
                )
            );

            EventBus.subscribe(
                meta.events.deleted,
                event => this.handle(
                    AuditConstants.ACTION_DELETE,
                    event
                )
            );

            EventBus.subscribe(
                meta.events.restored,
                event => this.handle(
                    AuditConstants.ACTION_RESTORE,
                    event
                )
            );

            Logger.log(
                "AUDIT REGISTERED ENTITY " +
                meta.entity
            );

        });

    },



    handle(action, event) {

        try {

            const audit = {

                AuditID:
                    IdService.generate("AUDIT"),

                Entity:
                    event.entity ||
                    event.Entity ||
                    "UNKNOWN",

                EntityID:
                    event.id ||
                    event.entityId ||
                    event.EntityID ||
                    "",

                Action: action,

                UserID:
                    (
                        typeof UserSession !== "undefined" &&
                        UserSession.current
                    )
                        ? UserSession.current.UserID
                        : "SYSTEM",

                OrganizationID:
                    (
                        typeof OrganizationContext !== "undefined"
                    )
                        ? OrganizationContext.get()
                        : "",

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
                action +
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

                version: this.version,

                ready: this.ready

            }

        );

    }

};

globalThis.AuditEventHandler = AuditEventHandler;