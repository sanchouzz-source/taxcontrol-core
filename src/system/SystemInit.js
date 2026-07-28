// ============================================================
// SystemInit v3.1.0
// Enterprise ERP Bootstrap Orchestrator
// TaxControl ERP Core
//
// Lifecycle:
//
// Bootstrap
//      |
//      ↓
// SystemInit
//      |
//      ↓
// Repository Layer
//      |
//      ↓
// Event Layer
//      |
//      ↓
// Service Layer
//      |
//      ↓
// Modules
//
// Compatible:
//
// EntityMetadata v3+
// SchemaRegistry v4+
// BaseRepository v6.3+
// RepositoryFactory v3+
// RepositoryRegistry v2+
// ServiceRegistry v1.2+
//
// ============================================================


console.log(
"SystemInit v3.1.0"
);



const SystemInit = {


version:"3.1.0",


initialized:false,


initializing:false,


startedAt:null,


bootLog:[],


started:{},


componentStatus:{},



// ============================================================
// DEPENDENCY GRAPH
// ============================================================


dependencyGraph:{



// ========================================================
// FOUNDATION
// ========================================================


Config:[],


Logger:[],


HealthContract:[],






// ========================================================
// METADATA
// ========================================================


EntityMetadata:[
"Logger"
],



EntityRegistry:[
"EntityMetadata"
],



SchemaRegistry:[
"EntityMetadata"
],



SchemaManager:[
"SchemaRegistry"
],






// ========================================================
// DATABASE
// ========================================================


SpreadsheetAdapter:[],


Database:[
"SchemaManager",
"SpreadsheetAdapter"
],






// ========================================================
// REPOSITORIES
// ========================================================


BaseRepository:[
"Database"
],



RepositoryFactory:[
"BaseRepository",
"EntityRegistry"
],



RepositoryRegistry:[
"RepositoryFactory"
],






// ========================================================
// ENTITY SERVICE
// ========================================================


EntityService:[
"RepositoryRegistry"
],






// ========================================================
// EVENTS
// ========================================================


ERPEventContract:[],



EventBus:[
"ERPEventContract"
],



BusinessEventProcessor:[
"EventBus"
],






// ========================================================
// SERVICES
// ========================================================


ServiceRegistry:[
"EntityService",
"EventBus",
"RepositoryRegistry"
],



ClientService:[
"ServiceRegistry"
],



TransportOrderService:[
"ServiceRegistry"
],



FinanceService:[
"ServiceRegistry"
],



KPIService:[
"ServiceRegistry"
],






// ========================================================
// MODULES
// ========================================================


ModuleRegistry:[
"EventBus",
"EntityService",
"RepositoryRegistry",
"ServiceRegistry"
]



},





// ============================================================
// CRITICAL COMPONENTS
// ============================================================


criticalComponents:[


"EntityMetadata",

"SchemaRegistry",

"SchemaManager",

"Database",

"BaseRepository",

"RepositoryFactory",

"RepositoryRegistry",

"EventBus",

"ServiceRegistry"

],
// ============================================================
// MARK READY
// ============================================================


_markReady(name){


this.started[name]=true;



this.componentStatus[name]={


status:"OK",


time:
new Date()
.toISOString()


};


},






// ============================================================
// START COMPONENT
// ============================================================


_start(
name,
fn
){



if(
this.started[name]
){

return true;

}





const deps =
this.dependencyGraph[name] || [];



deps.forEach(dep=>{


if(
!this.started[dep]
){


throw new Error(

name+
" dependency missing "
+
dep

);


}


});





try{


const startTime =
Date.now();



fn();



this.bootLog.push({


name:name,


status:"OK",


duration:
Date.now()-startTime


});



this._markReady(name);



Logger.log(

"READY "
+
name

);



return true;



}
catch(e){



this.componentStatus[name]={


status:"FAILED",


error:e.message


};



Logger.error(

name+
" FAILED "
+
e.message

);



if(
this.criticalComponents.includes(name)
){

throw e;

}



return false;


}



},







// ============================================================
// SAFE INIT
// ============================================================


safeInit(
name,
args
){



const obj =
globalThis[name];



if(
!obj
){

return true;

}



if(
typeof obj.init==="function"
){

return obj.init(args);

}



return true;


},







// ============================================================
// INIT
// ============================================================


init(){



if(
this.initialized
){

return this.health();

}



if(
this.initializing
){

return;

}



this.initializing=true;



this.startedAt =
new Date()
.toISOString();





try{


Logger.log(

"========== ERP BOOT START =========="

);






// ========================================================
// FOUNDATION
// ========================================================


this._start(

"Config",

()=>this.safeInit(
"Config"
)

);





this._start(

"Logger",

()=>this.safeInit(
"Logger"
)

);





this._start(

"HealthContract",

()=>this.safeInit(
"HealthContract"
)

);








// ========================================================
// METADATA
// ========================================================


this._start(

"EntityMetadata",

()=>this.safeInit(
"EntityMetadata"
)

);





this._start(

"EntityRegistry",

()=>this.safeInit(
"EntityRegistry"
)

);





this._start(

"SchemaRegistry",

()=>this.safeInit(
"SchemaRegistry"
)

);





this._start(

"SchemaManager",

()=>this.safeInit(
"SchemaManager"
)

);









// ========================================================
// DATABASE
// ========================================================


this._start(

"SpreadsheetAdapter",

()=>this.safeInit(
"SpreadsheetAdapter"
)

);





this._start(

"Database",

()=>this.safeInit(
"Database"
)

);








// ========================================================
// REPOSITORIES
// ========================================================


this._start(

"BaseRepository",

()=>BaseRepository.init(
Database
)

);





this._start(

"RepositoryFactory",

()=>RepositoryFactory.init()

);





RepositoryFactory.refresh?.();





this._start(

"RepositoryRegistry",

()=>{


RepositoryRegistry.init?.();



RepositoryRegistry.refresh?.();



}

);









// ========================================================
// ENTITY SERVICE
// ========================================================


this._start(

"EntityService",

()=>this.safeInit(
"EntityService"
)

);









// ========================================================
// EVENTS
// ========================================================


this._start(

"ERPEventContract",

()=>this.safeInit(
"ERPEventContract"
)

);





this._start(

"EventBus",

()=>this.safeInit(
"EventBus"
)

);





this._start(

"BusinessEventProcessor",

()=>this.safeInit(
"BusinessEventProcessor"
)

);









// ========================================================
// SERVICE LAYER
// ========================================================


this._start(

"ServiceRegistry",

()=>{


ServiceRegistry.init?.();



ServiceRegistry.refresh?.();



}

);








// ========================================================
// BUSINESS SERVICES
// ========================================================


this._start(

"ClientService",

()=>this.safeInit(
"ClientService"
)

);





this._start(

"TransportOrderService",

()=>this.safeInit(
"TransportOrderService"
)

);





this._start(

"FinanceService",

()=>this.safeInit(
"FinanceService"
)

);





this._start(

"KPIService",

()=>this.safeInit(
"KPIService"
)

);









// ========================================================
// MODULES
// ========================================================


if(
typeof ModuleRegistry!=="undefined"
){



this._start(

"ModuleRegistry",

()=>{


ModuleRegistry.init?.();




ModuleRegistry.setEventBus?.(
EventBus
);





ModuleRegistry.setService?.(
EntityService
);






if(
typeof ERP_MODULE_MANIFEST!=="undefined"
){


ModuleRegistry.loadManifest?.(
ERP_MODULE_MANIFEST
);


}




}

);


}






// ========================================================
// VALIDATION
// ========================================================


this.validate();


this.validateServices();





this.initialized=true;



this.emitStart();





Logger.log(

"========== ERP READY v"+
this.version+
" =========="

);





return this.health();



}
catch(e){



this.initialized=false;



Logger.error(

"ERP START FAILED "
+
e.message

);



throw e;


}
finally{


this.initializing=false;


}



},
// ============================================================
// VALIDATE
// ============================================================


validate(){



if(
EntityMetadata?.validate
){



const errors =
EntityMetadata.validate();



if(
errors.length
){


throw new Error(

"Metadata errors "
+
errors.join(",")

);


}


}






if(
SchemaRegistry?.validate
){



const errors =
SchemaRegistry.validate();



if(
errors.length
){


throw new Error(

"Schema errors "
+
errors.join(",")

);


}


}





return true;


},







// ============================================================
// SERVICE VALIDATION
// ============================================================


validateServices(){



if(
typeof ServiceRegistry==="undefined"
){

throw new Error(

"ServiceRegistry unavailable"

);

}




const required=[


"ClientService",


"TransportOrderService"


];





required.forEach(name=>{


if(
!ServiceRegistry.has(name)
){


throw new Error(

"Required service missing "
+
name

);


}


});





Logger.log(

"SERVICE VALIDATION OK "

+
ServiceRegistry
.list()
.join(",")

);



return true;


},







// ============================================================
// EVENT
// ============================================================


emitStart(){



if(
typeof EventBus==="undefined"
){

return;

}



if(
typeof EventBus.emit==="function"
){



EventBus.emit(

"ERP_STARTED",

{


version:this.version,


time:
new Date()
.toISOString()


}

);



}




},







// ============================================================
// HEALTH
// ============================================================


health(){



return {


module:
"SystemInit",


version:
this.version,


status:

this.initialized
?
"OK"
:
"WARNING",



initialized:
this.initialized,



startedAt:
this.startedAt,



components:
this.componentStatus



};


},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){



return {


module:
"SystemInit",


version:
this.version,



initialized:
this.initialized,



startedAt:
this.startedAt,



boot:
this.bootLog,



components:
this.componentStatus,




schema:

SchemaRegistry?.diagnostics?.(),




database:

Database?.diagnostics?.(),




factory:

RepositoryFactory?.diagnostics?.(),




registry:

RepositoryRegistry?.diagnostics?.(),




services:

ServiceRegistry?.health?.()



};


},







// ============================================================
// RESET
// ============================================================


reset(){



try{


SchemaRegistry?.reset?.();



Database?.reset?.();



RepositoryFactory?.reset?.();



RepositoryRegistry?.reset?.();



ServiceRegistry?.reset?.();



}
catch(e){



Logger.warn(

"System reset warning "
+
e.message

);


}






this.initialized=false;



this.initializing=false;



this.started={};



this.componentStatus={};



this.bootLog=[];



Logger.log(

"SystemInit RESET"

);



},







// ============================================================
// EXPORT
// ============================================================


};



globalThis.SystemInit =
SystemInit;



Logger.log(

"SystemInit READY v"+
SystemInit.version

);