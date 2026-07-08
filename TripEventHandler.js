const TripEventHandler = {


    initialized:false,


    init(){


        if(this.initialized){

            Logger.log(
                "TripEventHandler already initialized"
            );

            return;

        }



        EventBus.on(
            "TRIP_CREATED",
            this.onCreated
        );


        EventBus.on(
            "TRIP_UPDATED",
            this.onUpdated
        );


        EventBus.on(
            "TRIP_COMPLETED",
            this.onCompleted
        );



        this.initialized = true;


        Logger.log(
            "TripEventHandler READY"
        );


        Logger.log(
            JSON.stringify(EventBus.handlers)
        );

    },



    onCreated(trip){

        Logger.log(
            "HANDLER CREATED: "
            + trip.TripID
        );

    },



    onUpdated(trip){

        Logger.log(
            "HANDLER UPDATED: "
            + trip.TripID
        );

    },



    onCompleted(trip){

        Logger.log(
            "HANDLER COMPLETED: "
            + trip.TripID
        );


    }

};



globalThis.TripEventHandler = TripEventHandler;