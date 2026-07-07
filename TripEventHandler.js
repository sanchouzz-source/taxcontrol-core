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
        "TripEventHandler READY"
    );

},



onCreated(trip){

    Logger.log(
        "TRIP CREATED RECEIVED: "
        + trip.TripID
    );

},



onUpdated(trip){

    Logger.log(
        "TRIP UPDATED RECEIVED: "
        + trip.TripID
    );

},



onCompleted(trip){

    Logger.log(
        "TRIP COMPLETED RECEIVED: "
        + trip.TripID
    );

}


};


globalThis.TripEventHandler =
TripEventHandler;