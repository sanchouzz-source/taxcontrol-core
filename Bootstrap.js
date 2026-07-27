// ============================================================
// Bootstrap v2.0.0
// ERP Startup Controller
// TaxControl ERP Core
//
// Compatible:
//
// SystemInit v2.5+
// ERPDiagnostics v4+
// TestRunner v2+
// Inspector
// HealthContract
// ============================================================


console.log("Bootstrap v2.0.0");



globalThis.__ERP_STATE__ =
globalThis.__ERP_STATE__
||
{


started:false,

starting:false,

failed:false,

startedAt:null,

error:null

};







const Bootstrap = {


version:"2.0.0",




get state(){

return globalThis.__ERP_STATE__;

},







// ============================================================
// START
// ============================================================


async start(){


const state=this.state;



if(state.started){


Logger.warn(
"ERP already started"
);


return this.health();


}



if(state.starting){


Logger.warn(
"ERP startup already running"
);


return;

}



state.starting=true;

state.failed=false;



Logger.log(
"========== ERP BOOT START =========="
);



try{


state.startedAt =
new Date().toISOString();




// -------------------------
// SYSTEM INIT
// -------------------------


if(
typeof SystemInit==="undefined"
){

throw new Error(
"SystemInit unavailable"
);

}




const result =
await SystemInit.init();





state.started=true;

state.starting=false;



Logger.log(
"========== ERP BOOT COMPLETE =========="
);



return result;



}
catch(e){



state.failed=true;

state.error=e.message;

state.started=false;



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


Logger.log(
"ERP SHUTDOWN"
);



if(
typeof SystemInit!=="undefined"
&&
SystemInit.reset
){


SystemInit.reset();


}



this.reset();



return true;


},







// ============================================================
// HEALTH
// ============================================================


health(){


try{


if(
typeof SystemInit!=="undefined"
&&
SystemInit.health
){


return {


bootstrap:this.state,


system:
SystemInit.health()



};


}




return {


status:"UNKNOWN",

bootstrap:this.state


};



}
catch(e){


return {


status:"FAILED",

error:e.message


};



}



},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){



return {


version:this.version,


state:this.state,


system:

typeof SystemInit!=="undefined"

&&

SystemInit.diagnostics

?

SystemInit.diagnostics()

:

null,



repositories:

typeof RepositoryFactory!=="undefined"

?

RepositoryFactory.diagnostics?.()

:

null,



tests:

typeof TestRunner!=="undefined"

?

TestRunner.health?.()

:

null



};



},







// ============================================================
// RESET
// ============================================================


reset(){



globalThis.__ERP_STATE__={


started:false,

starting:false,

failed:false,

startedAt:null,

error:null


};



Logger.log(
"Bootstrap RESET COMPLETE"
);



},







// ============================================================
// READY CHECK
// ============================================================


isReady(){


return (

this.state.started

&&

typeof SystemInit!=="undefined"

&&

SystemInit.initialized

);



},







// ============================================================
// HEALTH CONTRACT
// ============================================================


healthContract(){



return HealthContract.create(

"Bootstrap",

this.isReady()
?
"OK"
:
"WARNING",

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
// COMMANDS
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