const TripEventHandler = {


    initialized:false,


    init(){


        if(this.initialized){
            return;
        }


        EventBus.on(
            "TRIP_CREATED",
            function(trip){

                Logger.log(
                    "HANDLER CREATED: "
                    + trip.TripID
                );

            }
        );



        EventBus.on(
            "TRIP_UPDATED",
            function(trip){

                Logger.log(
                    "HANDLER UPDATED: "
                    + trip.TripID
                );

            }
        );



        EventBus.on(
            "TRIP_COMPLETED",
            function(trip){

                Logger.log(
                    "HANDLER COMPLETED: "
                    + trip.TripID
                );


            }
        );


        this.initialized=true;


        Logger.log(
            "TripEventHandler READY"
        );


        Logger.log(
            JSON.stringify(
                Object.keys(EventBus.handlers)
            )
        );

    }

};


globalThis.TripEventHandler =
    TripEventHandler;