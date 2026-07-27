// ============================================================
// KPISubscriptions v2.0.0
// Business Events -> KPI Commands Adapter
// TaxControl ERP Core
//
// Compatible:
// EventBus v2.x
// KPIEngine
// ModuleRegistry
// HealthService v2+
// ERPDiagnostics v5+
// ============================================================


console.log("KPISubscriptions v2.0.0");



const KPISubscriptions = {


version:"2.0.0",


ready:false,


registered:false,


subscriptions:[],


stats:{


received:0,


processed:0,


failed:0


},







// ============================================================
// EVENT MAP
// ============================================================


eventMap:{


TRIP_COMPLETED:
"onTripCompleted",


FINANCIAL_TRANSACTION_CREATED:
"onTransactionCreated",


TRANSPORT_ORDER_CREATED:
"onTransportOrderCreated",


TRANSPORT_ORDER_UPDATED:
"onTransportOrderUpdated"


},







// ============================================================
// INIT
// ============================================================


init(){


if(this.ready){

Logger.debug(
"KPISubscriptions already READY"
);

return true;

}



if(
typeof EventBus==="undefined"
){

throw new Error(
"EventBus unavailable"
);

}



if(
typeof KPIEngine==="undefined"
){

Logger.warn(
"KPIEngine unavailable, commands will be logged"
);

}



this.register();


this.ready=true;



Logger.log(
"KPISubscriptions READY v"+
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
.forEach(([event,handlerName])=>{


this.subscribe(

event,

payload=>
this[handlerName](payload),

"KPI_"+handlerName

);



});



this.registered=true;


},







// ============================================================
// SUBSCRIBE
// ============================================================


subscribe(event,handler,name){


if(
!event ||
!handler
){

return false;

}



EventBus.subscribe(

event,

payload=>{


try{


this.stats.received++;


handler(payload);


this.stats.processed++;


}
catch(e){


this.stats.failed++;


Logger.error(

"KPI EVENT ERROR "+
event+
" "+
e.message

);


}



},


{


name,


module:
"KPISubscriptions"


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
"KPI SUBSCRIBED "+
event
);



return true;


},







// ============================================================
// KPI COMMAND DISPATCH
// ============================================================


dispatch(command){



Logger.debug(
"KPI COMMAND "+
command.type
);



if(
typeof KPIEngine!=="undefined"
&&
typeof KPIEngine.handleCommand==="function"
){


return KPIEngine.handleCommand(
command
);


}



Logger.debug(
"KPIEngine.handleCommand unavailable"
);


return false;


},







// ============================================================
// TRIP COMPLETED
// ============================================================


onTripCompleted(event){


const trip =
this.extract(event);



if(!trip){

return;

}



this.dispatch({


type:
"REVENUE_UPDATED",


source:
"TRIP_COMPLETED",


entityId:
trip.TripID || trip.id,



payload:{


revenue:
trip.Revenue || 0,


trip


}


});



},







// ============================================================
// FINANCIAL TRANSACTION
// ============================================================


onTransactionCreated(event){



const transaction =
this.extract(event);



if(!transaction){

return;

}



this.dispatch({


type:
"TRANSACTION_CREATED",


source:
"FINANCIAL_TRANSACTION_CREATED",


entityId:
transaction.TransactionID ||
transaction.id,



payload:{


amount:
transaction.Amount || 0,


transaction


}



});



},







// ============================================================
// TRANSPORT ORDER
// ============================================================


onTransportOrderCreated(event){


const order =
this.extract(event);



if(!order){

return;

}



this.dispatch({


type:
"ORDER_CREATED",


source:
"TRANSPORT_ORDER_CREATED",


entityId:
order.TransportOrderID ||
order.id,


payload:{
order
}


});


},







onTransportOrderUpdated(event){



const order =
this.extract(event);



if(!order){

return;

}



this.dispatch({


type:
"ORDER_UPDATED",


source:
"TRANSPORT_ORDER_UPDATED",


entityId:
order.TransportOrderID ||
order.id,


payload:{
order
}


});


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
// STOP
// ============================================================


stop(){



this.ready=false;


this.registered=false;



Logger.log(
"KPISubscriptions STOPPED"
);



},







// ============================================================
// RESET
// ============================================================


reset(){


this.stop();


this.subscriptions=[];


this.stats={


received:0,

processed:0,

failed:0


};


},







// ============================================================
// HEALTH
// ============================================================


health(){


return HealthContract.create(

"KPISubscriptions",

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

"KPISubscriptions",


{


version:
KPISubscriptions.version,


phase:
"APPLICATION",


priority:
70,


dependencies:[

"EventBus"

],



init(){
return KPISubscriptions.init();
},



stop(){
return KPISubscriptions.stop();
},



health(){
return KPISubscriptions.health();
}



}

);



}







globalThis.KPISubscriptions =
KPISubscriptions;



Logger.log(
"KPISubscriptions LOADED v"+
KPISubscriptions.version
);