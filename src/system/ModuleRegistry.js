// ============================================================
// ModuleRegistry v1.9.1
// EventBus integration + HealthContract + Diagnostics
// ============================================================

console.log("ModuleRegistry v1.9.1");


const ModuleRegistry = {

  version: "1.9.1",
  apiVersion: "1.0",

  modules: {},
  started: {},

  failed: [],
  failedHistory: [],

  initialized: false,

  eventBus: null,

  currentPhase: null,


  // ============================================================
  // EVENT BUS
  // ============================================================

  setEventBus(bus){

    this.eventBus = bus;

    Logger?.log?.(
      "ModuleRegistry: EventBus attached"
    );

  },


  _emitModuleEvent(type, payload){

    try{

      if(
        this.eventBus &&
        typeof this.eventBus.emit === "function"
      ){

        this.eventBus.emit(
          type,
          {
            module: payload.name,
            version: payload.version,
            phase: payload.phase,
            timestamp:
              new Date().toISOString()
          },
          {
            source:"ModuleRegistry"
          }
        );

      }

    }
    catch(e){

      Logger?.warn?.(
        "ModuleRegistry event failed: "
        + e.message
      );

    }

  },


  // ============================================================
  // INIT
  // ============================================================


  init(){

    if(this.initialized){

      Logger?.warn?.(
        "ModuleRegistry already initialized"
      );

      return;

    }


    this.modules={};
    this.started={};

    this.failed=[];
    this.failedHistory=[];


    this.initialized=true;


    Logger?.log?.(
      "ModuleRegistry INITIALIZED v"
      + this.version
    );

  },


  // ============================================================
  // REGISTER MODULE
  // ============================================================


  register(name, definition){


    if(!definition){

      Logger?.warn?.(
        `ModuleRegistry ${name}: empty definition`
      );

      return false;

    }


    if(this.modules[name]){

      Logger?.warn?.(
        `ModuleRegistry ${name} already registered`
      );

      return false;

    }



    if(
      definition.apiVersion &&
      !this._versionSatisfies(
          this.apiVersion,
          definition.apiVersion
      )
    ){

      Logger?.error?.(
        `${name} requires API ${definition.apiVersion}`
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


      versionDependencies:
        definition.versionDependencies || [],



      enabled:
        definition.enabled !== false,


      permissions:
        definition.permissions || [],



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


      starting:false,


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


      destroy:
        definition.destroy || null,


      rollback:
        definition.rollback || null,


      health:
        definition.health || null

    };



    this.modules[name]=mod;



    Logger?.log?.(
      `ModuleRegistry: ${name} v${mod.version} registered`
      +
      ` (phase=${mod.phase}, priority=${mod.priority})`
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


    if(!manifest){

      Logger?.warn?.(
        "ModuleRegistry: empty manifest"
      );

      return 0;

    }


    let count=0;


    for(
      const [key,item]
      of Object.entries(manifest)
    ){


      const definition =
        item.moduleDefinition || item;



      if(
        !definition ||
        !definition.name
      ){

        Logger?.warn?.(
          `Invalid manifest item ${key}`
        );

        continue;

      }



      const name =
        definition.name || key;



      if(
        this.register(
          name,
          definition
        )
      ){

        count++;

      }


    }



    Logger?.log?.(
      `ModuleRegistry: loaded ${count} modules`
    );


    return count;

  },



  // ============================================================
  // HEALTH
  // ============================================================


  health(){


    return HealthContract.create(

      "ModuleRegistry",

      this.initialized
        ? "OK"
        : "WARNING",


      {


        version:this.version,


        initialized:
          this.initialized,


        modules:
          Object.keys(this.modules),


        started:
          Object.keys(this.started),


        failed:
          this.failed,


        phase:
          this.currentPhase


      }

    );

  },



  // ============================================================
  // DIAGNOSTICS
  // ============================================================


  diagnostics(){


    return {


      version:this.version,


      initialized:
        this.initialized,


      modules:
        Object.values(this.modules)
          .map(m=>({

             name:m.name,

             version:m.version,

             phase:m.phase,

             status:m.status

          })),


      started:
        Object.keys(this.started),


      failed:
        this.failed


    };


  }



};



globalThis.ModuleRegistry =
  ModuleRegistry;


Logger?.log?.(
 "ModuleRegistry READY v"
 + ModuleRegistry.version
);