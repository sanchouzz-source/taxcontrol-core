console.log("EventSubscriptions");

const EventSubscriptions = {

    initialized: false,

    init() {

        if (this.initialized) {
            return;
        }

        if (typeof EventBus === "undefined") {
            throw new Error("EventBus not found");
        }

        // ==========================
        // CLIENTS
        // ==========================

        EventBus.on("CLIENT_CREATED", () => {
            DashboardEngine.render(true);
        });

        EventBus.on("CLIENT_UPDATED", () => {
            DashboardEngine.render(true);
        });

        // ==========================
        // TRIPS
        // ==========================

        EventBus.on("TRIP_CREATED", () => {
            DashboardEngine.render(true);
        });

        EventBus.on("TRIP_UPDATED", () => {
            DashboardEngine.render(true);
        });

        this.initialized = true;

        Logger.log("EventSubscriptions READY");
    },

    health() {

        return HealthContract.create(
            "EventSubscriptions",
            this.initialized ? "OK" : "WARNING",
            {
                initialized: this.initialized
            }
        );

    }

};

globalThis.EventSubscriptions = EventSubscriptions;