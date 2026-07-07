function testTripUpdateFlow(){


Logger.log(
"===== TRIP UPDATE FLOW ====="
);


// создаём рейс

const trip =
TripRepository.create({

    ClientID:"CLI000014",

    LoadingPoint:
    "Москва",

    UnloadingPoint:
    "Казань",

    Cargo:
    "Техника",

    Revenue:200000,

    ActualCost:120000

});


Logger.log("CREATED:");
Logger.log(JSON.stringify(trip));



// обновляем

const updated =
TripRepository.update(

    trip.TripID,

    {

        ActualCost:140000,

        Status:"COMPLETED"

    }

);


Logger.log("UPDATED:");
Logger.log(JSON.stringify(updated));



// читаем обратно

const loaded =
TripRepository.getById(
    trip.TripID
);


Logger.log("LOADED:");
Logger.log(JSON.stringify(loaded));


Logger.log(
"===== UPDATE COMPLETE ====="
);


}