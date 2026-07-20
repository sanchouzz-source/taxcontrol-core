function testLogisticsLifecycle(){


Logger.info(
"===== LOGISTICS TEST START ====="
);



let order =
EntityService.create(

"TRANSPORT_ORDER",

{

OrganizationID:"ORG000001",

ClientID:"CLI000040",

OrderNumber:"ORD-001",

LoadingAddress:"Вологда",

DeliveryAddress:"Москва",

CargoWeight:20000

}

);



Logger.info(
"ORDER CREATED "
+ order.TransportOrderID
);



}