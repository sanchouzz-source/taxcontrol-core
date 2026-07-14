console.log("ClientEventHandler");


const ClientEventHandler = {


version:"0.3.0",



entity:
EntityRegistry.CLIENT,





init(){



EventBus.subscribe(

this.entity.events.created,

this.onCreated.bind(this)

);




EventBus.subscribe(

this.entity.events.updated,

this.onUpdated.bind(this)

);




EventBus.subscribe(

this.entity.events.deleted,

this.onDeleted.bind(this)

);




EventBus.subscribe(

this.entity.events.restored,

this.onRestored.bind(this)

);





console.log(

"ClientEventHandler READY"

);



return true;


},








extract(payload){


if(!payload){

return null;

}



return payload.after || payload;


},







onCreated(payload){


const client =
this.extract(payload);



if(!client){

return;

}



Logger.log(

"CLIENT CREATED EVENT: "

+
client.ClientID

);



},







onUpdated(payload){


const client =
this.extract(payload);



if(!client){

return;

}



Logger.log(

"CLIENT UPDATED EVENT: "

+
client.ClientID

);



},








onDeleted(payload){


const client =
this.extract(payload);



if(!client){

return;

}



Logger.log(

"CLIENT DELETED EVENT: "

+
client.ClientID

);



},








onRestored(payload){


const client =
this.extract(payload);



if(!client){

return;

}



Logger.log(

"CLIENT RESTORED EVENT: "

+
client.ClientID

);



},







health(){


return HealthContract.create(

"ClientEventHandler",

"OK",

{


version:this.version,


entity:this.entity.entity,


dependencies:{


EventBus:!!EventBus,


EntityRegistry:!!EntityRegistry,


Logger:!!Logger


}



}

);


}



};




globalThis.ClientEventHandler =
ClientEventHandler;