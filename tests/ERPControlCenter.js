// ============================================================
// ERPControlCenter v2.0.0
// TaxControl ERP Core
//
// Enterprise Runtime Control Center
//
// Aggregates:
//
// ERPBootstrap
// Bootstrap
// SystemInit
// ERPDiagnostics
// SchemaManager
// Database
// RepositoryFactory
// RepositoryRegistry
// RepositoryHealthReport
// EntityService
// EventBus
// ModuleRegistry
//
// Compatible:
//
// ERPBootstrap v3+
// Bootstrap v3+
// SystemInit v2.9+
// RepositoryRegistry v2+
// RepositoryHealthReport v2+
// ERPDiagnostics v5+
//
// ============================================================


console.log(
"ERPControlCenter v2.0.0"
);





const ERPControlCenter = {


// ============================================================
// META
// ============================================================


version:"2.0.0",

lastReport:null,

startedAt:null,







// ============================================================
// FULL RUN
// ============================================================


run(options={}){


Logger.log(
"========== ERP CONTROL CENTER START =========="
);



const report={


version:this.version,


timestamp:
new Date().toISOString(),



application:{},


bootstrap:{},


system:{},


diagnostics:{},


repositories:{},


runtime:{},


readiness:{},


errors:[]


};








// ============================================================
// APPLICATION
// ============================================================


this.safeHealth(
report.application,
"App",
App
);



// ============================================================
// BOOTSTRAP
// ============================================================


this.safeHealth(
report.bootstrap,
"ERPBootstrap",
ERPBootstrap
);



this.safeHealth(
report.bootstrap,
"Bootstrap",
Bootstrap
);








// ============================================================
// SYSTEM
// ============================================================


this.safeHealth(
report.system,
"SystemInit",
SystemInit
);








// ============================================================
// ERP DIAGNOSTICS
// ============================================================


try{


if(
typeof ERPDiagnostics!=="undefined"
&&
ERPDiagnostics.run
){


report.diagnostics =
ERPDiagnostics.run({

skipCoreTest:
options.skipCoreTest!==false

});


}


}
catch(e){


report.errors.push(
"ERPDiagnostics: "+
e.message
);


}








// ============================================================
// REPOSITORIES
// ============================================================


try{


if(
typeof RepositoryHealthReport!=="undefined"
){


report.repositories =
RepositoryHealthReport.details();


}


}
catch(e){


report.errors.push(
"RepositoryHealthReport: "+
e.message
);


}








// ============================================================
// RUNTIME
// ============================================================


const runtimeModules=[


"Database",

"SchemaManager",

"SchemaRegistry",

"EntityRegistry",

"RepositoryFactory",

"RepositoryRegistry",

"EntityService",

"EventBus",

"ModuleRegistry"


];





runtimeModules.forEach(
name=>{


this.safeHealth(

report.runtime,

name,

globalThis[name]

);


}

);








// ============================================================
// READINESS
// ============================================================


report.readiness =
this.calculateReadiness(
report
);






report.status =

report.errors.length

?

"WARNING"


:

report.readiness.percent>=90

?

"READY"


:

"DEGRADED";







this.lastReport =
report;



Logger.log(
"========== ERP CONTROL CENTER COMPLETE =========="
);



Logger.log(

JSON.stringify(
report,
null,
2
)

);



return report;


},







// ============================================================
// SAFE HEALTH
// ============================================================


safeHealth(
target,
name,
obj
){


if(
!obj
){


target[name]={

status:"NOT_LOADED"

};


return;


}




try{


if(
typeof obj.health==="function"
){


target[name]=
obj.health();


}
else{


target[name]={

status:"LOADED"

};


}



}
catch(e){



target[name]={


status:"FAILED",

error:e.message


};



}


},







// ============================================================
// READINESS
// ============================================================


calculateReadiness(report){



const checks={



system:

this.checkStatus(
report.system.SystemInit
),



database:

this.checkStatus(
report.runtime.Database
),



schema:

this.checkStatus(
report.runtime.SchemaManager
),



repositoryFactory:

this.checkStatus(
report.runtime.RepositoryFactory
),



repositoryRegistry:

this.checkStatus(
report.runtime.RepositoryRegistry
),



entityService:

this.checkStatus(
report.runtime.EntityService
),



eventBus:

this.checkStatus(
report.runtime.EventBus
),



modules:

this.checkStatus(
report.runtime.ModuleRegistry
),



repositories:


!!report.repositories
&&

(
report.repositories.summary?.readyPercent>=90
)


};






const total =
Object.keys(checks).length;



const ready =
Object.values(checks)
.filter(Boolean)
.length;





return {


checks,


ready,


total,


percent:

Math.round(
ready/total*100
)


};



},







// ============================================================
// STATUS
// ============================================================


checkStatus(data){


if(!data){

return false;

}



return (

data.status==="OK"

||

data.status==="READY"

);



},







// ============================================================
// STATUS SHORT
// ============================================================


status(){



if(!this.lastReport){

this.run();

}



return {


status:
this.lastReport.status,


readiness:
this.lastReport.readiness.percent,


timestamp:
this.lastReport.timestamp



};


},







// ============================================================
// PRINT
// ============================================================


print(){



const report =
this.run();



Logger.log(
"================================"
);



Logger.log(
"TAXCONTROL ERP CONTROL CENTER"
);



Logger.log(
"VERSION "+
this.version
);



Logger.log(
"STATUS "+
report.status
);



Logger.log(

"READINESS "+
report.readiness.percent+
"%"

);



Logger.log(
"================================"
);





return report;


},







// ============================================================
// EXPORT
// ============================================================


exportReport(){


if(!this.lastReport){

this.run();

}



return JSON.stringify(

this.lastReport,

null,

2

);


},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){


return {


module:
"ERPControlCenter",


version:
this.version,


hasReport:
!!this.lastReport,


lastReport:
this.lastReport
?


{

status:
this.lastReport.status,


readiness:
this.lastReport.readiness


}

:

null,



timestamp:
new Date()
.toISOString()


};


},







// ============================================================
// HEALTH
// ============================================================


health(){


const status =
this.lastReport
?
this.lastReport.status
:
"WARNING";



const data={


version:this.version,


ready:
!!this.lastReport,


readiness:
this.lastReport?.readiness || null


};



if(
typeof HealthContract!=="undefined"
&&
HealthContract.create
){


return HealthContract.create(

"ERPControlCenter",

status,

data

);


}



return {


module:"ERPControlCenter",

status,

...data


};



}



};









// ============================================================
// GLOBAL
// ============================================================


globalThis.ERPControlCenter =
ERPControlCenter;







Logger.log(

"ERPControlCenter READY v"+
ERPControlCenter.version

);