// ============================================================
// ModuleRegistry v2.3.0
// Enterprise Module Lifecycle Manager
// TaxControl ERP Core
//
// Architecture:
//
// SystemInit
//      |
// ModuleRegistry
//      |
// ModuleManifest
//      |
// ERP Modules
//
// Compatible:
// SystemInit v2.6.x
// EntityService v5.x
// RepositoryFactory v2.6.x
// EventBus v2.x
//
// ============================================================


console.log("ModuleRegistry v2.3.0");



const ModuleRegistry = {


version:"2.3.0",

apiVersion:"2.3",



// ============================================================
// STATE
// ============================================================


modules:{},

started:{},

failed:{},

pending:{},

criticalModules:{},

phaseHistory:[],


initialized:false,

starting:false,

startedAll:false,


eventBus:null,

loader:null,





// ============================================================
// PHASES
// ============================================================


phases:[

"DOMAIN",

"APPLICATION",

"SERVICES",

"REPORTING"

],







// ============================================================
// STATUS
// ============================================================


statuses:{


DISCOVERED:"DISCOVERED",

REGISTERED:"REGISTERED",

LOADED:"LOADED",

ENABLED:"ENABLED",

VALIDATING:"VALIDATING",

INITIALIZING:"INITIALIZING",

STARTING:"STARTING",

READY:"READY",

FAILED:"FAILED",

DEPENDENCY_FAILED:"DEPENDENCY_FAILED",

DISABLED:"DISABLED",

STOPPED:"STOPPED"

},







// ============================================================
// EVENT BUS
// ============================================================


setEventBus(bus){


this.eventBus=bus;


Logger.log(
"ModuleRegistry EventBus attached"
);


},



_emit(type,module){


if(
!this.eventBus ||
typeof this.eventBus.emit!=="function"
){

return;

}



try{


this.eventBus.emit(
type,
{


module:
module.name,


version:
module.version,


apiVersion:
module.apiVersion,


phase:
module.phase,


status:
module.status,


timestamp:
new Date().toISOString()


}

);


}
catch(e){


Logger.warn(
"Module event error "+
e.message
);


}



},







// ============================================================
// INIT
// ============================================================


init(){


if(this.initialized){

return true;

}



this.modules={};

this.started={};

this.failed={};

this.pending={};

this.phaseHistory=[];



this.initialized=true;





if(
typeof CoreRegistry!=="undefined"
&&
CoreRegistry.register
){


CoreRegistry.register(
"ModuleRegistry",
this,
20
);


}



if(
typeof ERP_MODULE_MANIFEST!=="undefined"
){

this.loadManifest(
ERP_MODULE_MANIFEST
);


}



Logger.log(
"ModuleRegistry INITIALIZED v"+
this.version
);



return true;


},







// ============================================================
// CONTEXT
// ============================================================


createContext(module){


return{


registry:this,


module,


version:this.version,


services:{


Database:
typeof Database!=="undefined"
?
Database
:
null,


EventBus:
this.eventBus,


EntityService:
typeof EntityService!=="undefined"
?
EntityService
:
null,


RepositoryFactory:
typeof RepositoryFactory!=="undefined"
?
RepositoryFactory
:
null


}



};


},
// ============================================================
// REGISTER MODULE
// ============================================================


register(name,definition){


if(!definition){

throw new Error(
"Module definition missing "+name
);

}



if(this.modules[name]){


Logger.warn(
"Module already registered "+name
);


return false;

}





const module={


name:
definition.name || name,


version:
definition.version || "1.0.0",


apiVersion:
definition.apiVersion || "1.0",


description:
definition.description || "",


owner:
definition.owner || "CORE",


phase:
definition.phase || "DOMAIN",


priority:
definition.priority ?? 100,



// dependencies

dependencies:
definition.dependencies || [],



// разделяем автоматически

services:
definition.services || [],


modules:
definition.modules || [],




// API

entities:
definition.api?.entities ||
definition.entities ||
[],



events:
definition.api?.events ||
definition.events ||
[],



permissions:
definition.permissions ||
[],





enabled:
definition.enabled !== false,



critical:
definition.critical===true,





requiresERP:
definition.requiresERP || null,





status:
this.statuses.REGISTERED,



error:null,



loadedAt:null,

validatedAt:null,

initializedAt:null,

startedAt:null,

stoppedAt:null,



register:
definition.register || null,


validate:
definition.validate || null,


init:
definition.init || null,


start:
definition.start || null,


stop:
definition.stop || null,


destroy:
definition.destroy || null,


health:
definition.health || null



};







// ==================================================
// AUTO DEPENDENCY SPLIT
// ==================================================


if(
module.dependencies.length
&&
!module.services.length
&&
!module.modules.length
){


module.services =
module.dependencies.filter(
x=>this.isService(x)
);



module.modules =
module.dependencies.filter(
x=>!this.isService(x)
);



}






if(module.critical){


this.criticalModules[name]=true;


}





this.modules[module.name]=module;



Logger.log(
"MODULE REGISTER "+
module.name+
" v"+
module.version
);



this._emit(
"MODULE_REGISTERED",
module
);



return true;


},







// ============================================================
// SERVICE DETECTOR
// ============================================================


isService(name){


const services=[


"Database",

"EventBus",

"EntityService",

"RepositoryFactory",

"EntityRegistry",

"SchemaRegistry",

"SchemaManager",

"Logger",

"SecurityGuard"

];



return services.includes(name);


},







// ============================================================
// SERVICE RESOLVE
// ============================================================


resolveService(name){


return (

this.isService(name)

&&

typeof globalThis[name]!=="undefined"

);


},







// ============================================================
// MANIFEST
// ============================================================


loadManifest(manifest){


if(!manifest){

return 0;

}



let count=0;



Object.entries(manifest)

.forEach(([key,item])=>{


const definition =
item.moduleDefinition ||
item;



const name =
definition.name ||
key;




if(
!this.modules[name]
){



this.register(
name,
definition
);



this.modules[name].status =
this.statuses.LOADED;



this.modules[name].loadedAt =
new Date();



count++;


}



});



Logger.log(
"ModuleManifest loaded "+
count
);



return count;


},







// ============================================================
// GETTERS
// ============================================================


get(name){

return this.modules[name] || null;

},



has(name){

return !!this.modules[name];

},



list(){

return Object.keys(this.modules);

},



count(){

return this.list().length;

},



findByPhase(phase){


return Object.values(this.modules)

.filter(
m=>m.phase===phase
);


},



findByOwner(owner){


return Object.values(this.modules)

.filter(
m=>m.owner===owner
);


},







// ============================================================
// VERSION CHECK
// ============================================================


compareVersion(a,b){


const aa =
String(a)
.split(".")
.map(Number);



const bb =
String(b)
.split(".")
.map(Number);



for(let i=0;i<3;i++){


if((aa[i]||0)>(bb[i]||0))
return 1;


if((aa[i]||0)<(bb[i]||0))
return -1;


}



return 0;


},







// ============================================================
// VALIDATE MODULE
// ============================================================


validateModule(module){


module.status =
this.statuses.VALIDATING;


module.validatedAt =
new Date();



const errors=[];





// ERP VERSION

if(
module.requiresERP
&&
typeof SystemInit!=="undefined"
){


if(
this.compareVersion(
SystemInit.version,
module.requiresERP
)<0
){


errors.push(
"ERP version mismatch"
);


}



}






// SERVICES


for(
const service of module.services
){



if(
!this.resolveService(service)
){


errors.push(
"Missing service: "+
service
);


}



}






// MODULE DEPENDENCIES


for(
const dep of module.modules
){



const dependency =
this.modules[dep];



if(!dependency){


errors.push(
"Missing module dependency: "+
dep
);


continue;

}



if(
dependency.status===
this.statuses.FAILED
){


errors.push(
"Dependency failed: "+
dep
);


}



}






// ENTITIES


for(
const entity of module.entities
){



if(
typeof EntityRegistry==="undefined"
){


errors.push(
"EntityRegistry unavailable"
);


break;

}



if(
!EntityRegistry.has(entity)
){


errors.push(
"Missing entity: "+
entity
);


}



}






// REPOSITORIES


if(
typeof RepositoryFactory!=="undefined"
){


for(
const entity of module.entities
){



if(
!RepositoryFactory.has(entity)
){


errors.push(
"Missing repository: "+
entity
);


}



}



}







if(errors.length){



const dependencyErrors =
errors.filter(
e=>
e.includes("Missing service")
||
e.includes("Dependency")
||
e.includes("dependency")
);



module.status =
dependencyErrors.length
?
this.statuses.DEPENDENCY_FAILED
:
this.statuses.FAILED;



module.error =
errors.join("; ");



return {

ok:false,

errors

};


}




return{


ok:true,

errors:[]

};


},
// ============================================================
// DEPENDENCY SORT
// ============================================================


topologicalSort(list){


const modules =
list ||
Object.values(this.modules)
.filter(
m=>m.enabled!==false
);



const result=[];

const visited={};

const visiting={};



const visit=(module)=>{


if(visited[module.name]){

return;

}



if(visiting[module.name]){

throw new Error(
"Circular dependency "+
module.name
);

}



visiting[module.name]=true;



for(
const dep of module.modules
){


const dependency =
this.modules[dep];



if(dependency){

visit(dependency);

}



}



visited[module.name]=true;


result.push(module);



};



modules
.sort(
(a,b)=>
b.priority-a.priority
)
.forEach(visit);



return result;


},







// ============================================================
// CIRCULAR CHECK
// ============================================================


detectCircular(){


try{


this.topologicalSort();


return{

valid:true

};


}
catch(e){


return{

valid:false,

error:e.message

};


}



},







// ============================================================
// START MODULE
// ============================================================


async startModule(module){


if(
module.status===
this.statuses.READY
){

return true;

}



Logger.log(
"MODULE START "+
module.name
);



try{



const validation =
this.validateModule(module);



if(!validation.ok){


throw new Error(
validation.errors.join(", ")
);


}





module.status =
this.statuses.INITIALIZING;





const context =
this.createContext(module);







// REGISTER

if(
typeof module.register==="function"
){


await module.register(context);


}





// CUSTOM VALIDATE

if(
typeof module.validate==="function"
){


await module.validate(context);


}





// INIT

if(
typeof module.init==="function"
){


await module.init(context);


}


module.initializedAt =
new Date();






module.status =
this.statuses.STARTING;






// START

if(
typeof module.start==="function"
){


await module.start(context);


}







module.status =
this.statuses.READY;


module.startedAt =
new Date();



this.started[module.name]=true;


delete this.failed[module.name];





Logger.log(
"MODULE READY "+
module.name
);



this._emit(
"MODULE_READY",
module
);




return true;



}
catch(e){



module.status =
this.statuses.FAILED;



module.error =
e.message;



this.failed[module.name]={


name:
module.name,


error:
e.message,


timestamp:
new Date().toISOString()


};



Logger.error(
"MODULE FAILED "+
module.name+
" "+
e.message
);



this._emit(
"MODULE_FAILED",
module
);



return false;


}



},







// ============================================================
// START PHASE
// ============================================================


async startPhase(phase){



Logger.log(
"========== MODULE PHASE "+
phase+
" =========="
);




const modules =
this.topologicalSort();



let started=0;

let failed=0;



for(
const module of modules
){



if(
module.phase!==phase
||
this.started[module.name]
){

continue;

}






const dependenciesReady =
module.modules.every(
dep=>
this.started[dep]
);



if(
!dependenciesReady
){



module.status =
this.statuses.DEPENDENCY_FAILED;



failed++;



Logger.warn(
"DEPENDENCY FAILED "+
module.name
);



continue;

}





if(
await this.startModule(module)
){


started++;


}
else{


failed++;


}



}






const result={


phase,

started,

failed,


timestamp:
new Date().toISOString()


};



this.phaseHistory.push(result);



return result;


},







// ============================================================
// START ALL
// ============================================================


async startAll(phase=null){



if(
!this.initialized
){

this.init();

}



if(phase){

return this.startPhase(phase);

}



const result=[];



for(
const p of this.phases
){


result.push(
await this.startPhase(p)
);


}



this.startedAll=true;



return result;


},







// ============================================================
// STOP
// ============================================================


async stopAll(){


Logger.log(
"MODULE STOP ALL"
);



const modules =
Object.values(this.modules)
.reverse();



for(
const module of modules
){


try{


if(
typeof module.stop==="function"
){


await module.stop(
this.createContext(module)
);


}



if(
typeof module.destroy==="function"
){


await module.destroy(
this.createContext(module)
);


}





module.status =
this.statuses.STOPPED;



module.stoppedAt =
new Date();



}
catch(e){


Logger.warn(
"STOP ERROR "+
module.name+
" "+
e.message
);


}



}



this.startedAll=false;



},







// ============================================================
// RETRY
// ============================================================


async retryFailed(){



const failed =
Object.values(this.failed);



let recovered=0;



for(
const item of failed
){



const module =
this.modules[item.name];



if(!module){

continue;

}



module.status =
this.statuses.LOADED;



module.error=null;



if(
await this.startModule(module)
){


recovered++;


}



}



return{


attempted:
failed.length,


recovered


};


},







// ============================================================
// ENABLE / DISABLE
// ============================================================


enable(name){


const module =
this.modules[name];



if(!module){

throw new Error(
"Module not found "+
name
);

}



module.enabled=true;


module.status =
this.statuses.ENABLED;


return true;


},




disable(name){


const module =
this.modules[name];



if(!module){

throw new Error(
"Module not found "+
name
);

}



module.enabled=false;


module.status =
this.statuses.DISABLED;


return true;


},







// ============================================================
// MANIFEST API
// ============================================================


manifest(){


return Object.values(this.modules)

.map(m=>({


name:m.name,

version:m.version,

apiVersion:m.apiVersion,

owner:m.owner,

phase:m.phase,

status:m.status,

enabled:m.enabled


}));



},







// ============================================================
// HEALTH
// ============================================================


health(){



const modules =
Object.values(this.modules);



const enabled =
modules.filter(
m=>m.enabled!==false
);



const ready =
enabled.filter(
m=>
m.status===
this.statuses.READY
);



const failed =
enabled.filter(
m=>
m.status===
this.statuses.FAILED
||
m.status===
this.statuses.DEPENDENCY_FAILED
);



let status="OK";



if(
failed.length
){

status="WARNING";

}



const data={


version:this.version,

apiVersion:this.apiVersion,


initialized:this.initialized,


startedAll:this.startedAll,


total:
modules.length,


enabled:
enabled.length,


ready:
ready.length,


failed:
failed.length,


coverage:
enabled.length
?
Math.round(
ready.length /
enabled.length *
100
)
:
100,



modules:
this.manifest(),



failed:
failed.map(m=>({


name:m.name,


error:m.error


}))



};





if(
typeof HealthContract!=="undefined"
){


return HealthContract.create(
"ModuleRegistry",
status,
data
);


}



return {

status,

...data

};


},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){


return{


version:this.version,


apiVersion:this.apiVersion,


initialized:this.initialized,


startedAll:this.startedAll,


modules:this.modules,


started:this.started,


failed:this.failed,


phaseHistory:this.phaseHistory


};



},







