const SystemInit = {


initialized:false,


init(){


if(this.initialized){

Logger.log(
"SYSTEM ALREADY INITIALIZED"
);

return;

}



Logger.log(
"ERP INIT START"
);



if(typeof SchemaManager !== "undefined"){

SchemaManager.init();

}



if(typeof Registry !== "undefined"){

Registry.init();

}



if(typeof ModuleLoader !== "undefined"){


ModuleLoader.loadCore();


ModuleLoader.initAll();


}



this.initialized=true;



Logger.log(
"ERP INIT COMPLETE"
);



}



};



globalThis.SystemInit =
SystemInit;