console.log("AuditEventHandler v3.4");


const AuditEventHandler = {


version:"3.4.0",

ready:false,


init(){


if(this.ready)
return;


this.registerEntityEvents();


this.ready=true;


Logger.log(
"AuditEventHandler READY v"+
this.version);


},



onEvent(event){


try{


if(!event)
return;



const validation =
ERPEventContract.validate(
event);



if(!validation.valid)
{

Logger.warn(
"AUDIT INVALID EVENT "+
validation.error);

return;

}



this.createAudit(event);



}
catch(e){

Logger.error(
"AUDIT ERROR "+
e.message);

}



},




createAudit(event){



const audit={



eventId:
event.id,



entity:
event.entity,



entityId:
event.entityId,



action:
event.type,



before:
event.before,



after:
event.after,



source:
event.source,



user:
event.user,



timestamp:
event.timestamp



};



if(
typeof AuditLog!=="undefined" &&
AuditLog.write)
{


AuditLog.write(
audit);


}



},





registerEntityEvents(){


Object.keys(EntityEvents)
.forEach(entity=>{


Object.values(
EntityEvents[entity])
.forEach(eventName=>{


EventBus.subscribe(
eventName,
this.onEvent.bind(this),
{
name:"Audit_"+eventName
});


});


});


},




health(){

return HealthContract.create(

"AuditEventHandler",

this.ready?
"OK":
"WARNING",

{

version:this.version

});


}


};



globalThis.AuditEventHandler =
AuditEventHandler;


Logger.log(
"AuditEventHandler READY v3.4.0");