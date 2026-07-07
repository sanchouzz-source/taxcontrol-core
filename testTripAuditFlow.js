function testTripAuditFlow(){


Logger.log(
"===== TRIP AUDIT FLOW ====="
);


const trip =
TripRepository.create({

    ClientID:"CLI000014",

    LoadingPoint:"Москва",

    UnloadingPoint:"Санкт-Петербург",

    Cargo:"Audit Test",

    Revenue:50000,

    ActualCost:30000,

    Status:"NEW"

});


Logger.log(
"CREATED:"
);

Logger.log(
JSON.stringify(trip)
);



const updated =
TripRepository.update(

    trip.TripID,

    {

        ActualCost:35000,

        Status:"COMPLETED"

    }

);


Logger.log(
"UPDATED:"
);

Logger.log(
JSON.stringify(updated)
);



Logger.log(
"===== AUDIT COMPLETE ====="
);

}