function testLogisticsLifecycle() {

Logger.log("===== LOGISTICS TEST START =====");


let events=[];


EventBus.subscribe(
"TRANSPORT_ORDER_CREATED",
e=>{
 events.push(e.event);
 Logger.log("TEST EVENT CREATE RECEIVED");
},
{
name:"LifecycleTest"
}
);



const order = EntityService.create(
"TRANSPORT_ORDER",
{
OrganizationID:"ORG000001",
ClientID:"CLI000040",
OrderNumber:"ORD-001",
LoadingAddress:"Вологда",
DeliveryAddress:"Москва",
CargoWeight:20000,
Status:"NEW"
}
);



if(!events.includes(
"TRANSPORT_ORDER_CREATED"
)){
 throw new Error(
 "EVENT CREATE FAILED"
 );
}


Logger.log(
"EVENT TEST PASS"
);



Logger.log(
"===== LOGISTICS TEST PASS ====="
);

}