// ============================================================
// RESET
// ============================================================


async reset(){


await this.stopAll();



this.modules={};

this.started={};

this.failed={};

this.pending={};

this.phaseHistory=[];


this.initialized=false;

this.startedAll=false;



Logger.log(
"ModuleRegistry RESET"
);


},



// ============================================================
// END
// ============================================================


finish(){


return this.health();


}



};




// ============================================================
// GLOBAL EXPORT
// ============================================================


globalThis.ModuleRegistry =
ModuleRegistry;





// ============================================================
// COMMANDS
// ============================================================


globalThis.moduleHealth =
()=>ModuleRegistry.health();



globalThis.moduleDiag =
()=>ModuleRegistry.diagnostics();



globalThis.moduleList =
()=>ModuleRegistry.list();



globalThis.moduleManifest =
()=>ModuleRegistry.manifest();



globalThis.moduleRetry =
()=>ModuleRegistry.retryFailed();



globalThis.moduleValidate =
()=>Object.values(
ModuleRegistry.modules
)
.map(m=>({

name:m.name,

result:
ModuleRegistry.validateModule(m)

}));



globalThis.moduleCircular =
()=>ModuleRegistry.detectCircular();



globalThis.moduleByPhase =
phase=>
ModuleRegistry.findByPhase(phase);



globalThis.moduleByOwner =
owner=>
ModuleRegistry.findByOwner(owner);



Logger.log(
"ModuleRegistry READY v"+
ModuleRegistry.version
);


Logger.log(
"MODULE COMMANDS READY"
);