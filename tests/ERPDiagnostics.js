// ============================================================
// ERP Diagnostics v3.0.0
// Enterprise Core Diagnostics
//
// Compatible:
// SystemInit v2.x
// SchemaManager v3.x
// Database v3.x
// BaseRepository v4.x
// RepositoryFactory v2.x
// EventBus v2.3
// ModuleRegistry v1.10
// ============================================================


console.log("ERP Diagnostics v3.0.0");


const ERPDiagnostics = {


version:"3.0.0",



// ============================================================
// RUN
// ============================================================


run(options={}){


const report =
this.buildReport();



if(options.json){

return report;

}



this.print(report);


return report;


},



// ============================================================
// BUILD
// ============================================================


buildReport(){


return {


timestamp:
new Date().toISOString(),


system:
this.system(),


components:
this.components(),


entities:
this.entities(),


repositories:
this.repositories(),


database:
this.database(),


events:
this.events(),


modules:
this.modules(),


dependencies:
this.dependencies(),


errors:
this.errors(),


health:
this.health()



};



},




// ============================================================
// SYSTEM
// ============================================================


system(){


return {


status:
typeof SystemInit!=="undefined" &&
SystemInit.initialized
?
"OK"
:
"FAILED",



version:
SystemInit?.version || null,


startedAt:
SystemInit?.startedAt || null,


components:
SystemInit?.componentStatus || {}



};



},




// ============================================================
// COMPONENTS
// ============================================================


components(){


return {


Config:
this.check(
typeof Config!=="undefined",
Config?.initialized
),


SchemaManager:
this.check(
typeof SchemaManager!=="undefined",
SchemaManager?.initialized
),


Database:
this.check(
typeof Database!=="undefined",
Database?.initialized
),


EntityRegistry:
this.check(
typeof EntityRegistry!=="undefined",
true
),


SchemaRegistry:
this.check(
typeof SchemaRegistry!=="undefined",
true
),


BaseRepository:
this.check(
typeof BaseRepository!=="undefined",
true
),


RepositoryFactory:
this.check(
typeof RepositoryFactory!=="undefined",
RepositoryFactory?.initialized
),


RepositoryRegistry:
this.check(
typeof RepositoryRegistry!=="undefined",
RepositoryRegistry?.ready
),


EventBus:
this.check(
typeof EventBus!=="undefined",
EventBus?.ready
),


SecurityGuard:
this.check(
typeof SecurityGuard!=="undefined",
true
),


EntityValidator:
this.check(
typeof EntityValidator!=="undefined",
true
),


IdService:
this.check(
typeof IdService!=="undefined",
true
)



};



},




check(exists,ready){


if(!exists)
return "MISSING";


if(ready===false)
return "WARNING";


return "READY";


},




// ============================================================
// ENTITIES
// ============================================================


entities(){


try{


if(
typeof EntityRegistry!=="undefined" &&
EntityRegistry.list
){


const list =
EntityRegistry.list();



return {


count:list.length,


items:list



};



}



}catch(e){



return {
error:e.message
};



}



return {
count:0
};



},




// ============================================================
// REPOSITORIES
// ============================================================


repositories(){


let result={};



try{


if(
typeof RepositoryFactory!=="undefined"
){


result.factory =
RepositoryFactory.list();


}



if(
typeof RepositoryRegistry!=="undefined"
){


result.registry =
RepositoryRegistry.list();


}



}catch(e){


result.error=e.message;


}



return result;


},




// ============================================================
// DATABASE
// ============================================================


database(){


try{


return {


status:
Database.status,


initialized:
Database.initialized,


schema:
SchemaManager?.getTables
?
SchemaManager.getTables()
:
[],


stats:
Database.getStats
?
Database.getStats()
:
{}



};



}
catch(e){


return {
error:e.message
};


}



},




// ============================================================
// EVENTS
// ============================================================


events(){


try{


return {


ready:
EventBus?.ready || false,


events:
EventBus.list
?
EventBus.list()
:
[],


history:
EventBus.history?.length || 0



};



}
catch(e){


return {
error:e.message
};



}



},




// ============================================================
// MODULES
// ============================================================


modules(){


if(
typeof ModuleRegistry==="undefined"
){

return {};

}



return {


count:
Object.keys(
ModuleRegistry.modules || {}
).length,


modules:
ModuleRegistry.modules || {}



};



},




// ============================================================
// DEPENDENCIES
// ============================================================


dependencies(){


if(
typeof ModuleRegistry!=="undefined" &&
ModuleRegistry.getDependencyGraph
){

return ModuleRegistry.getDependencyGraph();

}



return {};

},




// ============================================================
// ERRORS
// ============================================================


errors(){


const errors=[];



const checks=this.components();



Object.entries(checks)
.forEach(([name,status])=>{


if(
status==="FAILED" ||
status==="MISSING"
){

errors.push(
name+" "+status
);


}



});



return errors;



},




// ============================================================
// HEALTH
// ============================================================


health(){


let result={};



try{


if(
typeof HealthContract!=="undefined"
){



result.Database =
Database.health
?
Database.health()
:
null;



result.Schema =
SchemaManager.health
?
SchemaManager.health()
:
null;



result.Repositories =
RepositoryFactory.health
?
RepositoryFactory.health()
:
null;



}



}
catch(e){

result.error=e.message;

}



return result;


},




// ============================================================
// PRINT
// ============================================================


print(r){


Logger.log(
"========== ERP DIAGNOSTICS v"+
this.version+
" =========="
);



Logger.log(
"SYSTEM: "+
r.system.status
);



Logger.log(
"\nCOMPONENTS"
);



Object.entries(
r.components
)
.forEach(([k,v])=>{


Logger.log(
(v==="READY"?"✔ ":"✘ ")+
k+
" : "+
v
);



});



Logger.log(
"\nENTITIES: "+
r.entities.count
);



Logger.log(
"\nREPOSITORIES"
);


Logger.log(
JSON.stringify(
r.repositories,
null,
2
)
);



Logger.log(
"\nDATABASE"
);


Logger.log(
JSON.stringify(
r.database,
null,
2
)
);



if(
r.errors.length
){

Logger.log(
"\nERRORS:"
);


r.errors.forEach(e=>
Logger.log(
"✘ "+e
)
);


}
else{


Logger.log(
"\n✔ NO ERRORS"
);


}



Logger.log(
"========== END ERP DIAGNOSTICS =========="
);



}



};




// ============================================================
// GLOBAL API
// ============================================================


globalThis.ERP = {


diagnostics(){

return ERPDiagnostics.run();

},


diagnosticsJSON(){

return ERPDiagnostics.run({
json:true
});

},


health(){

return ERPDiagnostics.health();

},


version(){

return ERPDiagnostics.version;

}



};



Logger.log(
"ERP Diagnostics READY v"+
ERPDiagnostics.version
);