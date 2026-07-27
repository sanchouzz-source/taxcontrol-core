// ============================================================
// CRMSubscriptions v2.0.0
// CRM Event Subscribers
// TaxControl ERP Core
//
// Compatible:
// EventBus v2.x
// EntityEvents v0.6+
// ModuleRegistry
// HealthContract
// ============================================================


console.log("CRMSubscriptions v2.0.0");



const CRMSubscriptions = {


version:"2.0.0",


ready:false,


registered:false,


eventsProcessed:0,



subscriptions:[],





// ============================================================
// INIT
// ============================================================


init(context={}){


if(this.ready){

Logger.debug(
"CRMSubscriptions already initialized"
);

return true;

}



if(
typeof EventBus==="undefined"
){

throw new Error(
"EventBus unavailable for CRMSubscriptions"
);

}



this.register();



this.ready=true;



Logger.log(
"CRMSubscriptions READY v"+
this.version
);



return true;


},







// ============================================================
// REGISTER EVENTS
// ============================================================


register(){


if(this.registered){

Logger.debug(
"CRMSubscriptions already registered"
);

return;

}




const clientCreated =
this.resolveEvent(
"CLIENT_CREATED"
);



if(clientCreated){


EventBus.subscribe(

clientCreated,

event=>
this.onClientCreated(event),

{

name:
"CRM_ClientCreated",

module:
"CRMSubscriptions"

}

);



this.subscriptions.push(
clientCreated
);



}






this.registered=true;



Logger.log(
"CRMSubscriptions REGISTERED"
);



},







// ============================================================
// EVENT RESOLVER
// ============================================================


resolveEvent(name){


if(
typeof EntityEvents!=="undefined"
){


if(
EntityEvents.CLIENT
&&
EntityEvents.CLIENT[name.replace("CLIENT_","")]
){

return EntityEvents.CLIENT[
name.replace("CLIENT_","")
];

}



}



return name;



},







// ============================================================
// CLIENT CREATED
// ============================================================


onClientCreated(event){


try{


this.eventsProcessed++;



Logger.log(

"CRM CLIENT CREATED "+
(
event.entityId ||
event.id ||
"unknown"
)

);





// будущие действия:
//
// - создание карточки клиента
// - постановка задачи менеджеру
// - отправка уведомления
// - расчёт KPI



}
catch(e){


Logger.error(
"CRM CLIENT EVENT ERROR "+
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


this.subscriptions.forEach(event=>{


EventBus.unsubscribe(
event,
"CRM_ClientCreated"
);


});


}



this.subscriptions=[];

this.registered=false;

this.ready=false;


},







// ============================================================
// HEALTH
// ============================================================


health(){


return HealthContract.create(

"CRMSubscriptions",

this.ready
?
"OK"
:
"WARNING",

{


version:this.version,


registered:this.registered,


subscriptions:this.subscriptions,


eventsProcessed:this.eventsProcessed



}

);


}





};






// ============================================================
// MODULE REGISTRATION
// ============================================================


globalThis.CRMSubscriptions =
CRMSubscriptions;



Logger.log(
"CRMSubscriptions READY v"+
CRMSubscriptions.version
);