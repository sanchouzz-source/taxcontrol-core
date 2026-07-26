// ============================================================
// SystemInit v2.4.0
// Enterprise ERP Bootstrap Orchestrator
// TaxControl ERP Core
//
// Compatible:
// EntityMetadata v2.x
// SchemaRegistry v4.x
// SchemaManager v4.x
// BaseRepository v5.x
// RepositoryFactory v2.5.x
// ============================================================


console.log("SystemInit v2.4.0");



const SystemInit = {


version:"2.4.0",


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


// ENTITY FOUNDATION

EntityMetadata:[
],


EntityRegistry:[
"EntityMetadata"
],


SchemaRegistry:[
"EntityMetadata",
"EntityRegistry"
],


// CORE

SchemaManager:[
"SchemaRegistry",
"EntityMetadata"
],


Database:[
"SchemaManager"
],


BaseRepository:[
"Database",
"SchemaRegistry"
],


// REPOSITORIES

RepositoryFactory:[
"EntityRegistry",
"BaseRepository"
],


// EVENTS

ERPEventContract:[
],


EventBus:[
"ERPEventContract"
],


BusinessEventProcessor:[
"EventBus"
]

},





// ============================================================
// CRITICAL COMPONENTS
// ============================================================


criticalComponents:[


"Config",

"Logger",

"EntityMetadata",

"SchemaManager",

"Database",

"BaseRepository",

"EventBus"

],





// ============================================================
// PHASE MAP
// ============================================================


componentPhase:{


Config:"BOOTSTRAP",

Logger:"BOOTSTRAP",


EntityMetadata:"ENTITY",

EntityRegistry:"ENTITY",

SchemaRegistry:"ENTITY",


SchemaManager:"CORE",

Database:"CORE",

BaseRepository:"CORE",


RepositoryFactory:"ENTITY",


ERPEventContract:"EVENT",

EventBus:"EVENT",

BusinessEventProcessor:"EVENT"


},





// ============================================================
// STATE
// ============================================================


_syncStarted(name){


this.started[name]=true;


this.componentStatus[name]={

status:"OK",

timestamp:new Date().toISOString()

};


},





// ============================================================
// COMPONENT START
// ============================================================


async _start(name,fn,phase){


if(this.started[name]){

return true;

}



const deps =
this.dependencyGraph[name] || [];



for(const dep of deps){


if(!this.started[dep]){


throw new Error(

name+
" dependency missing: "+
dep

);


}


}





try{


const start =
Date.now();



await fn();



const duration =
Date.now()-start;



this.bootLog.push({

name,

phase,

status:"OK",

duration

});



this._syncStarted(name);



Logger.log(

phase+
" | "+
name+
" READY "+
duration+
"ms"

);



return true;


}
catch(e){



this.bootLog.push({

name,

phase,

status:"FAILED",

error:e.message

});



this.componentStatus[name]={

status:"FAILED",

error:e.message

};



Logger.error(

phase+
" | "+
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


async safeInit(name){


const obj =
globalThis[name];



if(!obj){

return false;

}



if(
typeof obj.init!=="function"
){

this._syncStarted(name);

return true;

}



return this._start(

name,

()=>obj.init(),

this.componentPhase[name] || "CORE"

);



},





// ============================================================
// MAIN START
// ============================================================


async init(){


if(this.initialized){

return this.health();

}



if(this.initializing){

return;

}



this.initializing=true;



Logger.log(
"========== ERP BOOT START =========="
);



this.startedAt =
new Date().toISOString();



try{


// ================================
// BOOTSTRAP
// ================================


await this._start(

"Config",

()=>Config?.init?.(),

"BOOTSTRAP"

);



await this._start(

"Logger",

()=>Logger?.init?.(),

"BOOTSTRAP"

);





// ================================
// ENTITY FOUNDATION
// ================================


await this._start(

"EntityMetadata",

()=>EntityMetadata.init({

strict:false,

compareRegistry:true,

registerTestEntities:true

}),

"ENTITY"

);



await this._start(

"EntityRegistry",

()=>EntityRegistry.init(),

"ENTITY"

);




await this._start(

"SchemaRegistry",

()=>SchemaRegistry.init(),

"ENTITY"

);




// ================================
// CORE
// ================================


await this._start(

"SchemaManager",

()=>SchemaManager.init(),

"CORE"

);



await this._start(

"Database",

()=>Database.init(),

"CORE"

);




await this._start(

"BaseRepository",

()=>BaseRepository.init(Database),

"CORE"

);





// ================================
// REPOSITORIES
// ================================


await this._start(

"RepositoryFactory",

()=>RepositoryFactory.init(),

"ENTITY"

);





// ================================
// EVENTS
// ================================


await this._start(

"ERPEventContract",

()=>ERPEventContract.init?.(),

"EVENT"

);



await this._start(

"EventBus",

()=>EventBus.init(),

"EVENT"

);



await this._start(

"BusinessEventProcessor",

()=>BusinessEventProcessor.init(),

"EVENT"

);





// ================================
// VALIDATION
// ================================


this.validate();




this.initialized=true;



Logger.log(

"========== ERP READY v"+
this.version+
" =========="

);




this.emitStart();



return this.health();



}
catch(e){


Logger.error(

"ERP START FAILED "+
e.message

);


this.initialized=false;


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


Logger.log(
"ERP VALIDATION START"
);



if(typeof EntityMetadata!=="undefined"){


const result =
EntityMetadata.validate();



if(!result.valid){


throw new Error(

"Metadata validation failed"

);


}


}



if(typeof RepositoryFactory!=="undefined"){


const missing =
RepositoryFactory.missingRepositories();



if(missing.length){


Logger.warn(

"Missing repositories: "+
missing.join(",")

);


}



}



Logger.log(
"ERP VALIDATION COMPLETE"
);



},






// ============================================================
// EVENT
// ============================================================


emitStart(){


if(
typeof EventBus!=="undefined" &&
EventBus.emit
){


EventBus.emit(

"ERP_STARTED",

{

version:this.version,

timestamp:new Date().toISOString()

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


components:this.componentStatus,


repositories:
typeof RepositoryFactory!=="undefined"
?
RepositoryFactory.list()
:
[]


}

);


},






// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){


return{


version:this.version,


initialized:this.initialized,


startedAt:this.startedAt,


started:Object.keys(this.started),


components:this.componentStatus,


boot:this.bootLog



};


}




};





globalThis.SystemInit =
SystemInit;





// ============================================================
// COMMANDS
// ============================================================


globalThis.startERP=function(){

return SystemInit.init();

};



globalThis.erpHealth=function(){

return SystemInit.health();

};



globalThis.erpDiag=function(){

return SystemInit.diagnostics();

};



Logger.log(
"SystemInit READY v"+
SystemInit.version
);


Logger.log(
"ERP COMMANDS READY:"
);


Logger.log(
" startERP()"
);


Logger.log(
" erpHealth()"
);


Logger.log(
" erpDiag()"
);