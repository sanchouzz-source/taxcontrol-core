function testEventReliability(){

Logger.info(
"===== EVENT RELIABILITY TEST START ====="
);


const id =
"TO-TEST-" + Date.now();


const event =
ERPEventContract.create({

entity:"TRANSPORT_ORDER",

type:"CREATED",

entityId:id,


after:{

TransportOrderID:id,

ClientID:"CLIENT-TEST-001",

Status:"NEW",

Amount:15000,

Currency:"RUB",

CreatedAt:new Date().toISOString()

},


source:"TEST",

user:"SYSTEM"

});


Logger.info(
"EVENT CREATED: "+
JSON.stringify(event)
);



try{


BusinessEventProcessor.process(event);



Logger.info(
"PROCESS RESULT: SUCCESS"
);



}
catch(e){

Logger.error(
"PROCESS RESULT FAILED: "+
e.message
);

}



Logger.info(
"CHECK EVENTBUS SUBSCRIBERS"
);



try{


Logger.info(
"KPI STATUS: "+
JSON.stringify(
KPISubscriptions.health()
)
);



Logger.info(
"NOTIFICATION STATUS: "+
JSON.stringify(
NotificationSubscriptions.health()
)
);



}
catch(e){

Logger.error(
"SUBSCRIPTION CHECK FAILED "+
e.message
);

}



Logger.info(
"PROCESSOR HEALTH: "+
JSON.stringify(
BusinessEventProcessor.health()
)
);



Logger.info(
"===== EVENT RELIABILITY TEST END ====="
);


}