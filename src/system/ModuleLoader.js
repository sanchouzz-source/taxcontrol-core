// ============================================================
// ModuleLoader v1.3.0
// TaxControl ERP Core
//
// Responsibility:
//
// - Register infrastructure components
// - Prepare ModuleRegistry
// - Diagnostics
//
// NOT responsible:
//
// - Manifest lifecycle
// - Module dependency resolution
// - Module start/stop
//
// Manifest loading:
// handled by SystemInit
//
// Compatible:
// SystemInit v2.7.x
// ModuleRegistry v2.3.x
//
// ============================================================


console.log("ModuleLoader v1.3.0");



const ModuleLoader = {


version:"1.3.0",


initialized:false,


coreLoaded:[],


startedAt:null,





// ============================================================
// CORE COMPONENTS
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



this.initialized=true;



Logger.log(
"ModuleLoader READY v"+
this.version
);



return true;


},







// ============================================================
// CORE REGISTRATION
// ============================================================


loadCore(){



Logger.log(
"CORE COMPONENT REGISTRATION START"
);



let registered=0;



this.coreComponents.forEach(name=>{



if(
this.coreLoaded.includes(name)
){

return;

}



const component =
globalThis[name];



if(!component){


Logger.warn(
"CORE COMPONENT MISSING "+
name
);


return;

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



registered++;



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



});




Logger.log(

"CORE REGISTRATION COMPLETE count="+
registered

);



return registered;


},







// ============================================================
// MANIFEST STATUS
// ============================================================


manifestStatus(){


return {


available:
typeof ERP_MODULE_MANIFEST!=="undefined",


modules:
typeof ERP_MODULE_MANIFEST!=="undefined"
?
ERP_MODULE_MANIFEST.list()
:
[]


};


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



Logger.warn(

"ModuleLoader.start delegates to ModuleRegistry"

);



return ModuleRegistry.startAll?.();



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
// MODULE LIST
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



return {


version:this.version,


initialized:this.initialized,


startedAt:this.startedAt,


coreLoaded:this.coreLoaded,


manifest:this.manifestStatus(),


modules:this.listModules()


};


},







// ============================================================
// HEALTH
// ============================================================


health(){


return HealthContract.create(

"ModuleLoader",

this.initialized
?
"OK"
:
"WARNING",

this.status()

);


},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){


return {


version:this.version,


initialized:this.initialized,


coreLoaded:this.coreLoaded,


manifest:this.manifestStatus(),


registry:

typeof ModuleRegistry!=="undefined"

?

ModuleRegistry.diagnostics?.()

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