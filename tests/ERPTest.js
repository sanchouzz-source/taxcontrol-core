// ============================================================
// ERP Health Test v2.1.0
// Enterprise ERP diagnostic launcher
// TaxControl ERP Core
//
// Compatible:
//
// SystemInit v2.9+
// RepositoryRegistry v2.1+
// RepositoryHealthReport v2.1+
// RepositoryFactory v3+
//
// ============================================================


console.log(
"ERPHealthTest v2.1.0"
);





function erpHealthTest(){



Logger.log(
"========== ERP HEALTH REQUEST =========="
);



let report={};





try{



// ============================================================
// BOOT SYSTEM
// ============================================================


if(
typeof SystemInit==="undefined"
||
typeof SystemInit.init!=="function"
){

throw new Error(
"SystemInit unavailable"
);

}



Logger.log(
"Starting ERP SystemInit..."
);



SystemInit.init();







// ============================================================
// CORE HEALTH
// ============================================================


report.system =
SystemInit.health();







// ============================================================
// EXTENDED MODULE HEALTH
// ============================================================


const modules={};







// DATABASE

if(
typeof Database!=="undefined"
&&
Database.health
){


modules.Database =
Database.health();


}







// SCHEMA


if(
typeof SchemaManager!=="undefined"
&&
SchemaManager.health
){


modules.SchemaManager =
SchemaManager.health();


}







// REPOSITORY REGISTRY


if(
typeof RepositoryRegistry!=="undefined"
&&
RepositoryRegistry.health
){


modules.RepositoryRegistry =
RepositoryRegistry.health();


}







// REPOSITORY HEALTH REPORT


if(
typeof RepositoryHealthReport!=="undefined"
){


modules.RepositoryHealthReport =
RepositoryHealthReport.health();



modules.RepositoryDetails =
RepositoryHealthReport.details();



}







// FACTORY


if(
typeof RepositoryFactory!=="undefined"
&&
RepositoryFactory.health
){


modules.RepositoryFactory =
RepositoryFactory.health();


}







// SERVICE


if(
typeof EntityService!=="undefined"
&&
EntityService.health
){


modules.EntityService =
EntityService.health();


}







// EVENTS


if(
typeof EventBus!=="undefined"
&&
EventBus.health
){


modules.EventBus =
EventBus.health();


}







// MODULES


if(
typeof ModuleRegistry!=="undefined"
&&
ModuleRegistry.health
){


modules.ModuleRegistry =
ModuleRegistry.health();


}







report.modules =
modules;







// ============================================================
// READINESS
// ============================================================


report.readiness={



core:

!!SystemInit.initialized,



schema:

typeof SchemaManager!=="undefined"
&&
SchemaManager.initialized,



database:

typeof Database!=="undefined",



repository:

typeof RepositoryRegistry!=="undefined"
&&
RepositoryRegistry.count()>0,



service:

typeof EntityService!=="undefined",



events:

typeof EventBus!=="undefined",



modules:

typeof ModuleRegistry!=="undefined"



};







const ready =
Object.values(
report.readiness
)
.filter(Boolean)
.length;





const total =
Object.keys(
report.readiness
)
.length;







report.readinessPercent =
Math.round(
ready/total*100
);






report.status =

report.readinessPercent>=90

?

"READY"

:

"WARNING";







}
catch(e){



Logger.error(

"ERP HEALTH FAILED: "
+
e.message

);



report={


status:"FAILED",


module:"ERP",


error:e.message,


stack:e.stack



};



}







Logger.log(
"========== ERP HEALTH REPORT =========="
);





Logger.log(

JSON.stringify(
report,
null,
2
)

);







return report;



}






globalThis.erpHealthTest =
erpHealthTest;





Logger.log(
"ERPHealthTest READY v2.1.0"
);