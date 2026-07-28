// ============================================================
// App v4.0.0
// TaxControl ERP Application Facade
//
// Enterprise Application Lifecycle Controller
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
//  |
//  +-- Schema
//  +-- Database
//  +-- Repository
//  +-- Events
//  +-- Modules
//
// Compatible:
//
// SystemInit v2.8+
// ERPDiagnostics v6+
// RepositoryFactory v3+
// RepositoryRegistry v2+
// SchemaRegistry v4+
//
// ============================================================


console.log(
"App v4.0.0"
);





const App = {


// ============================================================
// META
// ============================================================


version:"4.0.0",

apiVersion:"4.0",

name:"TaxControl ERP",

platform:"Google Apps Script",


state:{


status:"CREATED",

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
"APP INIT v"+
this.version
);



if(
typeof SystemInit==="undefined"
){

throw new Error(
"SystemInit unavailable"
);

}



this.state.status="INITIALIZED";



return true;


},







// ============================================================
// START
// ============================================================


start(){


this.init();



if(this.state.started){


return {


status:"ALREADY_STARTED",

startedAt:
this.state.startedAt


};


}




if(this.state.starting){

throw new Error(
"ERP startup already running"
);

}



try{


this.state.starting=true;


this.state.status="STARTING";



Logger.log(
"========== ERP BOOT START =========="
);





const result =
SystemInit.init();






this.state.started=true;

this.state.starting=false;

this.state.status="READY";


this.state.startedAt =
new Date();





Logger.log(
"========== ERP READY =========="
);





return {


status:"READY",

version:this.version,

result,


startedAt:
this.state.startedAt


};



}
catch(e){



this.state.starting=false;

this.state.status="FAILED";


this.state.lastError=e.message;



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



const add=(name,obj)=>{


if(obj){

modules[name]=obj;

}


};





try{



add(
"SystemInit",
SystemInit?.health?.()
);



add(
"ERPDiagnostics",
ERPDiagnostics?.health?.()
);



add(
"RepositoryRegistry",
RepositoryRegistry?.health?.()
);



add(
"RepositoryFactory",
RepositoryFactory?.health?.()
);



add(
"SchemaRegistry",
SchemaRegistry?.health?.()
);



add(
"Database",
Database?.health?.()
);



add(
"EventBus",
EventBus?.health?.()
);



add(
"ModuleRegistry",
ModuleRegistry?.health?.()
);






return {


module:"App",

version:this.version,


status:
this.state.status,


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
// READINESS
// ============================================================


readiness(){



if(
typeof ERPDiagnostics==="undefined"
){

return {


score:0,

status:"NO_DIAGNOSTICS"


};


}



const report =
ERPDiagnostics.run({

skipCoreTest:true

});



return {


score:
report.readiness,


status:
report.status


};



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

SystemInit?.diagnostics?.()
||
null,



erpDiagnostics:

ERPDiagnostics?.run?.({

skipCoreTest:true

})
||
null,



repository:

RepositoryHealthReport?.details?.()
||
null,



schema:

SchemaRegistry?.diagnostics?.()
||
null,



database:

Database?.diagnostics?.()
||
null,



factory:

RepositoryFactory?.diagnostics?.()
||
null,



timestamp:
new Date().toISOString()


};



},







// ============================================================
// VERSION REPORT
// ============================================================


versionReport(){


return {


ERP:this.version,


SystemInit:
SystemInit?.version || "-",


ERPDiagnostics:
ERPDiagnostics?.version || "-",


SchemaRegistry:
SchemaRegistry?.version || "-",


SchemaManager:
SchemaManager?.version || "-",


Database:
Database?.version || "-",


BaseRepository:
BaseRepository?.version || "-",


RepositoryFactory:
RepositoryFactory?.version || "-",


RepositoryRegistry:
RepositoryRegistry?.version || "-",


EventBus:
EventBus?.version || "-"


};


},







// ============================================================
// RESET DEVELOPMENT
// ============================================================


reset(){



Logger.warn(
"ERP RESET"
);



try{



this.state={


status:"CREATED",

started:false,

starting:false,

startedAt:null,

lastError:null


};







SystemInit?.reset?.();



SchemaRegistry?.reset?.();



EntityRegistry?.reset?.();



RepositoryFactory?.reset?.();





if(
typeof RepositoryRegistry!=="undefined"
){

RepositoryRegistry.repositories={};

RepositoryRegistry.ready=false;

}




Database?.reset?.();



EventBus?.reset?.();



ModuleRegistry?.reset?.();






Logger.log(
"ERP RESET COMPLETE"
);





return {


status:"OK"

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
// STATUS
// ============================================================


status(){



return {


application:this.name,


version:this.version,


state:this.state,


readiness:
this.readiness(),


timestamp:
new Date().toISOString()


};


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

"ERPDiagnostics",

"EntityMetadata",

"EntityRegistry",

"SchemaRegistry",

"SchemaManager",

"SchemaStorage",

"Database",

"BaseRepository",

"RepositoryFactory",

"RepositoryRegistry",

"EntityService",

"EventBus",

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



function erpStatus(){

return App.status();

}








globalThis.App =
App;







Logger.log(

"App READY v"+
App.version

);