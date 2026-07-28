// ============================================================
// ERPDiagnostics v6.0.0
// Enterprise ERP Diagnostic Engine
// TaxControl ERP Core
//
// Architecture:
//
// SystemInit
//      |
// ERPDiagnostics
//      |
// +--------------------+
// | Core               |
// | Schema             |
// | Database           |
// | Repository         |
// | Entity             |
// | Events             |
// | Security           |
// | Audit              |
// | Versioning         |
// +--------------------+
//
// Compatible:
//
// SystemInit v2.8+
// RepositoryFactory v3+
// RepositoryRegistry v2+
// BaseRepository v5.7+
// SchemaRegistry v4+
// SchemaStorage v2+
// RepositoryHealthReport v2+
//
// ============================================================


console.log(
"ERPDiagnostics v6.0.0"
);





const ERPDiagnostics = {


// ============================================================
// META
// ============================================================


version:"6.0.0",



// ============================================================
// MAIN RUN
// ============================================================


run(options={}){


const report={


version:this.version,


timestamp:
new Date().toISOString(),



status:"UNKNOWN",


readiness:0,



system:{},


core:{},


schema:{},


database:{},


repositories:{},


entities:{},


events:{},


security:{},


audit:{},


versioning:{},


migration:{},


modules:{},


errors:[]

};




try{



report.system =
this.system();



report.core =
this.core();



report.schema =
this.schema();



report.database =
this.database();



report.repositories =
this.repositories();



report.entities =
this.entities();



report.events =
this.events();



report.security =
this.security();



report.audit =
this.audit();



report.versioning =
this.versioning();



report.migration =
this.migration();



report.modules =
this.modules();






if(
options.skipCoreTest!==true
&&
typeof CoreInfrastructureTest!=="undefined"
){


report.coreTest =
CoreInfrastructureTest.run({

safe:true

});


}






report.readiness =
this.calculateScore(
report
);




report.status =
this.calculateStatus(
report
);



}
catch(e){


report.status="CRITICAL";


report.errors.push(
e.message
);


}




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
// SYSTEM
// ============================================================


system(){


return {


available:
typeof SystemInit!=="undefined",


version:
SystemInit?.version || null,


initialized:
SystemInit?.initialized || false,


components:
SystemInit?.componentStatus || {},


boot:

SystemInit?.bootLog || []

};


},







// ============================================================
// CORE
// ============================================================


core(){


const components=[


"Config",

"Logger",

"EntityMetadata",

"EntityRegistry",

"SchemaRegistry",

"SchemaManager",

"SpreadsheetAdapter",

"Database",

"BaseRepository",

"RepositoryFactory",

"EntityService",

"EventBus"


];



const result={};



components.forEach(name=>{


result[name]=
typeof globalThis[name]!=="undefined";


});



return result;


},







// ============================================================
// SCHEMA
// ============================================================


schema(){


return {


SchemaRegistry:
typeof SchemaRegistry!=="undefined",


SchemaManager:
typeof SchemaManager!=="undefined",


SchemaStorage:
typeof SchemaStorage!=="undefined",


SchemaDiff:
typeof SchemaDiff!=="undefined",



tables:

typeof SchemaRegistry!=="undefined"
&&
SchemaRegistry.list
?
SchemaRegistry.list().length
:
0


};


},







// ============================================================
// DATABASE
// ============================================================


database(){


return {


available:
typeof Database!=="undefined",


version:
Database?.version || null,


health:

Database?.health
?
Database.health()
:
null,


diagnostics:

Database?.diagnostics
?
Database.diagnostics()
:
null


};


},







// ============================================================
// REPOSITORIES
// ============================================================


repositories(){


const result={


registry:false,


factory:false,


count:0,


list:[],


health:null


};




if(
typeof RepositoryRegistry!=="undefined"
){


result.registry=true;


result.count =
RepositoryRegistry.count();



result.list =
RepositoryRegistry.list();



}






if(
typeof RepositoryFactory!=="undefined"
){


result.factory=true;


}




if(
typeof RepositoryHealthReport!=="undefined"
){


result.health =
RepositoryHealthReport.details();



}



return result;


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



const repoCount =
typeof RepositoryRegistry!=="undefined"

?

RepositoryRegistry.count()

:

0;




return {


available:true,


count:list.length,


entities:list,


repositoryCoverage:

list.length

?

Math.round(
repoCount/list.length*100
)

:

0


};


},







// ============================================================
// EVENTS
// ============================================================


events(){


return {


EventBus:

typeof EventBus!=="undefined",


ERPEventContract:

typeof ERPEventContract!=="undefined",


FailedEventRepository:

typeof FailedEventRepository!=="undefined"


};


},







// ============================================================
// SECURITY
// ============================================================


security(){


return {


available:
typeof SecurityGuard!=="undefined",



health:

SecurityGuard?.health
?
SecurityGuard.health()
:
null


};


},







// ============================================================
// AUDIT
// ============================================================


audit(){


return {


AuditLog:

typeof AuditLog!=="undefined",


health:

AuditLog?.health
?
AuditLog.health()
:
null


};


},







// ============================================================
// VERSIONING
// ============================================================


versioning(){


return {


VersionRepository:

typeof VersionRepository!=="undefined",



version:

VersionRepository?.version
||
null


};


},







// ============================================================
// MIGRATION
// ============================================================


migration(){


return {


MigrationManager:

typeof MigrationManager!=="undefined",



health:

MigrationManager?.health
?
MigrationManager.health()
:
null


};


},







// ============================================================
// MODULES
// ============================================================


modules(){


return {


available:
typeof ModuleRegistry!=="undefined",


list:

ModuleRegistry?.list
?
ModuleRegistry.list()
:
[]


};


},







// ============================================================
// SCORE
// ============================================================


calculateScore(data){


let score=100;



if(
!data.system.initialized
){

score-=20;

}



if(
!data.core.Database
){

score-=15;

}



if(
!data.core.RepositoryFactory
){

score-=15;

}



if(
!data.repositories.registry
){

score-=10;

}



if(
!data.schema.SchemaRegistry
){

score-=10;

}



if(
data.entities.repositoryCoverage<80
){

score-=10;

}



if(
data.errors.length
){

score-=20;

}



return Math.max(
0,
score
);


},







// ============================================================
// STATUS
// ============================================================


calculateStatus(data){


if(
data.readiness>=90
){

return "HEALTHY";

}



if(
data.readiness>=70
){

return "WARNING";

}



return "CRITICAL";


},







// ============================================================
// HEALTH CONTRACT
// ============================================================


health(){


const report =
this.run({

skipCoreTest:true

});



if(
typeof HealthContract!=="undefined"
){

return HealthContract.create(

"ERPDiagnostics",

report.status,

report

);

}



return report;


}



};







// ============================================================
// GLOBAL
// ============================================================


globalThis.ERPDiagnostics =
ERPDiagnostics;






Logger.log(
"ERPDiagnostics READY v"+
ERPDiagnostics.version
);