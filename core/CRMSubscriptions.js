console.log("CRMSubscriptions");


const CRMSubscriptions = {

version:"1.0.0",


init(){

if(typeof EventBus==="undefined"){
    throw new Error(
      "EventBus unavailable for CRMSubscriptions"
    );
}


this.register();

Logger.log(
"CRMSubscriptions READY v"+
this.version
);

},


register(){

EventBus.subscribe(
EntityEvents.CLIENT.CREATED,
this.onClientCreated,
{
name:"CRM_ClientCreated"
});

},


onClientCreated(event){

Logger.log(
"CRM CLIENT EVENT "+
event.entityId
);

}


};


globalThis.CRMSubscriptions = CRMSubscriptions;