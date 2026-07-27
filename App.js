// ============================================================
// App v3.2.0
// TaxControl ERP Application Facade
//
// Application lifecycle controller
//
// Architecture:
//
// App
//  |
//  v
// SystemInit
//  |
//  v
// ERP Core
//
// ============================================================


console.log("App v3.2.0");



const App = {


version:"3.2.0",

apiVersion:"3.2",

name:"TaxControl ERP",

platform:"Google Apps Script",



state:{


started:false,

starting:false,

startedAt:null,

lastError:null


},







// ============================================================
// INIT
// ============================================================


init(){



Logger.log(
"APP INIT"
);



if(
typeof SystemInit==="undefined"
){

throw new Error(
"SystemInit not loaded"
);

}



return true;


},







// ============================================================
// START ERP
// ============================================================


start(){


this.init();



if(this.state.started){


Logger.warn(
"ERP already started"
);



return {

status:"ALREADY_STARTED",

startedAt:this.state.startedAt

};


}




if(this.state.starting){


throw new Error(
"ERP startup already running"
);


}




try{


this.state.starting=true;



Logger.log(
"========== ERP BOOT START =========="
);





const result =
SystemInit.init();






this.state.started=true;


this.state.starting=false;


this.state.startedAt =
new Date();




Logger.log(
"========== ERP BOOT COMPLETE =========="
);




return {


status:"READY",


result,


startedAt:
this.state.startedAt


};




}
catch(e){


this.state.starting=false;


this.state.lastError =
e.message;



Logger.error(

"ERP START FAILED "+
e.message

);



throw e;


}



},







// ============================================================
// HEALTH
// ============================================================


health(){



const modules={};



try{



if(
typeof SystemInit!=="undefined"
){

modules.system =
SystemInit.health();

}



if(
typeof EntityMetadata!=="undefined"
){

modules.metadata =
EntityMetadata.health?.();

}



if(
typeof EntityRegistry!=="undefined"
){

modules.entityRegistry =
EntityRegistry.health?.();

}



if(
typeof SchemaRegistry!=="undefined"
){

modules.schemaRegistry =
SchemaRegistry.health?.();

}



if(
typeof SchemaManager!=="undefined"
){

modules.schemaManager =
SchemaManager.health?.();

}



if(
typeof Database!=="undefined"
){

modules.database =
Database.health?.();

}



if(
typeof RepositoryFactory!=="undefined"
){

modules.repositories =
RepositoryFactory.health?.();

}



if(
typeof EntityService!=="undefined"
){

modules.entityService =
EntityService.health?.();

}






return {


module:"App",


version:this.version,


status:
this.state.started
?
"OK"
:
"WARNING",



state:this.state,


modules,


timestamp:
new Date().toISOString()


};



}
catch(e){



return {


module:"App",


status:"ERROR",


error:e.message,


timestamp:
new Date().toISOString()


};


}



},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){



return {



application:this.name,


version:this.version,


state:this.state,



system:

typeof SystemInit!=="undefined"

?

SystemInit.diagnostics?.()

:

null,




metadata:

typeof EntityMetadata!=="undefined"

?

EntityMetadata.list?.()

:

null,





registry:

typeof EntityRegistry!=="undefined"

?

EntityRegistry.diagnostics?.()

:

null,





schema:

typeof SchemaRegistry!=="undefined"

?

SchemaRegistry.diagnostics?.()

:

null,





database:

typeof Database!=="undefined"

?

Database.diagnostics?.()

:

null,





repositories:

typeof RepositoryFactory!=="undefined"

?

RepositoryFactory.diagnostics?.()

:

null,





timestamp:
new Date().toISOString()



};


},







// ============================================================
// RESET DEVELOPMENT
// ============================================================


reset(){



Logger.warn(
"ERP RESET START"
);



try{





this.state={


started:false,

starting:false,

startedAt:null,

lastError:null


};





globalThis.__ERP_STATE__={


started:false,

starting:false,

startedAt:null


};






// System

if(
typeof SystemInit!=="undefined"
){

SystemInit.reset?.();

}





// Metadata

if(
typeof EntityMetadata!=="undefined"
){

EntityMetadata.reset?.();

}





// Registry

if(
typeof EntityRegistry!=="undefined"
){

EntityRegistry.reset?.();

}





// Schema Registry

if(
typeof SchemaRegistry!=="undefined"
){

SchemaRegistry.reset?.();

}





// Schema Manager

if(
typeof SchemaManager!=="undefined"
){

SchemaManager.initialized=false;

SchemaManager.schema={};

}





// Database

if(
typeof Database!=="undefined"
){


Database.initialized=false;

Database.status="CREATED";

Database.lastError=null;

Database._metaCache={};


}





// Repository

if(
typeof RepositoryFactory!=="undefined"
){

RepositoryFactory.reset?.();

}





if(
typeof RepositoryRegistry!=="undefined"
){

RepositoryRegistry.reset?.();

}






// Events

if(
typeof EventBus!=="undefined"
){

EventBus.handlers={};

}





// Modules

if(
typeof ModuleRegistry!=="undefined"
){

ModuleRegistry.reset?.();

}





Logger.log(
"ERP RESET COMPLETE"
);




return {


status:"OK",

message:
"ERP reset completed"


};




}
catch(e){



Logger.error(

"ERP RESET FAILED "+
e.message

);



return {


status:"ERROR",

error:e.message


};



}



},







// ============================================================
// INFO
// ============================================================


info(){



return {


application:this.name,


version:this.version,


apiVersion:this.apiVersion,


platform:this.platform,



architecture:[


"App",

"SystemInit",

"EntityMetadata",

"EntityRegistry",

"SchemaRegistry",

"SchemaManager",

"Database",

"RepositoryFactory",

"EntityService",

"ModuleRegistry"


],



timestamp:
new Date().toISOString()



};


}



};









// ============================================================
// GLOBAL COMMAND API
// ============================================================



function erpStart(){

return App.start();

}



function erpHealth(){

return App.health();

}



function erpDiag(){

return App.diagnostics();

}



function erpReset(){

return App.reset();

}



function erpInfo(){

return App.info();

}







globalThis.App=App;



Logger.log(

"App READY v"+
App.version

);