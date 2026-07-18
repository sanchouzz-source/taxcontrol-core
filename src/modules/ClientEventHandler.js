console.log("ClientEventHandler");


const ClientEventHandler = {


version:"0.5.0",


initialized:false,


ready:false,



entityName:"CLIENT",



entity:null,





init(){



if(this.initialized){


Logger.log(
"ClientEventHandler ALREADY READY"
);


return true;


}





if(
typeof EntityRegistry==="undefined"
){


throw new Error(
"EntityRegistry unavailable"
);


}





this.entity =
EntityRegistry.get(
this.entityName
);






if(
typeof EventBus==="undefined"
){


throw new Error(
"EventBus unavailable"
);


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

this.ready=true;





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





return (

payload.after

??

payload

);



},







getId(client){


if(!client){

return "";

}



return client[
this.entity.idField
]
||
"";


},







log(
action,
payload
){



const client =
this.extract(
payload
);




if(!client){


Logger.debug(
"CLIENT EVENT WITHOUT DATA "
+
action
);


return;


}





Logger.log(

"CLIENT "
+
action
+
" EVENT "
+
this.getId(client)

);



},







onCreated(event){



try{


this.log(
"CREATED",
event
);


}

catch(e){


Logger.error(
"ClientEventHandler CREATE ERROR "
+
e.message
);


}



},







onUpdated(event){



try{


this.log(
"UPDATED",
event
);


}

catch(e){


Logger.error(
"ClientEventHandler UPDATE ERROR "
+
e.message
);


}



},







onDeleted(event){



try{


this.log(
"DELETED",
event
);


}

catch(e){


Logger.error(
"ClientEventHandler DELETE ERROR "
+
e.message
);


}



},







onRestored(event){



try{


this.log(
"RESTORED",
event
);


}

catch(e){


Logger.error(
"ClientEventHandler RESTORE ERROR "
+
e.message
);


}



},







health(){



return HealthContract.create(


"ClientEventHandler",


this.ready
?
"OK"
:
"WARNING",



{


version:this.version,


entity:
this.entityName,


initialized:this.initialized


}



);


}



};





globalThis.ClientEventHandler =
ClientEventHandler;



Logger.log(
"ClientEventHandler READY v"
+
ClientEventHandler.version
);