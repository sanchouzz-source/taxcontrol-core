console.log("TestEntityLifecycleMatrix");


const TestEntityLifecycleMatrix = {


version:"1.1.0",



run(){


Logger.log(
"========== ENTITY MATRIX START =========="
);



this.boot();



let result={
CLIENT:null,
TRIP:null,
KPI:null
};



try{


result.CLIENT =
this.testClient();


}
catch(e){

Logger.error(
"CLIENT FAILED "
+e.message
);

}



try{


result.TRIP =
this.testTrip(
result.CLIENT
);


}
catch(e){

Logger.error(
"TRIP FAILED "
+e.message
);

}



try{


result.KPI =
this.testKPI();


}
catch(e){

Logger.error(
"KPI FAILED "
+e.message
);

}





Logger.log(
JSON.stringify(
result,
null,
2
)
);



Logger.log(
"========== ENTITY MATRIX COMPLETE =========="
);



return result;


},




boot(){


Logger.log(
"SYSTEM BOOT"
);



if(
typeof Bootstrap!=="undefined"
){


Bootstrap.start();


}



Logger.log(
"ERP SYSTEM READY"
);



},





testClient(){


Logger.log(
"========== TEST CLIENT =========="
);



const client =
EntityService.create(
"CLIENT",
{


Name:
"Matrix Client",


INN:
"7777777777",


Phone:
"+79990000001",


Email:
"matrix@test.ru",


Status:
"ACTIVE"


}
);



Logger.log(
"CREATE OK "
+
JSON.stringify(client)
);




const read =
EntityService.findById(
"CLIENT",
client.ClientID
);



if(!read)
throw new Error(
"CLIENT READ FAILED"
);



Logger.log(
"READ OK"
);




const updated =
EntityService.update(
"CLIENT",
client.ClientID,
{

Status:"UPDATED"

}
);



Logger.log(
"UPDATE OK"
);




EntityService.delete(
"CLIENT",
client.ClientID
);



Logger.log(
"DELETE OK"
);





EntityService.restore(
"CLIENT",
client.ClientID
);



Logger.log(
"RESTORE OK"
);



return client;


},







testTrip(client){


Logger.log(
"========== TEST TRIP =========="
);




const trip =
EntityService.create(
"TRIP",
{


ClientID:
client.ClientID,


Status:
"NEW",


Destination:
"TEST"


}
);





Logger.log(
"TRIP CREATE "
+
trip.TripID
);





const read =
EntityService.findById(
"TRIP",
trip.TripID
);



if(!read)
throw new Error(
"TRIP READ FAILED"
);



EntityService.update(
"TRIP",
trip.TripID,
{

Status:"DONE"

}
);



Logger.log(
"TRIP UPDATE OK"
);




EntityService.delete(
"TRIP",
trip.TripID
);



Logger.log(
"TRIP DELETE OK"
);





EntityService.restore(
"TRIP",
trip.TripID
);



Logger.log(
"TRIP RESTORE OK"
);




return trip;


},







testKPI(){


Logger.log(
"========== TEST KPI =========="
);




const kpi =
EntityService.create(
"KPI",
{


Name:
"Test KPI",


Value:
100,


Category:
"TEST"


}
);



Logger.log(
"KPI CREATE "
+
JSON.stringify(kpi)
);




const read =
EntityService.findById(
"KPI",
kpi.KPIID
);



if(!read)
throw new Error(
"KPI READ FAILED"
);



Logger.log(
"KPI READ OK"
);




return kpi;


}



};




globalThis.TestEntityLifecycleMatrix =
TestEntityLifecycleMatrix;



Logger.log(
"TestEntityLifecycleMatrix READY v1.1.0"
);