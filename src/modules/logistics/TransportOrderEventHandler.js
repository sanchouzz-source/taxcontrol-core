console.log("TransportOrderEventHandler v1.2");


const TransportOrderEventHandler = {


version:"1.2.0",

initialized:false,

ready:false,

retryLimit:3,

errorQueue:[],


entityName:"TRANSPORT_ORDER",

entity:null,

subscriptions:[],



init(){


if(this.initialized)
{
Logger.log(
"TransportOrderEventHandler ALREADY INITIALIZED");
return true;
}



if(typeof EntityRegistry==="undefined")
throw new Error(
"EntityRegistry unavailable");



this.entity =
EntityRegistry.get(this.entityName);



if(!this.entity)
throw new Error(
"ENTITY NOT FOUND "+this.entityName);



if(typeof EventBus==="undefined")
throw new Error(
"EventBus unavailable");



this.registerEvents();



this.initialized=true;

this.ready=true;



Logger.log(
"TransportOrderEventHandler READY v"+
this.version);



return true;

},



registerEvents(){


this.subscribe(
EntityEvents.TRANSPORT_ORDER.CREATED,
this.onCreated
);


this.subscribe(
EntityEvents.TRANSPORT_ORDER.UPDATED,
this.onUpdated
);


this.subscribe(
EntityEvents.TRANSPORT_ORDER.DELETED,
this.onDeleted
);


this.subscribe(
EntityEvents.TRANSPORT_ORDER.RESTORED,
this.onRestored
);



},




subscribe(event,handler){


const name=
"TransportOrder_"+handler.name;



const bound=
handler.bind(this);



EventBus.subscribe(
event,
bound,
{
name:name
});



this.subscriptions.push({
event:event,
handler:name
});


},





onCreated(event){

this.process(
"CREATED",
event);

},


onUpdated(event){

this.process(
"UPDATED",
event);

},


onDeleted(event){

this.process(
"DELETED",
event);

},


onRestored(event){

this.process(
"RESTORED",
event);

},





process(type,event){


let attempt=0;



while(attempt<this.retryLimit){


try{


const erpEvent =
this.createERPEvent(
type,
event
);



const validation =
ERPEventContract.validate(
erpEvent);



if(!validation.valid)
throw new Error(
validation.error);



this.notifyBusiness(
erpEvent);



return;



}
catch(e){


attempt++;


Logger.warn(
"TransportOrder EVENT RETRY "+
attempt+
" "+
e.message);



if(attempt>=this.retryLimit)
{

this.errorQueue.push({

event:event,

type:type,

error:e.message,

timestamp:new Date()

});


Logger.error(
"EVENT MOVED TO ERROR QUEUE");

}


}



}



},





createERPEvent(type,event){


return ERPEventContract.create({


entity:
this.entityName,


type:type,


entityId:
this.getId(event),


before:
event.before || null,


after:
event.after || this.extract(event),


source:
"TransportOrderEventHandler",


user:
event.user || null


});


},




extract(event){

return event.after ??
event.data ??
event;

},




getId(event){


return (
event.entityId ||
this.extract(event)?.TransportOrderID ||
""
);


},





notifyBusiness(event){


if(typeof BusinessEventProcessor!=="undefined")
{


BusinessEventProcessor.process(
event);


}
else{


throw new Error(
"BusinessEventProcessor unavailable");


}


},




health(){


return HealthContract.create(
"TransportOrderEventHandler",

this.ready?
"OK":
"WARNING",

{

version:this.version,

subscriptions:
this.subscriptions.length,

errorQueue:
this.errorQueue.length

});


}


};



globalThis.TransportOrderEventHandler =
TransportOrderEventHandler;


Logger.log(
"TransportOrderEventHandler READY v1.2.0");