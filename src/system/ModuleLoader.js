// ============================================================
// ModuleLoader v1.2.0
// TaxControl ERP Core
//
// Responsibility:
//
// - Register infrastructure components
// - Load module manifest
// - Prepare ModuleRegistry
// - Diagnostics
//
// NOT responsible:
// - Module lifecycle
// - Dependency resolution
// - Module start/stop
//
// Compatible:
// SystemInit v2.6.x
// ModuleRegistry v2.3.x
//
// ============================================================


console.log("ModuleLoader v1.2.0");



const ModuleLoader = {


version:"1.2.0",


initialized:false,


coreLoaded:[],


manifestLoaded:false,



startedAt:null,







// ============================================================
// CORE REGISTRY
// ============================================================


coreComponents:[


"AuditConstants",

"PermissionConstants",

"RoleConstants",


"EntityConstants",

"EntityEvents",


"ClientValidator",

"TripValidator",


"AuditLog",

"AuditEventHandler",


"SecurityGuard"


],







// ============================================================
// INIT
// ============================================================


init(){


if(this.initialized){


Logger.debug(
"ModuleLoader already initialized"
);


return true;


}



Logger.log(
"========== MODULE LOADER INIT =========="
);



this.startedAt =
new Date().toISOString();




this.loadCore();



this.loadManifest();



this.initialized=true;



Logger.log(
"ModuleLoader READY v"+
this.version
);



return true;


},







// ============================================================
// CORE LOADING
// ============================================================


loadCore(){



Logger.log(
"CORE COMPONENT REGISTRATION START"
);



let count=0;



for(
const name of this.coreComponents
){



if(
this.coreLoaded.includes(name)
){

continue;

}



const component =
globalThis[name];



if(!component){


Logger.warn(
"CORE COMPONENT MISSING "+
name
);


continue;

}





try{


if(
typeof CoreRegistry!=="undefined"
&&
CoreRegistry.register
){



CoreRegistry.register(

name,

component

);


}




this.coreLoaded.push(name);



count++;



Logger.log(
"CORE REGISTERED "+
name
);



}
catch(e){



Logger.error(

"CORE REGISTER FAILED "+
name+
" "+
e.message

);



}



}



Logger.log(
"CORE REGISTRATION COMPLETE count="+
count
);



return count;


},







// ============================================================
// MANIFEST
// ============================================================


loadManifest(){



if(
typeof ModuleRegistry==="undefined"
){


throw new Error(
"ModuleRegistry unavailable"
);


}



if(
typeof ERP_MODULE_MANIFEST==="undefined"
){


Logger.warn(
"ERP_MODULE_MANIFEST NOT FOUND"
);



return 0;


}





try{



const count =
ModuleRegistry.loadManifest(
ERP_MODULE_MANIFEST
);



this.manifestLoaded=true;



Logger.log(

"MODULE MANIFEST LOADED count="+
count

);



return count;



}
catch(e){



Logger.error(

"MANIFEST LOAD FAILED "+
e.message

);



throw e;


}



},







// ============================================================
// START DELEGATION
// ============================================================


async start(){



if(
typeof ModuleRegistry==="undefined"
){


throw new Error(
"ModuleRegistry unavailable"
);


}



return ModuleRegistry.startAll();


},







// ============================================================
// STOP
// ============================================================


async stop(){


if(
typeof ModuleRegistry!=="undefined"
&&
ModuleRegistry.stopAll
){


return ModuleRegistry.stopAll();


}



return true;


},







// ============================================================
// MODULE ACCESS
// ============================================================


listModules(){


if(
typeof ModuleRegistry==="undefined"
){

return [];

}



return ModuleRegistry.list();


},







// ============================================================
// STATUS
// ============================================================


status(){



return{


version:this.version,


initialized:this.initialized,


startedAt:this.startedAt,


manifestLoaded:this.manifestLoaded,


coreLoaded:this.coreLoaded,


modules:
this.listModules()


};


},







// ============================================================
// HEALTH
// ============================================================


health(){



const status =
this.status();



let state =
this.initialized
?
"OK"
:
"WARNING";



return HealthContract.create(

"ModuleLoader",

state,

status

);


},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){


return{


version:this.version,


initialized:this.initialized,


coreLoaded:this.coreLoaded,


manifestLoaded:this.manifestLoaded,


moduleRegistry:

typeof ModuleRegistry!=="undefined"

?

ModuleRegistry.diagnostics()

:

null


};


},







// ============================================================
// RESET
// ============================================================


reset(){


this.initialized=false;


this.coreLoaded=[];


this.manifestLoaded=false;


this.startedAt=null;



Logger.log(
"ModuleLoader RESET"
);


}



};







// ============================================================
// GLOBAL
// ============================================================


globalThis.ModuleLoader =
ModuleLoader;






// ============================================================
// COMMANDS
// ============================================================


globalThis.moduleLoaderHealth =
()=>ModuleLoader.health();



globalThis.moduleLoaderDiag =
()=>ModuleLoader.diagnostics();



globalThis.moduleLoaderStatus =
()=>ModuleLoader.status();





Logger.log(
"ModuleLoader GLOBAL READY v"+
ModuleLoader.version
);