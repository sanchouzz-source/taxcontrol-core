const CRMSubscriptions = {

version:"0.1.0",

initialized:false,


init(){

if(this.initialized)
return;


if(typeof EventBus==="undefined")
throw new Error(
"EventBus unavailable"
);


this.register();


this.initialized=true;


Logger.log(
"CRMSubscriptions READY v0.1.0"
);


},


register(){

EventBus.subscribe(
EntityEvents.CLIENT.CREATED,
this.onClientCreated.bind(this),
{
name:"CRM_CLIENT_CREATED"
}
);


},


onClientCreated(event){

Logger.log(
"CRM CLIENT CREATED"
);


}


};


globalThis.CRMSubscriptions =
CRMSubscriptions;