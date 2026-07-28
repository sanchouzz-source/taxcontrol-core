// ============================================================
// ERPBootstrap v4.0.0
//
// Unified ERP Entry Point
//
// TaxControl ERP Core
//
// Architecture:
//
// startERP()
//      |
//      v
// ERPBootstrap.start()
//      |
//      v
// Bootstrap.start()
//      |
//      v
// App.start()
//      |
//      v
// SystemInit.init()
//
//
// Commands:
//
// startERP()
//
// erpHealth()
//
// erpDiag()
//
// resetERP()
//
// ============================================================


console.log(
"ERPBootstrap v4.0.0"
);






// ============================================================
// GLOBAL STATE
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


version:"4.0.0"



};








const ERPBootstrap = {



// ============================================================
// META
// ============================================================


version:"4.0.0",







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
"ERP startup locked"
);



return {

status:"STARTING"

};


}





state.starting=true;

state.status="STARTING";

state.error=null;



const startTime =
Date.now();





Logger.log(
"========== ERP START =========="
);





try{





// ------------------------------------------------
// BOOTSTRAP CONTROLLER
// ------------------------------------------------


if(
typeof Bootstrap==="undefined"
){


throw new Error(
"Bootstrap controller unavailable"
);


}






// ------------------------------------------------
// START CORE
// ------------------------------------------------


const result =
await Bootstrap.start();







state.started=true;

state.failed=false;

state.status="READY";


state.startedAt =
new Date().toISOString();


state.finishedAt =
new Date().toISOString();


state.duration =
Date.now()-startTime;







Logger.log(

"========== ERP READY "
+
state.duration
+
" ms =========="

);





return {


status:"READY",


duration:
state.duration,


result


};





}
catch(e){



state.started=false;

state.failed=true;

state.status="FAILED";


state.error=e.message;



Logger.error(

"ERP START FAILED "+
e.message

);



throw e;


}

finally{


state.starting=false;


}



},







// ============================================================
// HEALTH
// ============================================================


health(){



const state =
this.state;




let diagnostics=null;





try{



if(
typeof ERPDiagnostics!=="undefined"
&&
ERPDiagnostics.run
){


diagnostics =
ERPDiagnostics.run({

skipCoreTest:true

});


}



}
catch(e){


diagnostics={

status:"FAILED",

error:e.message

};


}






return {


module:"ERPBootstrap",


version:this.version,


status:
state.status,


state,


readiness:

diagnostics?.readiness
||
0,



diagnostics



};



},







// ============================================================
// STATUS
// ============================================================


status(){



return {


version:this.version,


state:this.state,


ready:
this.state.started,


timestamp:
new Date().toISOString()


};


},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){



return {


module:"ERPBootstrap",


version:this.version,



state:this.state,





bootstrap:

typeof Bootstrap!=="undefined"

?

Bootstrap.diagnostics?.()

:

null,






app:

typeof App!=="undefined"

?

App.diagnostics?.()

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

null,







repositories:

typeof RepositoryHealthReport!=="undefined"

?

RepositoryHealthReport.details?.()

:

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


ERPBootstrap:
this.version,


Bootstrap:
Bootstrap?.version || "-",


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



Logger.warn(
"ERP RESET START"
);



try{



if(
typeof Bootstrap!=="undefined"
&&
Bootstrap.reset
){

Bootstrap.reset();

}





if(
typeof App!=="undefined"
&&
App.reset
){

App.reset();

}





globalThis.__ERP_STATE__={


status:"CREATED",


started:false,


starting:false,


failed:false,


startedAt:null,


finishedAt:null,


duration:null,


error:null,


version:this.version


};






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


status:"FAILED",

error:e.message


};


}



}



};









// ============================================================
// COMMANDS
// ============================================================


async function startERP(){


return ERPBootstrap.start();


}







function erpHealth(){


const result =
ERPBootstrap.health();



Logger.log(
JSON.stringify(
result,
null,
2
)
);



return result;


}








function erpDiag(){



const result =
ERPBootstrap.diagnostics();



Logger.log(
JSON.stringify(
result,
null,
2
)
);



return result;


}








function resetERP(){


return ERPBootstrap.reset();


}








function erpVersion(){


const result =
ERPBootstrap.versionReport();



Logger.log(
JSON.stringify(
result,
null,
2
)
);



return result;


}









// ============================================================
// EXPORT
// ============================================================


globalThis.ERPBootstrap =
ERPBootstrap;



globalThis.startERP =
startERP;


globalThis.erpHealth =
erpHealth;


globalThis.erpDiag =
erpDiag;


globalThis.resetERP =
resetERP;


globalThis.erpVersion =
erpVersion;








Logger.log(
"ERP COMMANDS READY v4.0.0"
);


Logger.log(
" startERP()"
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


Logger.log(
" erpVersion()"
);