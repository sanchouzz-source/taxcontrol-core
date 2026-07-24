// ============================================================
// Config v1.0
// ERP Configuration Service
// ============================================================

console.log("Config v1.0");


const Config = {

  version:"1.0.0",

  initialized:false,

  settings:{},


  init(){

    if(this.initialized){
      Logger.debug("Config ALREADY READY");
      return true;
    }


    this.settings={

      system:{
        name:"ERP TexControl",
        environment:"development",
        version:"1.0.0"
      },


      database:{
        provider:"GoogleSheets"
      },


      events:{
        enabled:true
      },


      modules:{
        autoLoad:true
      }

    };


    this.initialized=true;


    Logger.info(
      "Config READY v"+this.version
    );


    return true;

  },


  get(key){

    return this.settings[key];

  },


  set(key,value){

    this.settings[key]=value;

  },


  all(){

    return this.settings;

  },


  health(){

    return {

      module:"Config",

      status:
        this.initialized
        ?
        "OK"
        :
        "FAILED",

      version:this.version

    };

  }


};


globalThis.Config=Config;


Logger.info(
"Config READY v1.0.0"
);