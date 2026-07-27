/**
 * ============================================================
 * ERP Bootstrap v3.0
 *
 * Unified ERP Entry Point
 *
 * TaxControl ERP Core
 *
 *
 * startERP()
 *      |
 *      v
 * ERPBootstrap.start()
 *      |
 *      v
 * Bootstrap.start()
 *      |
 *      v
 * SystemInit.init()
 *
 *
 * Commands:
 *
 * startERP()
 *
 * erpHealth()
 *
 * erpDiag()
 *
 * resetERP()
 *
 * ============================================================
 */


console.log("ERP Bootstrap v3.0");




// ============================================================
// GLOBAL STATE
// ============================================================


globalThis.__ERP_STATE__ =
globalThis.__ERP_STATE__
||
{


started:false,


starting:false,


startedAt:null,


error:null,


version:"3.0.0"



};









const ERPBootstrap = {


version:"3.0.0",






// ============================================================
// START
// ============================================================


async start(){



const state =
globalThis.__ERP_STATE__;





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



return;



}





state.starting=true;

state.error=null;



Logger.log(
"========== ERP START =========="
);





try{



// -------------------------
// CHECK BOOTSTRAP
// -------------------------


if(
typeof Bootstrap==="undefined"
){


throw new Error(
"Bootstrap controller missing"
);


}





// -------------------------
// MAIN START
// -------------------------


const result =
await Bootstrap.start();






state.started=true;


state.startedAt =
new Date().toISOString();



Logger.log(
"========== ERP READY =========="
);




return result;



}
catch(e){



state.started=false;


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
globalThis.__ERP_STATE__;





let system=null;



if(
typeof Bootstrap!=="undefined"
&&
Bootstrap.health
){


system =
Bootstrap.health();


}





return {


module:"ERPBootstrap",


version:this.version,


status:
state.started
?
"READY"
:
"WARNING",


state,


system



};



},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){



return {


version:this.version,


state:
globalThis.__ERP_STATE__,


bootstrap:

typeof Bootstrap!=="undefined"

?

Bootstrap.diagnostics?.()

:

null,



system:

typeof SystemInit!=="undefined"

?

SystemInit.diagnostics?.()

:

null,



modules:

typeof ModuleLoader!=="undefined"

?

ModuleLoader.getStatus?.()

:

null,



repositories:

typeof RepositoryFactory!=="undefined"

?

RepositoryFactory.diagnostics?.()

:

null



};



},







// ============================================================
// RESET
// ============================================================


reset(){



Logger.warn(
"ERP RESET"
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
typeof SystemInit!=="undefined"
&&
SystemInit.reset
){

SystemInit.reset();

}





globalThis.__ERP_STATE__={


started:false,


starting:false,


startedAt:null,


error:null,


version:this.version


};





Logger.log(
"ERP RESET COMPLETE"
);



return true;



}
catch(e){



Logger.error(
"ERP RESET FAILED "+
e.message
);



return false;



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







Logger.log(
"ERP COMMANDS READY"
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