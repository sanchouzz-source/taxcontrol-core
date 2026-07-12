console.log("EventSubscriptions");

const EventSubscriptions = {

    initialized:false,

    init(){

        if(this.initialized){
            return;
        }

        // Клиенты

        EventBus.on("CLIENT_CREATED", function () {
            DashboardEngine.refresh();
        });

        EventBus.on("CLIENT_UPDATED", function () {
            DashboardEngine.refresh();
        });

        // Поездки

        EventBus.on("TRIP_CREATED", function () {
            DashboardEngine.refresh();
        });

        EventBus.on("TRIP_UPDATED", function () {
            DashboardEngine.refresh();
        });

        this.initialized = true;

        Logger.log("EventSubscriptions READY");
    },

    health(){

        return HealthContract.create(
            "EventSubscriptions",
            this.initialized ? "OK" : "WARNING",
            {
                initialized:this.initialized,
                dependencies:{
                    EventBus:true
                }
            }
        );

    }

};

globalThis.EventSubscriptions = EventSubscriptions;