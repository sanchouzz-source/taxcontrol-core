// ============================================================
// SystemInit v2.7.0
// Enterprise ERP Bootstrap Orchestrator
// TaxControl ERP Core
// ============================================================


console.log("SystemInit v2.7.0");



const SystemInit={


version:"2.7.0",


initialized:false,


initializing:false,


startedAt:null,


bootLog:[],


started:{},


componentStatus:{},







dependencyGraph:{


Config:[],


Logger:[],


HealthContract:[],


EntityMetadata:[],


EntityRegistry:[
"EntityMetadata"
],


SchemaRegistry:[
"EntityRegistry"
],



SchemaManager:[
"SchemaRegistry"
],



SpreadsheetAdapter:[
],



Database:[
"SchemaManager",
"SpreadsheetAdapter"
],



BaseRepository:[
"Database"
],



RepositoryFactory:[
"EntityRegistry",
"BaseRepository"
],



EntityService:[
"RepositoryFactory"
],



ERPEventContract:[],


EventBus:[
"ERPEventContract"
],



BusinessEventProcessor:[
"EventBus"
],



ModuleRegistry:[
"EventBus",
"EntityService"
],



ModuleLoader:[
"ModuleRegistry"
]



},







criticalComponents:[


"Config",

"Logger",

"SchemaManager",

"Database",

"BaseRepository",

"RepositoryFactory",

"EntityService",

"EventBus"



],







componentPhase:{


Config:"BOOT",

Logger:"BOOT",


EntityMetadata:"ENTITY",

EntityRegistry:"ENTITY",

SchemaRegistry:"ENTITY",


SchemaManager:"CORE",


SpreadsheetAdapter:"STORAGE",


Database:"STORAGE",


BaseRepository:"REPOSITORY",

RepositoryFactory:"REPOSITORY",


EntityService:"APPLICATION",


EventBus:"EVENT",


ModuleRegistry:"MODULE",

ModuleLoader:"MODULE"



},







_syncStarted(name){


this.started[name]=true;


this.componentStatus[name]={


status:"OK",

time:new Date().toISOString()


};



},







async _start(name,fn){


if(this.started[name]) return true;



const deps=this.dependencyGraph[name]||[];



for(const dep of deps){


if(!this.started[dep]){


throw new Error(
name+
" dependency missing "+
dep
);


}


}




try{


const start=Date.now();



await fn();



this.bootLog.push({

name,

phase:this.componentPhase[name],

status:"OK",

duration:
Date.now()-start

});



this._syncStarted(name);



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



this.bootLog.push({

name,

status:"FAILED",

error:e.message

});



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







safeInit(name,args){


const obj=globalThis[name];


if(!obj)return true;



if(
typeof obj.init==="function"
){


return obj.init(args);


}


return true;


},







async init(){


if(this.initialized)
return this.health();



if(this.initializing)
return;



this.initializing=true;


this.startedAt=
new Date().toISOString();



Logger.log(
"========== ERP START =========="
);



try{



await this._start(
"Config",
()=>this.safeInit("Config")
);



await this._start(
"Logger",
()=>this.safeInit("Logger")
);



await this._start(
"EntityMetadata",
()=>this.safeInit("EntityMetadata")
);



await this._start(
"EntityRegistry",
()=>this.safeInit("EntityRegistry")
);



await this._start(
"SchemaRegistry",
()=>this.safeInit("SchemaRegistry")
);



await this._start(
"SchemaManager",
()=>this.safeInit("SchemaManager")
);



await this._start(
"SpreadsheetAdapter",
()=>this.safeInit("SpreadsheetAdapter")
);



await this._start(
"Database",
()=>this.safeInit("Database")
);



await this._start(
"BaseRepository",
()=>BaseRepository.init(Database)
);



await this._start(
"RepositoryFactory",
()=>RepositoryFactory.init()
);



RepositoryFactory.refresh?.();





await this._start(
"EntityService",
()=>this.safeInit("EntityService")
);





await this._start(
"ERPEventContract",
()=>this.safeInit("ERPEventContract")
);



await this._start(
"EventBus",
()=>this.safeInit("EventBus")
);





await this._start(
"BusinessEventProcessor",
()=>this.safeInit("BusinessEventProcessor")
);






if(
typeof ModuleRegistry!=="undefined"
){


await this._start(
"ModuleRegistry",
()=>{


ModuleRegistry.init?.();


ModuleRegistry.setEventBus?.(
EventBus
);



ModuleRegistry.loadManifest?.(
ERP_MODULE_MANIFEST
);



}

);


}






if(
typeof ModuleLoader!=="undefined"
){


await this._start(
"ModuleLoader",
()=>ModuleLoader.initAll?.()

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
"ERP FAILED "+
e.message
);



throw e;



}
finally{


this.initializing=false;


}



},







validate(){


if(
EntityMetadata?.validate
){


const result =
EntityMetadata.validate();



if(result.length){


throw new Error(
"Metadata errors "+
result.join(",")
);


}


}



return true;


},







emitStart(){


EventBus?.emit?.(
"ERP_STARTED",
{

version:this.version,

time:new Date().toISOString()

}

);


},







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

components:this.componentStatus,

modules:
ModuleRegistry?.health?.()



}

);


},







diagnostics(){


return{


version:this.version,


startedAt:this.startedAt,


boot:this.bootLog,


components:this.componentStatus,


repository:
RepositoryFactory?.diagnostics?.(),


modules:
ModuleRegistry?.diagnostics?.()



};


},







reset(){


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




globalThis.SystemInit=
SystemInit;



Logger.log(
"SystemInit READY v"+
SystemInit.version
);