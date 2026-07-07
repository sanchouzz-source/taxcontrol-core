function testTripEventFlow(){

Logger.log(
"===== TRIP EVENT FLOW ====="
);


const trip =
TripRepository.create({

ClientID:"CLI000014",

LoadingPoint:"Москва",

UnloadingPoint:"Казань",

Cargo:"Event Test",

Revenue:100000,

ActualCost:60000,

Status:"NEW"

});


TripRepository.update(
trip.TripID,
{
Status:"COMPLETED",
ActualCost:65000
}
);


Logger.log(
"===== EVENT COMPLETE ====="
);

}