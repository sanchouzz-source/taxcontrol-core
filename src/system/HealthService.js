// ============================================================
// HealthService v2.0.0
// Enterprise ERP Health Monitoring
// TaxControl ERP Core
//
// Compatible:
// SystemInit v2.5+
// HealthContract
// ModuleRegistry v2.x
// RepositoryFactory v2.x
// ============================================================


console.log("HealthService v2.0.0");



const HealthService = {


version:"2.0.0",



ready:false,





// ============================================================
// INIT
// ============================================================


init(){


this.ready=true;


Logger.log(
"HealthService READY v"+
this.version
);


return true;


},







// ============================================================
// CHECK SINGLE COMPONENT
// ============================================================


check(moduleName,module){


try{


if(!module){


return this.result(

"ERROR",

moduleName,

"MODULE NOT FOUND"

);


}




if(
typeof module.health==="function"
){



const health =
module.health();



return {


status:
health.status || "OK",


module:
moduleName,


details:
health,


timestamp:
new Date().toISOString()


};


}






return this.result(

"WARNING",

moduleName,

"health() NOT IMPLEMENTED"

);




}
catch(e){


return this.result(

"ERROR",

moduleName,

e.message

);


}



},







// ============================================================
// RESULT
// ============================================================


result(status,module,message){


return{


status,


module,


message,


timestamp:
new Date().toISOString()


};


},







// ============================================================
// CHECK ERP CORE
// ============================================================


checkCore(){



const components={



SystemInit,

EntityRegistry,

EntityMetadata,

SchemaRegistry,

SchemaManager,

Database,

BaseRepository,

RepositoryFactory,

EntityService,

EventBus,

BusinessEventProcessor

};



return this.checkMap(
components
);



},







// ============================================================
// CHECK MODULES
// ============================================================


checkModules(){



const components={};



if(
typeof ModuleRegistry!=="undefined"
){


const list =
ModuleRegistry.list?.() || [];



list.forEach(name=>{


components[name]=
ModuleRegistry.get(name);


});


}



return this.checkMap(
components
);



},







// ============================================================
// CHECK REPOSITORIES
// ============================================================


checkRepositories(){



if(
typeof RepositoryFactory==="undefined"
){

return this.result(

"ERROR",

"RepositoryFactory",

"NOT AVAILABLE"

);

}




return {


status:
RepositoryFactory.initialized
?
"OK"
:
"WARNING",


repositoryCount:
RepositoryFactory.count?.() || 0,


repositories:
RepositoryFactory.list?.() || [],


pending:
RepositoryFactory.pendingReport?.() || [],


timestamp:
new Date().toISOString()


};



},







// ============================================================
// CHECK ENTITIES
// ============================================================


checkEntities(){



if(
typeof EntityRegistry==="undefined"
){

return {

status:"ERROR",

message:
"EntityRegistry missing"

};

}



const entities =
EntityRegistry.list();



return {


status:
"OK",


count:
entities.length,


entities


};



},







// ============================================================
// MAP CHECK
// ============================================================


checkMap(map){


const result={};



Object.keys(map)
.forEach(name=>{


result[name]=
this.check(
name,
map[name]
);



});



return result;


},







// ============================================================
// FULL CHECK
// ============================================================


checkAll(){



Logger.log(
"========== ERP HEALTH CHECK =========="
);



const result={



version:
this.version,


timestamp:
new Date().toISOString(),



system:
this.check(
"SystemInit",
SystemInit
),



core:
this.checkCore(),



modules:
this.checkModules(),



repositories:
this.checkRepositories(),



entities:
this.checkEntities()



};




return result;


},







// ============================================================
// SUMMARY
// ============================================================


summary(){


const health =
this.checkAll();



let ok=0;

let warning=0;

let error=0;



function scan(obj){


if(!obj)
return;



if(obj.status){


if(obj.status==="OK")
ok++;


if(obj.status==="WARNING")
warning++;


if(obj.status==="ERROR")
error++;


}



if(typeof obj==="object"){

Object.values(obj)
.forEach(scan);

}


}



scan(health);



return{


status:
error>0
?
"ERROR"
:
warning>0
?
"WARNING"
:
"OK",


ok,

warning,

error,


health


};



},







// ============================================================
// HEALTH CONTRACT
// ============================================================


health(){


return HealthContract.create(

"HealthService",

this.ready
?
"OK"
:
"WARNING",

{


version:this.version,


architecture:
"ERP Health Monitoring Service",


features:[


"ComponentHealth",

"RepositoryHealth",

"EntityHealth",

"ModuleHealth",

"SystemDiagnostics"


]

}


);



}



};






globalThis.HealthService =
HealthService;



Logger.log(
"HealthService READY v"+
HealthService.version
);