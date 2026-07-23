// ============================================================
// NotificationSubscriptions v1.2.0
// ERP TexControl Event Adapter
// ============================================================

console.log("NotificationSubscriptions v1.2.0");


const NotificationSubscriptions = {

version:"1.2.0",

initialized:false,

handlers:{},


// ------------------------------------------------------------
// INIT
// ------------------------------------------------------------

init(){

if(this.initialized){
 Logger.log(
 "NotificationSubscriptions already initialized"
 );
 return;
}


if(typeof EventBus==="undefined"){
 throw new Error(
 "NotificationSubscriptions: EventBus unavailable"
 );
}


if(typeof NotificationService==="undefined"){
 Logger.warn(
 "NotificationService unavailable, notifications disabled"
 );
}


this.register();

this.initialized=true;


Logger.log(
"NotificationSubscriptions READY v"+this.version
);

},



// ------------------------------------------------------------
// REGISTER EVENTS
// ------------------------------------------------------------

register(){


this.subscribe(
"TRANSPORT_ORDER_CREATED",
"onTransportOrderCreated"
);


this.subscribe(
"TRANSPORT_ORDER_UPDATED",
"onTransportOrderUpdated"
);


this.subscribe(
"CLIENT_CREATED",
"onClientCreated"
);


this.subscribe(
"TRIP_COMPLETED",
"onTripCompleted"
);


this.subscribe(
"PAYMENT_RECEIVED",
"onPaymentReceived"
);


},




subscribe(eventName,handlerName){

const handler =
(event)=>
this[handlerName](event);


this.handlers[eventName]=handler;


EventBus.subscribe(
eventName,
handler,
{
name:
"Notification_"+eventName
}
);


Logger.debug(
`Notification subscribed ${eventName}`
);

},




// ------------------------------------------------------------
// EVENTS
// ------------------------------------------------------------


onTransportOrderCreated(event){

const order=this._extract(event);

if(!order)return;


Logger.log(
`NOTIFY: Transport order created ${order.id}`
);


this.send(
"ORDER_CREATED",
order
);

},



onTransportOrderUpdated(event){

const order=this._extract(event);

if(!order)return;


this.send(
"ORDER_UPDATED",
order
);

},



onClientCreated(event){

const client=this._extract(event);

if(!client)return;


this.send(
"CLIENT_CREATED",
client
);

},



onTripCompleted(event){

const trip=this._extract(event);

if(!trip)return;


this.send(
"TRIP_COMPLETED",
trip
);

},



onPaymentReceived(event){

const payment=this._extract(event);

if(!payment)return;


this.send(
"PAYMENT_RECEIVED",
payment
);

},



// ------------------------------------------------------------
// SERVICE ADAPTER
// ------------------------------------------------------------


send(type,payload){


if(
typeof NotificationService!=="undefined" &&
typeof NotificationService.send==="function"
){

NotificationService.send({
type,
payload
});


}
else{

Logger.log(
`Notification skipped ${type}`
);

}

},



// ------------------------------------------------------------

_extract(event){

return event?.after ??
       event?.data ??
       event ??
       null;

},



// ------------------------------------------------------------
// STOP
// ------------------------------------------------------------


stop(){

for(
const [event,handler]
of Object.entries(this.handlers)
){

EventBus.off(
event,
handler
);

}


this.handlers={};

this.initialized=false;


Logger.log(
"NotificationSubscriptions STOPPED"
);

},




// ------------------------------------------------------------
// HEALTH
// ------------------------------------------------------------


health(){

return HealthContract.create(

"NotificationSubscriptions",

this.initialized
?"OK"
:"WARNING",

{

version:this.version,

events:
Object.keys(this.handlers)

}

);

}

};



// ------------------------------------------------------------
// ModuleRegistry
// ------------------------------------------------------------


if(typeof ModuleRegistry!=="undefined"){


ModuleRegistry.register(

"NotificationSubscriptions",

{

version:
NotificationSubscriptions.version,


phase:
"DOMAIN",


dependencies:[
"EventBus"
],


init:
()=>NotificationSubscriptions.init(),


stop:
()=>NotificationSubscriptions.stop(),


health:
()=>NotificationSubscriptions.health()

}

);


}



globalThis.NotificationSubscriptions=
NotificationSubscriptions;


Logger.log(
"NotificationSubscriptions LOADED v"+
NotificationSubscriptions.version
);