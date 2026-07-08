function testKPIFlow(){


Logger.log(
"===== KPI FLOW TEST ====="
);


installSystem();



const trip =
TripRepository.create({

ClientID:"CLI000014",

LoadingPoint:"Москва",

UnloadingPoint:"Вологда",

Cargo:"KPI TEST",

Revenue:300000,

ActualCost:180000,

Status:"NEW"

});



TripRepository.update(
trip.TripID,
{
Status:"COMPLETED"
}
);



const kpi =
Database.query(
"KPIMetrics",
{}
);



Logger.log(
JSON.stringify(kpi)
);



Logger.log(
"===== KPI COMPLETE ====="
);


}