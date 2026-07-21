console.log("LogisticsEventSubscriptions");


const LogisticsEventSubscriptions = {


init(){

Logger.log(
"REGISTER LOGISTICS EVENTS"
);


EventBus.subscribe(
"TRANSPORT_ORDER_CREATED",
this.transportOrderCreated,
{
name:"LogisticsOrderCreatedHandler"
}
);


EventBus.subscribe(
"TRANSPORT_ORDER_UPDATED",
this.transportOrderUpdated,
{
name:"LogisticsOrderUpdatedHandler"
}
);


EventBus.subscribe(
"TRANSPORT_ORDER_DELETED",
this.transportOrderDeleted,
{
name:"LogisticsOrderDeletedHandler"
}
);


EventBus.subscribe(
"TRANSPORT_ORDER_RESTORED",
this.transportOrderRestored,
{
name:"LogisticsOrderRestoredHandler"
}
);


Logger.log(
"LogisticsEventSubscriptions READY"
);


},



transportOrderCreated(event){

Logger.log(
"LOGISTICS EVENT CREATE "+
event.entityId
);

},


transportOrderUpdated(event){

Logger.log(
"LOGISTICS EVENT UPDATE "+
event.entityId
);

},


transportOrderDeleted(event){

Logger.log(
"LOGISTICS EVENT DELETE "+
event.entityId
);

},


transportOrderRestored(event){

Logger.log(
"LOGISTICS EVENT RESTORE "+
event.entityId
);


}


};


globalThis.LogisticsEventSubscriptions =
LogisticsEventSubscriptions;