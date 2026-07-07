const TripEventHandler = {


    init(){

        EventBus.subscribe(
            "TRIP_CREATED",
            this.onCreated
        );


        EventBus.subscribe(
            "TRIP_UPDATED",
            this.onUpdated
        );


        EventBus.subscribe(
            "TRIP_COMPLETED",
            this.onCompleted
        );


        Logger.log(
            "TripEventHandler initialized"
        );

    },


    onCreated(trip){

        Logger.log(
            "TRIP CREATED EVENT: "
            + trip.TripID
        );

    },


    onUpdated(trip){

        Logger.log(
            "TRIP UPDATED EVENT: "
            + trip.TripID
        );

    },


    onCompleted(trip){

        Logger.log(
            "TRIP COMPLETED EVENT: "
            + trip.TripID
        );


        FinanceEngine.processTrip(
            trip
        );

    }

};


globalThis.TripEventHandler =
TripEventHandler;