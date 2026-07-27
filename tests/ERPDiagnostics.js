// ============================================================
// ERPDiagnostics v5.0.0
// Enterprise ERP Diagnostic Engine
// TaxControl ERP Core
//
// Compatible:
// SystemInit v2.5+
// Bootstrap v0.6+
// HealthService v2.x
// RepositoryFactory v2.5+
// EntityService v5.x
// CoreInfrastructureTest v2.5+
// ============================================================


console.log("ERPDiagnostics v5.0.0");



const ERPDiagnostics = {


version:"5.0.0",



// ============================================================
// MAIN RUN
// ============================================================


run(options={}){


Logger.log(
"========== ERP DIAGNOSTICS v5 START =========="
);



const result={


version:this.version,


timestamp:
new Date().toISOString(),



health:{},


system:{},


core:{},


repositories:{},


entities:{},


modules:{},


events:{},


security:{},


audit:{},


migration:{},


coreTest:null,


status:"UNKNOWN"


};




try{



// HEALTH SERVICE

if(
typeof HealthService!=="undefined"
){

result.health =
HealthService.summary();

}




// SYSTEM

result.system =
this.system();




// CORE

result.core =
this.core();




// REPOSITORIES

result.repositories =
this.repositories();




// ENTITIES

result.entities =
this.entities();




// MODULES

result.modules =
this.modules();




// EVENTS

result.events =
this.events();




// SECURITY

result.security =
this.security();




// AUDIT

result.audit =
this.audit();




// MIGRATION

result.migration =
this.migration();




// CORE TEST

if(
options.skipCoreTest!==true
&&
typeof CoreInfrastructureTest!=="undefined"
){

result.coreTest =
CoreInfrastructureTest.run(
{
safe:true
}
);


}





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
"========== ERP DIAGNOSTICS COMPLETE =========="
);



return result;



}
catch(e){



Logger.error(
"ERP DIAGNOSTICS FAILED "+
e.message
);



result.status="FAILED";

result.error=e.message;



return result;


}



},







// ============================================================
// SYSTEM
// ============================================================


system(){


if(
typeof SystemInit==="undefined"
){

return {
available:false
};

}



return{


available:true,


version:
SystemInit.version,


initialized:
SystemInit.initialized,


initializing:
SystemInit.initializing,


started:
Object.keys(
SystemInit.started || {}
),


components:
SystemInit.componentStatus,


failed:
(SystemInit.bootLog||[])
.filter(
x=>x.status==="FAILED"
)


};


},







// ============================================================
// CORE
// ============================================================


core(){


const list=[


"Config",

"Logger",

"EntityMetadata",

"EntityRegistry",

"SchemaRegistry",

"SchemaManager",

"Database",

"BaseRepository",

"RepositoryFactory",

"EntityService",

"EventBus"


];



const result={};



list.forEach(name=>{


result[name]=
typeof globalThis[name]!=="undefined";


});



return result;


},







// ============================================================
// REPOSITORIES
// ============================================================


repositories(){


if(
typeof RepositoryFactory==="undefined"
){

return {
available:false
};

}



return{


available:true,


version:
RepositoryFactory.version,


initialized:
RepositoryFactory.initialized,


count:
RepositoryFactory.count(),


loaded:
RepositoryFactory.list(),


pending:
RepositoryFactory.pendingReport
?
RepositoryFactory.pendingReport()
:
[],



missing:
RepositoryFactory.missingRepositories
?
RepositoryFactory.missingRepositories()
:
[],



health:
RepositoryFactory.health
?
RepositoryFactory.health()
:
null


};



},







// ============================================================
// ENTITIES
// ============================================================


entities(){


if(
typeof EntityRegistry==="undefined"
){

return {
available:false
};

}



const list =
EntityRegistry.list();



let repositoryCoverage=0;



if(
typeof RepositoryFactory!=="undefined"
){


repositoryCoverage =
list.length
?
Math.round(

RepositoryFactory.list().length /
list.length *
100

)
:
0;


}



return{


available:true,


count:list.length,


entities:list,


repositoryCoverage


};



},







// ============================================================
// MODULES
// ============================================================


modules(){


if(
typeof ModuleRegistry==="undefined"
){

return {
available:false
};

}



return{


available:true,


initialized:
ModuleRegistry.initialized===true,


modules:
ModuleRegistry.list
?
ModuleRegistry.list()
:
[],


failed:
ModuleRegistry.failed || []


};



},







// ============================================================
// EVENTS
// ============================================================


events(){


if(
typeof EventBus==="undefined"
){

return {
available:false
};

}



return{


available:true,


ready:
EventBus.ready===true,


version:
EventBus.version,


events:
EventBus.list
?
EventBus.list()
:
[]


};



},







// ============================================================
// SECURITY
// ============================================================


security(){


if(
typeof SecurityGuard==="undefined"
){

return {
available:false
};

}



return{


available:true,


health:
SecurityGuard.health
?
SecurityGuard.health()
:
"OK"


};



},







// ============================================================
// AUDIT
// ============================================================


audit(){


if(
typeof AuditLog==="undefined"
){

return {
available:false
};

}



return{


available:true,


health:
AuditLog.health
?
AuditLog.health()
:
"OK"


};



},







// ============================================================
// MIGRATION
// ============================================================


migration(){


if(
typeof MigrationManager==="undefined"
){

return {
available:false
};

}



return{


available:true,


health:
MigrationManager.health
?
MigrationManager.health()
:
"OK"


};



},







// ============================================================
// STATUS CALCULATOR
// ============================================================


calculateStatus(data){


let critical=0;

let warning=0;





// system

if(
!data.system.initialized
){

warning++;

}





// repositories

if(
data.repositories.available
&&
data.repositories.missing.length
){

warning++;

}





// entity coverage

if(
data.entities.repositoryCoverage<80
){

warning++;

}





// modules

if(
data.modules.failed
&&
data.modules.failed.length
){

critical++;

}





// core test

if(
data.coreTest?.summary?.failed>0
){

critical++;

}





if(critical>0){

return "CRITICAL";

}



if(warning>0){

return "WARNING";

}



return "HEALTHY";


},







// ============================================================
// HEALTH CONTRACT
// ============================================================


health(){


const report =
this.run(
{
skipCoreTest:true
}
);



return HealthContract.create(

"ERPDiagnostics",

report.status,

report

);


}



};







globalThis.ERPDiagnostics =
ERPDiagnostics;



Logger.log(
"ERPDiagnostics READY v"+
ERPDiagnostics.version
);