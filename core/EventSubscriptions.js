// ============================================================
// EventSubscriptions v1.0.0
// Enterprise ERP Event Subscription Manager
// TaxControl ERP Core
//
// Compatible:
// EventBus v2.x
// EntityEvents v0.6+
// DashboardEngine
// HealthService v2+
// ModuleRegistry
// ============================================================


console.log("EventSubscriptions v1.0.0");



const EventSubscriptions = {


version:"1.0.0",


initialized:false,


started:false,


subscriptions:[],


stats:{


received:0,


processed:0,


failed:0


},







// ============================================================
// INIT
// ============================================================


init(){


return this.initEventSubscriptions();


},







initEventSubscriptions(){



if(this.initialized){


Logger.debug(
"EventSubscriptions already initialized"
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




Logger.log(
"EVENT SUBSCRIPTIONS INIT START"
);




this.registerEntityEvents();



this.initialized=true;

this.started=true;



Logger.log(
"EventSubscriptions READY v"+
this.version
);



return true;


},







// ============================================================
// ENTITY EVENTS
// ============================================================


registerEntityEvents(){



const events=[



// CLIENT

EntityEvents?.CLIENT?.CREATED,

EntityEvents?.CLIENT?.UPDATED,

EntityEvents?.CLIENT?.DELETED,

EntityEvents?.CLIENT?.RESTORED,




// TRIP

EntityEvents?.TRIP?.CREATED,

EntityEvents?.TRIP?.UPDATED,

EntityEvents?.TRIP?.DELETED,

EntityEvents?.TRIP?.RESTORED,




// TRANSPORT ORDER

EntityEvents?.TRANSPORT_ORDER?.CREATED,

EntityEvents?.TRANSPORT_ORDER?.UPDATED,

EntityEvents?.TRANSPORT_ORDER?.DELETED,

EntityEvents?.TRANSPORT_ORDER?.RESTORED,




// CARRIER

EntityEvents?.CARRIER?.CREATED,

EntityEvents?.CARRIER?.UPDATED,




// DRIVER

EntityEvents?.DRIVER?.CREATED,

EntityEvents?.DRIVER?.UPDATED,




// VEHICLE

EntityEvents?.VEHICLE?.CREATED,

EntityEvents?.VEHICLE?.UPDATED,




// ROUTE

EntityEvents?.ROUTE?.CREATED,

EntityEvents?.ROUTE?.UPDATED,




// CARGO

EntityEvents?.CARGO?.CREATED,

EntityEvents?.CARGO?.UPDATED



];



events
.filter(Boolean)
.forEach(event=>{


this.subscribe(

event,

payload=>
this.onEntityChanged(payload),

{

name:
"Dashboard_"+event,


group:
"DASHBOARD"

}

);



});



},







// ============================================================
// SUBSCRIBE
// ============================================================


subscribe(event,handler,options={}){


if(
!event ||
!handler
){

return false;

}




if(
this.subscriptions.some(
x=>x.event===event
)
){

Logger.debug(
"EVENT EXISTS "+event
);


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
"EVENT HANDLER ERROR "+
event+
" "+
e.message
);


}



},

{


name:
options.name ||
"Subscription_"+event


}



);





this.subscriptions.push({


event,


name:
options.name || null,


group:
options.group || "GENERAL",


status:"ACTIVE",


createdAt:
new Date().toISOString()


});





Logger.log(
"SUBSCRIBED "+event
);



return true;


},







// ============================================================
// ENTITY CHANGE HANDLER
// ============================================================


onEntityChanged(payload){



Logger.debug(

"ENTITY EVENT "+

(
payload.event ||
"unknown"
)

);



this.refreshDashboard();



},







// ============================================================
// DASHBOARD
// ============================================================


refreshDashboard(){



try{


if(
typeof DashboardEngine!=="undefined"
&&
DashboardEngine.render
){


DashboardEngine.render(true);


}



}
catch(e){


Logger.error(

"DASHBOARD REFRESH FAILED "+
e.message

);


}



},







// ============================================================
// RESET
// ============================================================


reset(){



if(
typeof EventBus!=="undefined"
&&
EventBus.unsubscribe
){


this.subscriptions.forEach(item=>{


EventBus.unsubscribe(
item.event,
item.name
);


});


}




this.subscriptions=[];


this.initialized=false;


this.started=false;


this.stats={


received:0,

processed:0,

failed:0


};



Logger.log(
"EventSubscriptions RESET"
);


},







// ============================================================
// HEALTH
// ============================================================


health(){



return HealthContract.create(

"EventSubscriptions",

this.initialized
?
"OK"
:
"WARNING",

{


version:this.version,


initialized:this.initialized,


subscriptions:
this.subscriptions.length,


groups:
[
...new Set(
this.subscriptions.map(
x=>x.group
)
)
],


stats:this.stats,


events:
this.subscriptions.map(
x=>x.event
)



}

);



}



};







globalThis.EventSubscriptions =
EventSubscriptions;



Logger.log(
"EventSubscriptions READY v"+
EventSubscriptions.version
);