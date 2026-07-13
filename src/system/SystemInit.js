const SystemInit={


version:"0.5.0",

initialized:false,

init(){

if(this.initialized){

Logger.log(
"ERP ALREADY INITIALIZED"
);

return;

}


Logger.log(
"ERP SYSTEM INIT START"
);

SchemaManager.init();
Database.init();
ModuleLoader.loadCore();

ModuleLoader.initAll();


this.initialized=true;



Logger.log(
"ERP SYSTEM READY"
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


dependencies:{


Database:
!!Database,


EventBus:
!!EventBus,


ModuleLoader:
!!ModuleLoader


}


}


);


}



};



globalThis.SystemInit =
SystemInit;