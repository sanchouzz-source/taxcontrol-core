// ============================================================
// ModuleRegistry v1.9.2
// Enterprise Module Lifecycle Manager
// ============================================================

console.log("ModuleRegistry v1.9.2");


const ModuleRegistry = {

  version: "1.9.2",
  apiVersion: "1.0",

  modules: {},
  started: {},
  failed: [],
  failedHistory: [],

  initialized: false,
  eventBus: null,


  // ============================================================
  // EVENT BUS
  // ============================================================


  setEventBus(bus){

    this.eventBus = bus;

    Logger.log(
      "ModuleRegistry: EventBus attached"
    );

  },


  _emitModuleEvent(type,module){

    try{

      if(
        this.eventBus &&
        typeof this.eventBus.emit === "function"
      ){

        this.eventBus.emit(
          type,
          {
            module: module.name,
            version: module.version,
            timestamp:new Date()
          }
        );

      }


      Logger.log(
        `EVENT ${type} HANDLERS 0`
      );


    }catch(e){

      Logger.warn(
        "ModuleRegistry event error: "
        + e.message
      );

    }

  },


// ============================================================
// INIT
// ============================================================


init(){

    if(this.initialized){

      Logger.warn(
        "ModuleRegistry already initialized"
      );

      return;

    }


    this.modules={};
    this.started={};
    this.failed=[];
    this.failedHistory=[];


    this.initialized=true;


    Logger.log(
      "ModuleRegistry INITIALIZED v"
      +this.version
    );

},



// ============================================================
// REGISTER
// ============================================================


register(name,definition){


 if(!definition){

   Logger.warn(
    `ModuleRegistry ${name} no definition`
   );

   return false;

 }



 if(this.modules[name]){

   Logger.warn(
    `ModuleRegistry ${name} already exists`
   );

   return false;

 }



 const mod={


 name,

 version:
 definition.version || "1.0.0",

 description:
 definition.description || "",


 owner:
 definition.owner || "CORE",


 phase:
 definition.phase || "DOMAIN",


 priority:
 definition.priority ?? 100,


 dependencies:
 definition.dependencies || [],


 enabled:
 definition.enabled !== false,


 api:
 definition.api ||
 {
 entities:[],
 events:[],
 services:[]
 },


 status:"REGISTERED",

 startedAt:null,

 error:null,


 register:
 definition.register || null,


 init:
 definition.init || null,


 start:
 definition.start || null,


 ready:
 definition.ready || null,


 stop:
 definition.stop || null,


 health:
 definition.health || null



 };


 this.modules[name]=mod;


 Logger.log(
 `ModuleRegistry: ${name} v${mod.version} registered`
 );


 this._emitModuleEvent(
 "MODULE_REGISTERED",
 mod
 );


 return true;


},



// ============================================================
// MANIFEST
// ============================================================


loadManifest(manifest){

 return this.registerManifest(manifest);

},



registerManifest(manifest){


 let count=0;


 for(
 const [key,item]
 of Object.entries(manifest || {})
 ){


 const definition =
 item.moduleDefinition || item;



 const name =
 definition.name || key;



 if(!this.modules[name]){

   this.register(
    name,
    definition
   );


   count++;

 }


 }


 Logger.log(
 `ModuleRegistry: loaded ${count} modules`
 );


 return count;


},



// ============================================================
// START ALL
// ============================================================


async startAll(){


 Logger.log(
 "ModuleRegistry START ALL"
 );


 const order =
 this._topologicalSort();



 for(const name of order){


   await this._startModule(
    this.modules[name]
   );


 }


 Logger.log(
 "ModuleRegistry ALL MODULES STARTED"
 );


 return true;


},



// ============================================================
// START MODULE
// ============================================================


async _startModule(mod){


 if(!mod ||
    !mod.enabled)
 return;



 try{


 Logger.log(
 `MODULE START ${mod.name}`
 );


 mod.status="STARTING";



 if(typeof mod.register==="function"){

   await mod.register();

 }



 if(typeof mod.init==="function"){

   await mod.init();

 }



 if(typeof mod.start==="function"){

   await mod.start();

 }



 if(typeof mod.ready==="function"){

   await mod.ready();

 }



 mod.status="READY";

 mod.startedAt=
 new Date();



 this.started[mod.name]=true;



 Logger.log(
 `MODULE READY ${mod.name}`
 );



 }
 catch(e){


 mod.status="FAILED";

 mod.error=e.message;


 this.failed.push(
  mod.name
 );


 this.failedHistory.push(
 {
  module:mod.name,
  error:e.message,
  time:new Date()
 }
 );


 Logger.error(
 `MODULE FAILED ${mod.name}: ${e.message}`
 );


 throw e;


 }


},




// ============================================================
// DEPENDENCY ORDER
// ============================================================


_topologicalSort(){


 return Object.values(this.modules)

 .sort(
 (a,b)=>
 a.priority-b.priority
 )

 .map(
 m=>m.name
 );


},




// ============================================================
// STOP
// ============================================================


async stopAll(){


 for(
 const mod
 of Object.values(this.modules)
 ){

 try{

 if(typeof mod.stop==="function")
   await mod.stop();


 mod.status="STOPPED";


 }catch(e){

 Logger.warn(
 `STOP ERROR ${mod.name}`
 );

 }


 }


},



// ============================================================
// HEALTH
// ============================================================


health(){


return {


status:
 this.failed.length
 ?"WARNING"
 :"READY",


version:
 this.version,


modules:
 Object.values(this.modules)
 .map(
 m=>({
 name:m.name,
 status:m.status
 })
 ),


failed:
 this.failed


};


}




};



globalThis.ModuleRegistry =
ModuleRegistry;



Logger.log(
"ModuleRegistry READY v"
+ModuleRegistry.version
);