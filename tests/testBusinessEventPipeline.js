function testBusinessEventPipeline(){


Logger.log(
"===== BUSINESS PIPELINE TEST START ====="
);



const event =
ERPEventContract.create({

entity:"TRANSPORT_ORDER",

type:"CREATED",

entityId:"TO-TEST",

before:null,


after:{
TransportOrderID:"TO-TEST",
status:"NEW"
},


source:"TEST",

user:"TESTER"


});



Logger.log(
"ERP TEST EVENT "+
JSON.stringify(event)
);



const validation =
ERPEventContract.validate(event);



if(!validation.valid){

throw new Error(
"ERP EVENT INVALID "+
validation.error
);

}



BusinessEventProcessor.process(event);



Logger.log(
"===== BUSINESS PIPELINE TEST PASS ====="
);


}