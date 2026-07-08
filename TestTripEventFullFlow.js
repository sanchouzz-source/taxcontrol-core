function testTripEventFullFlow(){


    Logger.log(
        "===== FULL TRIP EVENT TEST ====="
    );


    installSystem();



    const trip =
        TripRepository.create({

            ClientID:"CLI000014",

            LoadingPoint:"Москва",

            UnloadingPoint:"Вологда",

            Cargo:"Event Cargo",

            Revenue:150000,

            ActualCost:90000,

            Status:"NEW"

        });



    Logger.log(
        "CREATED "
        + trip.TripID
    );



    TripRepository.update(
        trip.TripID,
        {

            Status:"COMPLETED",

            ActualCost:95000

        }
    );



    Logger.log(
        "UPDATED "
        + trip.TripID
    );



    Logger.log(
        "===== TEST COMPLETE ====="
    );

}