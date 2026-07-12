console.log("EventSubscriptions");

const EventSubscriptions = {

    initialized: false,

    initEventSubscriptions() {

        if (this.initialized) {

            Logger.log(
                "EventSubscriptions ALREADY INITIALIZED"
            );

            return;

        }

        Logger.log(
            "Registering EventSubscriptions..."
        );

        // ==========================
        // CLIENTS
        // ==========================

        EventBus.on("CLIENT_CREATED", () => {

            DashboardEngine.refresh();

        });

        EventBus.on("CLIENT_UPDATED", () => {

            DashboardEngine.refresh();

        });

        // ==========================
        // TRIPS
        // ==========================

        EventBus.on("TRIP_CREATED", () => {

            DashboardEngine.refresh();

        });

        EventBus.on("TRIP_UPDATED", () => {

            DashboardEngine.refresh();

        });

        this.initialized = true;

        Logger.log(
            "EventSubscriptions READY"
        );

    },

    health() {

        return HealthContract.create(
            "EventSubscriptions",
            this.initialized
                ? "OK"
                : "WARNING",
            {
                initialized: this.initialized,
                subscriptions: 4,
                dependencies: {
                    EventBus: true,
                    DashboardEngine: true
                }
            }
        );

    }

};

globalThis.EventSubscriptions =
    EventSubscriptions;