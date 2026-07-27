// ============================================================
// SystemStartupTest v1.0.0
// ERP Enterprise Startup Validation
// TaxControl ERP Core
//
// Compatible:
//
// SystemInit v2.5+
// Bootstrap v2+
// TestRunner v2.1+
// ERPDiagnostics v4.1+
// CoreInfrastructureTest v2.6+
// EntityService v5+
// ============================================================


console.log("SystemStartupTest v1.0");



const SystemStartupTest = {


version:"1.0.0",



// ============================================================
// FULL STARTUP CHECK
// ============================================================


run(){


Logger.log(
"========== SYSTEM STARTUP TEST v1 =========="
);



const result={


version:this.version,


timestamp:
new Date().toISOString(),



boot:{},

health:{},

diagnostics:{},

core:{},

lifecycle:{},

repair:{},


status:"UNKNOWN"



};



try{



// ==================================================
// STEP 1 BOOT
// ==================================================


Logger.log(
"STEP 1: ERP BOOT"
);



result.boot =
this.boot();






// ==================================================
// STEP 2 HEALTH
// ==================================================


Logger.log(
"STEP 2: HEALTH"
);



result.health =
this.health();






// ==================================================
// STEP 3 DIAGNOSTICS
// ==================================================


Logger.log(
"STEP 3: DIAGNOSTICS"
);



result.diagnostics =
this.diagnostics();






// ==================================================
// STEP 4 CORE
// ==================================================


Logger.log(
"STEP 4: CORE INFRASTRUCTURE"
);



if(
typeof CoreInfrastructureTest!=="undefined"
){


result.core =
CoreInfrastructureTest.run(
{
safe:true
}
);


}






// ==================================================
// STEP 5 ENTITY
// ==================================================


Logger.log(
"STEP 5: ENTITY LIFECYCLE"
);



if(
typeof TestEntityLifecycleMatrix!=="undefined"
){


result.lifecycle =
TestEntityLifecycleMatrix.run(
{
safe:true
}
);


}







// ==================================================
// STEP 6 REPAIR
// ==================================================


Logger.log(
"STEP 6: DATA REPAIR CHECK"
);



result.repair =
this.repair();







result.status =
this.calculateStatus(result);






Logger.log(

JSON.stringify(
result,
null,
2
)

);



Logger.log(
"========== SYSTEM STARTUP COMPLETE =========="
);



return result;



}
catch(e){



Logger.error(

"SYSTEM STARTUP FAILED "+
e.message

);



result.status="FAILED";

result.error=e.message;



return result;


}



},







// ============================================================
// BOOT
// ============================================================


boot(){


if(
typeof startERP==="function"
){


return startERP();


}



if(
typeof SystemInit!=="undefined"
){


return SystemInit.init();


}



throw new Error(
"ERP startup command missing"
);


},







// ============================================================
// HEALTH
// ============================================================


health(){



const result={};



if(
typeof erpHealth==="function"
){


result.system =
erpHealth();


}



if(
typeof TestRunner!=="undefined"
&&
TestRunner.health
){


result.tests =
TestRunner.health();


}



if(
typeof HealthService!=="undefined"
&&
HealthService.checkAll
){


result.modules =
HealthService.checkAll();


}



return result;


},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){


if(
typeof ERPDiagnostics!=="undefined"
){


return ERPDiagnostics.run();


}



return {


status:
"ERPDiagnostics unavailable"


};


},







// ============================================================
// REPAIR
// ============================================================


repair(){



if(
typeof DataRepair==="undefined"
){


return {


status:
"SKIPPED",


reason:
"DataRepair unavailable"


};


}



try{


if(
typeof DataRepair.scan==="function"
){


return DataRepair.scan();


}



return {


status:
"AVAILABLE"


};



}
catch(e){


return {


status:
"ERROR",


error:e.message


};


}



},







// ============================================================
// STATUS
// ============================================================


calculateStatus(result){


let failed=0;



if(
result.boot===false
){

failed++;

}



if(
result.core?.summary?.failed>0
){

failed++;

}



if(
result.lifecycle?.summary?.failed>0
){

failed++;

}



if(
result.diagnostics?.status==="CRITICAL"
){

failed++;

}



if(
failed===0
){

return "ERP_READY";

}



if(
failed<=2
){

return "WARNING";

}



return "FAILED";


},







// ============================================================
// HEALTH
// ============================================================


health(){


return HealthContract.create(

"SystemStartupTest",

"OK",

{


version:this.version,


command:
"run()"


}

);


}



};







// ============================================================
// EXTRA COMMANDS
// ============================================================


function testDataRepair(){


if(
typeof DataRepair==="undefined"
){

throw new Error(
"DataRepair unavailable"
);

}



return DataRepair.scan();


}




function testEntityServiceBoot(){



if(
typeof EntityService==="undefined"
){

throw new Error(
"EntityService missing"
);

}



return EntityService.health();


}






// ============================================================
// EXPORT
// ============================================================


globalThis.SystemStartupTest =
SystemStartupTest;



globalThis.testSystemStartup =
function(){

return SystemStartupTest.run();

};



globalThis.testDataRepair =
testDataRepair;



globalThis.testEntityServiceBoot =
testEntityServiceBoot;



Logger.log(
"SystemStartupTest READY v"+
SystemStartupTest.version
);