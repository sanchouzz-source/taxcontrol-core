function testBusinessEventPipeline(){


Logger.log(
"===== BUSINESS PIPELINE TEST START ====="
);



if(
typeof BusinessEventProcessor === "undefined"
){

throw new Error(
"BusinessEventProcessor unavailable"
);

}



if(
typeof ERPEventContract === "undefined"
){

throw new Error(
"ERPEventContract unavailable"
);

}




// создаём настоящее ERP событие

const event = ERPEventContract.create({

entity:"TRANSPORT_ORDER",

type:"CREATED",

entityId:"TO-TEST-0001",

before:null,


after:{

TransportOrderID:"TO-TEST-0001",

OrganizationID:"ORG000001",

OrderNumber:"TEST-ORDER",

LoadingAddress:"Вологда",

DeliveryAddress:"Москва",

CargoWeight:20000,

Status:"NEW"

},


source:"TEST",

user:null,


timestamp:
new Date().toISOString()

});




Logger.log(
"ERP EVENT CREATED " +
JSON.stringify(event)
);




// отправляем в бизнес процессор

BusinessEventProcessor.process(
event
);




Logger.log(
"===== BUSINESS PIPELINE TEST PASS ====="
);



}