console.log("LogisticsSubscriptions");


const LogisticsSubscriptions = {


init(){


EventBus.subscribe(
"TRANSPORT_ORDER_CREATED",
AuditEventHandler.handle
);


EventBus.subscribe(
"TRANSPORT_ORDER_UPDATED",
AuditEventHandler.handle
);


EventBus.subscribe(
"TRANSPORT_ORDER_DELETED",
AuditEventHandler.handle
);


Logger.log(
"LOGISTICS EVENTS REGISTERED"
);


}


};


globalThis.LogisticsSubscriptions =
LogisticsSubscriptions;