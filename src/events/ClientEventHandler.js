console.log("ClientEventHandler");


const ClientEventHandler = {


version:"0.4.0",



initialized:false,



entity:
EntityRegistry.CLIENT,




init(){


if(this.initialized){

Logger.log(
"ClientEventHandler ALREADY READY"
);

return true;

}



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



this.initialized=true;



Logger.log(
"ClientEventHandler READY v"
+
this.version
);



return true;

},






extract(payload){


if(!payload){

return null;

}


return payload.after || payload;


},





log(action,payload){


const client=this.extract(payload);



if(!client){

return;

}



Logger.log(

"CLIENT "
+
action
+
" EVENT "
+
client[this.entity.idField]

);



},





onCreated(event){

this.log(
"CREATED",
event
);

},



onUpdated(event){

this.log(
"UPDATED",
event
);

},



onDeleted(event){

this.log(
"DELETED",
event
);

},



onRestored(event){

this.log(
"RESTORED",
event
);

},




health(){


return HealthContract.create(

"ClientEventHandler",

"OK",

{


version:this.version,


entity:this.entity.entity


}

);


}



};




globalThis.ClientEventHandler =
ClientEventHandler;