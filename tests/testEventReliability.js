function testEventReliability(){


Logger.log(
"===== EVENT RELIABILITY TEST START ====="
);



const event =
ERPEventContract.create({

entity:"TRANSPORT_ORDER",

type:"CREATED",

entityId:"TO-RETRY-001",

after:{
TransportOrderID:
"TO-RETRY-001"
},

source:"TEST",

user:"SYSTEM"

});



Logger.log(
"EVENT "+
JSON.stringify(event)
);



try{


BusinessEventProcessor.process(
event
);



Logger.log(
"EVENT PROCESS SUCCESS"
);



}
catch(e){


Logger.error(
"EVENT PROCESS FAILED "+
e.message
);


}



Logger.log(
"===== EVENT RELIABILITY TEST END ====="
);


}