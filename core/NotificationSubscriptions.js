// ============================================================
// NotificationSubscriptions v2.0.0
// ERP TexControl Event Notification Adapter
//
// Architecture:
//
// EventBus
//    |
// NotificationSubscriptions
//    |
// NotificationService
//    |
// Channels (Email/SMS/Push)
//
// Compatible:
// EventBus v2.x
// ModuleRegistry
// HealthService v2+
// ERPDiagnostics v5+
// ============================================================


console.log("NotificationSubscriptions v2.0.0");



const NotificationSubscriptions = {


version:"2.0.0",


ready:false,


registered:false,


subscriptions:[],


stats:{


received:0,

sent:0,

failed:0


},







// ============================================================
// EVENT MAP
// ============================================================


eventMap:{


TRANSPORT_ORDER_CREATED:
"onTransportOrderCreated",


TRANSPORT_ORDER_UPDATED:
"onTransportOrderUpdated",



TRIP_ASSIGNED:
"onTripAssigned",


TRIP_STARTED:
"onTripStarted",


TRIP_COMPLETED:
"onTripCompleted",


TRIP_DELAYED:
"onTripDelayed",




PAYMENT_RECEIVED:
"onPaymentReceived",


PAYMENT_OVERDUE:
"onPaymentOverdue",


EXPENSE_CREATED:
"onExpenseCreated",




DOCUMENT_EXPIRED:
"onDocumentExpired",


CONTRACT_EXPIRED:
"onContractExpired",




MODULE_FAILED:
"onModuleFailed",


FAILED_EVENT_CREATED:
"onFailedEventCreated",




CLIENT_CREATED:
"onClientCreated"


},







// ============================================================
// INIT
// ============================================================


init(){


if(this.ready){

Logger.debug(
"NotificationSubscriptions already READY"
);

return true;

}



if(
typeof EventBus==="undefined"
){

throw new Error(
"NotificationSubscriptions requires EventBus"
);

}



if(
typeof NotificationService==="undefined"
){

Logger.warn(
"NotificationService unavailable"
);

}



this.register();


this.ready=true;



Logger.log(
"NotificationSubscriptions READY v"+
this.version
);



return true;


},







// ============================================================
// REGISTER
// ============================================================


register(){


if(this.registered){

return;

}



Object.entries(this.eventMap)
.forEach(([event,method])=>{


this.subscribe(

event,

payload=>
this[method](payload),

"NOTIFY_"+method


);


});



this.registered=true;


},







// ============================================================
// SUBSCRIBE
// ============================================================


subscribe(event,handler,name){


EventBus.subscribe(

event,

payload=>{


try{


this.stats.received++;


handler(payload);


}
catch(e){


this.stats.failed++;


Logger.error(

"Notification event failed "+
event+
" "+
e.message

);


}



},


{


name,

module:
"NotificationSubscriptions"


}


);



this.subscriptions.push({


event,

name,

status:"ACTIVE",

createdAt:
new Date().toISOString()


});



Logger.log(
"NOTIFICATION SUBSCRIBED "+
event
);


},







// ============================================================
// SEND
// ============================================================


send(type,payload){


const message={


type,


source:
"NotificationSubscriptions",


payload,


timestamp:
new Date().toISOString()


};




if(
typeof NotificationService!=="undefined"
&&
typeof NotificationService.send==="function"
){


NotificationService.send(message);


this.stats.sent++;


return true;


}



Logger.debug(

"Notification skipped "+
type

);



return false;


},







// ============================================================
// EXTRACT
// ============================================================


extract(event){


if(!event){

return null;

}



return (

event.after ||

event.data ||

event.payload ||

event

);


},







// ============================================================
// LOGISTICS
// ============================================================


onTransportOrderCreated(event){


const data=this.extract(event);

if(data)
this.send(
"TRANSPORT_ORDER_CREATED",
data
);


},



onTransportOrderUpdated(event){


const data=this.extract(event);

if(data)
this.send(
"TRANSPORT_ORDER_UPDATED",
data
);


},




onTripAssigned(event){

const data=this.extract(event);

if(data)
this.send(
"TRIP_ASSIGNED",
data
);

},



onTripStarted(event){

const data=this.extract(event);

if(data)
this.send(
"TRIP_STARTED",
data
);

},



onTripCompleted(event){

const data=this.extract(event);

if(data)
this.send(
"TRIP_COMPLETED",
data
);

},



onTripDelayed(event){

const data=this.extract(event);

if(data)
this.send(
"TRIP_DELAYED",
data
);

},







// ============================================================
// FINANCE
// ============================================================


onPaymentReceived(event){

const data=this.extract(event);

if(data)
this.send(
"PAYMENT_RECEIVED",
data
);

},



onPaymentOverdue(event){

const data=this.extract(event);

if(data)
this.send(
"PAYMENT_OVERDUE",
data
);

},



onExpenseCreated(event){

const data=this.extract(event);

if(data)
this.send(
"EXPENSE_CREATED",
data
);

},







// ============================================================
// DOCUMENTS
// ============================================================


onDocumentExpired(event){

const data=this.extract(event);

if(data)
this.send(
"DOCUMENT_EXPIRED",
data
);

},



onContractExpired(event){

const data=this.extract(event);

if(data)
this.send(
"CONTRACT_EXPIRED",
data
);

},







// ============================================================
// SYSTEM
// ============================================================


onModuleFailed(event){

const data=this.extract(event);

if(data)
this.send(
"MODULE_FAILED",
data
);

},



onFailedEventCreated(event){

const data=this.extract(event);

if(data)
this.send(
"FAILED_EVENT_CREATED",
data
);

},







// ============================================================
// CRM
// ============================================================


onClientCreated(event){

const data=this.extract(event);

if(data)
this.send(
"CLIENT_CREATED",
data
);

},







// ============================================================
// STOP
// ============================================================


stop(){


this.ready=false;


Logger.log(
"NotificationSubscriptions STOPPED"
);


},







// ============================================================
// RESET
// ============================================================


reset(){


this.stop();


this.registered=false;


this.subscriptions=[];


this.stats={

received:0,

sent:0,

failed:0

};


},







// ============================================================
// HEALTH
// ============================================================


health(){


return HealthContract.create(

"NotificationSubscriptions",

this.ready
?
"OK"
:
"WARNING",

{


version:this.version,


ready:this.ready,


registered:this.registered,


subscriptions:
this.subscriptions.map(
x=>x.event
),


stats:this.stats


}


);


}



};







// ============================================================
// MODULE REGISTRATION
// ============================================================


if(
typeof ModuleRegistry!=="undefined"
){


ModuleRegistry.register(

"NotificationSubscriptions",

{


version:
NotificationSubscriptions.version,


phase:
"APPLICATION",


priority:
60,


dependencies:[
"EventBus"
],



init(){

return NotificationSubscriptions.init();

},



stop(){

return NotificationSubscriptions.stop();

},



health(){

return NotificationSubscriptions.health();

}



}


);



}







globalThis.NotificationSubscriptions =
NotificationSubscriptions;



Logger.log(
"NotificationSubscriptions LOADED v"+
NotificationSubscriptions.version
);