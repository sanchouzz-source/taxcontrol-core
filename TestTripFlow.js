function testTripFlow(){


Logger.log(
"===== TRIP FLOW TEST ====="
);


const trip =
TripRepository.create({

    ClientID:"CLI000014",

    LoadingPoint:
    "Москва",

    UnloadingPoint:
    "Казань",

    Distance:820,

    Cargo:
    "Оборудование",

    Revenue:100000,

    PlannedCost:60000,

    ActualCost:65000

});


Logger.log(
"CREATED:"
);


Logger.log(
JSON.stringify(trip)
);


Logger.log(
"===== TEST COMPLETE ====="
);


}