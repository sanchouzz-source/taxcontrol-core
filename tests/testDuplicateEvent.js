function testDuplicateEvent(){


const event =
ERPEventContract.create({

entity:"TRANSPORT_ORDER",

type:"CREATED",

entityId:"DUPLICATE-001",

after:{
TransportOrderID:"DUPLICATE-001"
},

source:"TEST"

});


BusinessEventProcessor.process(event);

BusinessEventProcessor.process(event);


Logger.info(
JSON.stringify(
BusinessEventProcessor.health()
)
);


}function testDuplicateEvent(){


const event =
ERPEventContract.create({

entity:"TRANSPORT_ORDER",

type:"CREATED",

entityId:"DUPLICATE-001",

after:{
TransportOrderID:"DUPLICATE-001"
},

source:"TEST"

});


BusinessEventProcessor.process(event);

BusinessEventProcessor.process(event);


Logger.info(
JSON.stringify(
BusinessEventProcessor.health()
)
);


}