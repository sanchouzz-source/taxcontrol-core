console.log("SystemInit");


if(!globalThis.SystemInit){



const SystemInit={



version:"0.3.0",


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





ModuleLoader.loadCore();



ModuleLoader.init();





this.initialized=true;




Logger.log(
"ERP INIT COMPLETE"
);



},







health(){



return HealthContract.create(


"SystemInit",


this.initialized
?
"OK"
:
"NOT_READY",



{


version:this.version,


initialized:this.initialized,


dependencies:{


Database:
!!globalThis.Database,


EventBus:
!!globalThis.EventBus,


ModuleLoader:
!!globalThis.ModuleLoader



}


}



);



}



};




globalThis.SystemInit=
SystemInit;



}