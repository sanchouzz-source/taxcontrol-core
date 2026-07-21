console.log("LogisticsEventSubscriptions");


const LogisticsEventSubscriptions = {


init(){


Logger.log(
"LOGISTICS EVENTS INIT"
);



if(
typeof AuditEventHandler !== "undefined"
){


EventBus.subscribe(
"TRANSPORT_ORDER_CREATED",
(event)=>
AuditEventHandler.handle(event)
);


EventBus.subscribe(
"TRANSPORT_ORDER_UPDATED",
(event)=>
AuditEventHandler.handle(event)
);


EventBus.subscribe(
"TRANSPORT_ORDER_DELETED",
(event)=>
AuditEventHandler.handle(event)
);


Logger.log(
"AUDIT EVENTS CONNECTED"
);


}





}


};



globalThis.LogisticsEventSubscriptions =
LogisticsEventSubscriptions;


Logger.log(
"LogisticsEventSubscriptions READY"
);