// ============================================================
// SystemInit v2.9.0
// Enterprise ERP Bootstrap Orchestrator
// TaxControl ERP Core
//
// Architecture:
//
// EntityMetadata
//        |
// SchemaRegistry
//        |
// SchemaManager
//        |
// Database
//        |
// BaseRepository
//        |
// RepositoryFactory
//        |
// RepositoryRegistry
//        |
// EntityService
//        |
// ModuleRegistry
//
// ============================================================


console.log(
"SystemInit v2.9.0"
);



const SystemInit = {


version:"2.9.0",


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


Config:[],


Logger:[],


HealthContract:[],



// METADATA

EntityMetadata:[
"Logger"
],



SchemaRegistry:[
"EntityMetadata"
],



EntityRegistry:[
"EntityMetadata"
],



SchemaManager:[
"SchemaRegistry"
],





// STORAGE

SpreadsheetAdapter:[],


Database:[
"SchemaManager",
"SpreadsheetAdapter"
],






// REPOSITORY

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





// SERVICE

EntityService:[
"RepositoryRegistry"
],






// EVENTS

ERPEventContract:[],


EventBus:[
"ERPEventContract"
],



BusinessEventProcessor:[
"EventBus"
],






// MODULES

ModuleRegistry:[
"EventBus",
"EntityService",
"RepositoryRegistry"
]



},







criticalComponents:[


"EntityMetadata",

"SchemaRegistry",

"SchemaManager",

"Database",

"BaseRepository",

"RepositoryFactory"

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


_start(name,fn){


if(this.started[name]){

return true;

}



const deps =
this.dependencyGraph[name]||[];





deps.forEach(dep=>{


if(!this.started[dep]){


throw new Error(

name+
" dependency missing "+
dep

);


}


});





try{


const start =
Date.now();



fn();



this.bootLog.push({

name,

status:"OK",

duration:
Date.now()-start

});



this._markReady(name);



Logger.log(
"READY "+
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
" FAILED "+
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


safeInit(name,args){


const obj =
globalThis[name];



if(!obj){

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


if(this.initialized){

return this.health();

}



if(this.initializing){

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




// CORE


this._start(
"Config",
()=>this.safeInit("Config")
);



this._start(
"Logger",
()=>this.safeInit("Logger")
);



this._start(
"HealthContract",
()=>this.safeInit("HealthContract")
);




// METADATA


this._start(
"EntityMetadata",
()=>this.safeInit("EntityMetadata")
);



this._start(
"SchemaRegistry",
()=>this.safeInit("SchemaRegistry")
);



this._start(
"EntityRegistry",
()=>this.safeInit("EntityRegistry")
);



this._start(
"SchemaManager",
()=>this.safeInit("SchemaManager")
);





// DATABASE


this._start(
"SpreadsheetAdapter",
()=>this.safeInit("SpreadsheetAdapter")
);



this._start(
"Database",
()=>this.safeInit("Database")
);





// REPOSITORY CORE


this._start(
"BaseRepository",
()=>BaseRepository.init(Database)
);



this._start(
"RepositoryFactory",
()=>RepositoryFactory.init()
);





RepositoryFactory.refresh?.();





// IMPORTANT
// поздняя регистрация Repository


this._start(
"RepositoryRegistry",
()=>{


RepositoryRegistry.init?.();


RepositoryRegistry.refresh?.();


}

);







// SERVICE LAYER


this._start(
"EntityService",
()=>this.safeInit("EntityService")
);






// EVENTS


this._start(
"ERPEventContract",
()=>this.safeInit("ERPEventContract")
);



this._start(
"EventBus",
()=>this.safeInit("EventBus")
);





this._start(
"BusinessEventProcessor",
()=>this.safeInit(
"BusinessEventProcessor"
)

);







// MODULES


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








this.validate();



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

"ERP START FAILED "+
e.message

);



throw e;


}
finally{


this.initializing=false;


}



},







// ============================================================
// VALIDATION
// ============================================================


validate(){



if(
EntityMetadata?.validate
){


const errors =
EntityMetadata.validate();



if(errors.length){

throw new Error(

"Metadata errors "+
errors.join(",")

);

}


}






if(
SchemaRegistry?.validate
){


const errors =
SchemaRegistry.validate();



if(errors.length){

throw new Error(

"Schema errors "+
errors.join(",")

);

}


}



return true;


},







// ============================================================
// EVENT
// ============================================================


emitStart(){


if(
EventBus?.emit
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


return HealthContract.create(

"SystemInit",

this.initialized
?
"OK"
:
"WARNING",

{


version:this.version,


initialized:this.initialized,


startedAt:this.startedAt,


components:this.componentStatus


}

);


},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){


return {


version:this.version,


initialized:this.initialized,


startedAt:this.startedAt,


boot:this.bootLog,


components:this.componentStatus,



schema:
SchemaRegistry?.diagnostics?.(),



database:
Database?.diagnostics?.(),



factory:
RepositoryFactory?.diagnostics?.(),



registry:
RepositoryRegistry?.diagnostics?.()



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


}
catch(e){}



this.initialized=false;


this.initializing=false;


this.started={};


this.componentStatus={};


this.bootLog=[];



Logger.log(
"SystemInit RESET"
);


}



};








globalThis.SystemInit =
SystemInit;



Logger.log(

"SystemInit READY v"+
SystemInit.version

);