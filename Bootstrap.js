// ============================================================
// Bootstrap v3.0.0
// Enterprise ERP Startup Controller
// TaxControl ERP Core
//
// Role:
//
// Bootstrap
//      |
//      v
// App
//      |
//      v
// SystemInit
//      |
//      v
// ERP Core
//
// Compatible:
//
// App v4+
// SystemInit v2.8+
// ERPDiagnostics v6+
// RepositoryRegistry v2+
// HealthContract
//
// ============================================================


console.log(
"Bootstrap v3.0.0"
);







// ============================================================
// GLOBAL ERP STATE
// ============================================================


globalThis.__ERP_STATE__ =
globalThis.__ERP_STATE__
||
{


status:"CREATED",


started:false,


starting:false,


failed:false,


startedAt:null,


finishedAt:null,


duration:null,


error:null,


bootCount:0


};








const Bootstrap = {



// ============================================================
// META
// ============================================================


version:"3.0.0",




get state(){


return globalThis.__ERP_STATE__;


},







// ============================================================
// START
// ============================================================


async start(){



const state =
this.state;





if(state.started){


Logger.warn(
"ERP already started"
);



return this.health();


}






if(state.starting){


Logger.warn(
"ERP boot already running"
);



return;


}







state.starting=true;

state.status="STARTING";

state.failed=false;

state.error=null;

state.bootCount++;





const startTime =
Date.now();





Logger.log(
"========== ERP BOOT START =========="
);





try{





// ------------------------------------------------
// APP LAYER
// ------------------------------------------------


if(
typeof App==="undefined"
){


throw new Error(
"App unavailable"
);


}





const result =
await App.start();






state.started=true;

state.starting=false;

state.status="READY";


state.startedAt =
new Date().toISOString();



state.finishedAt =
new Date().toISOString();



state.duration =
Date.now()-startTime;






Logger.log(

"========== ERP BOOT COMPLETE "
+
state.duration
+
"ms =========="

);






return {


status:"READY",


duration:
state.duration,


result


};



}

catch(e){



state.failed=true;

state.started=false;

state.status="FAILED";

state.error=e.message;



Logger.error(

"ERP BOOT FAILED "+
e.message

);



throw e;


}

finally{


state.starting=false;


}



},







// ============================================================
// STOP
// ============================================================


stop(){


Logger.warn(
"ERP SHUTDOWN"
);




try{


if(
typeof App!=="undefined"
&&
App.reset
){


App.reset();


}




this.reset();



return true;



}

catch(e){



Logger.error(
"ERP STOP FAILED "+
e.message
);



return false;


}



},







// ============================================================
// HEALTH
// ============================================================


health(){


try{



return {


module:"Bootstrap",


version:this.version,


state:this.state,



app:

typeof App!=="undefined"

?

App.health()

:

null,



diagnostics:

typeof ERPDiagnostics!=="undefined"

?

ERPDiagnostics.health()

:

null



};



}

catch(e){



return {


module:"Bootstrap",


status:"FAILED",

error:e.message


};



}



},







// ============================================================
// STATUS
// ============================================================


status(){


return {


version:this.version,


status:this.state.status,


started:this.state.started,


failed:this.state.failed,


duration:this.state.duration,


bootCount:this.state.bootCount


};


},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){



return {


bootstrap:


this.state,



app:

typeof App!=="undefined"

?

App.diagnostics()

:

null,



system:

typeof SystemInit!=="undefined"

?

SystemInit.diagnostics?.()

:

null,



erp:


typeof ERPDiagnostics!=="undefined"

?

ERPDiagnostics.run({

skipCoreTest:true

})

:

null



};


},







// ============================================================
// VERSION REPORT
// ============================================================


versionReport(){



return {


Bootstrap:this.version,


App:
App?.version || "-",


SystemInit:
SystemInit?.version || "-",


ERPDiagnostics:
ERPDiagnostics?.version || "-",


RepositoryRegistry:
RepositoryRegistry?.version || "-",


RepositoryFactory:
RepositoryFactory?.version || "-",


SchemaRegistry:
SchemaRegistry?.version || "-",


Database:
Database?.version || "-"



};


},







// ============================================================
// RESET
// ============================================================


reset(){



globalThis.__ERP_STATE__={


status:"CREATED",


started:false,


starting:false,


failed:false,


startedAt:null,


finishedAt:null,


duration:null,


error:null,


bootCount:this.state.bootCount


};



Logger.log(

"Bootstrap RESET COMPLETE"

);



},







// ============================================================
// READY
// ============================================================


isReady(){



return (

this.state.started

&&

typeof App!=="undefined"

&&

App.state.started

);



},







// ============================================================
// HEALTH CONTRACT
// ============================================================


healthContract(){



const status =
this.isReady()

?

"OK"

:

"WARNING";





return HealthContract.create(

"Bootstrap",

status,

{


version:this.version,


state:this.state


}


);



}



};








// ============================================================
// GLOBAL
// ============================================================


globalThis.Bootstrap =
Bootstrap;







// ============================================================
// COMMAND API
// ============================================================


globalThis.startERP=function(){

return Bootstrap.start();

};





globalThis.bootERP=function(){

return Bootstrap.start();

};





globalThis.erpHealth=function(){

return Bootstrap.health();

};





globalThis.bootHealth=function(){

return Bootstrap.health();

};





globalThis.erpDiag=function(){

return Bootstrap.diagnostics();

};





globalThis.bootDiag=function(){

return Bootstrap.diagnostics();

};





globalThis.resetERP=function(){

return Bootstrap.reset();

};









Logger.log(

"Bootstrap READY v"+
Bootstrap.version

);



Logger.log(
"ERP COMMANDS:"
);



Logger.log(
" startERP()"
);


Logger.log(
" bootERP()"
);


Logger.log(
" erpHealth()"
);


Logger.log(
" erpDiag()"
);


Logger.log(
" resetERP()"
);