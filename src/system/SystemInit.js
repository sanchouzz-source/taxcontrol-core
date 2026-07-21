const SystemInit = {


version:"0.6.0",

initialized:false,

startedAt:null,


init(){


if(this.initialized){

Logger.log(
"ERP SYSTEM ALREADY RUNNING"
);

return this.health();

}



Logger.log(
"===== ERP SYSTEM START ====="
);



try{


// 1. Database layer

if(typeof SchemaManager !== "undefined"){

SchemaManager.init();

}



if(typeof Database !== "undefined"){

Database.init();

}



// 2. Core registry

if(typeof Registry !== "undefined"){

Registry.init();

}



// 3. Event system

if(
typeof EventBus !== "undefined"
){

EventBus.init();

}



// 4. Load modules

if(
typeof ModuleLoader !== "undefined"
){

ModuleLoader.loadCore();

ModuleLoader.initAll();

}




// 5. Business engines

this.initEngines();




this.initialized=true;

this.startedAt=new Date().toISOString();



Logger.log(
"===== ERP SYSTEM READY v"+this.version+" ====="
);



}
catch(error){


Logger.log(
"ERP SYSTEM FAILED: "+
error.message
);


throw error;


}



return this.health();


},



initEngines(){


const engines=[

"FinanceEngine",
"KPIEngine",
"DashboardEngine"

];


engines.forEach(name=>{


if(
typeof globalThis[name] !== "undefined"
&&
typeof globalThis[name].init==="function"
){


globalThis[name].init();


Logger.log(
name+" STARTED"
);


}


});


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


startedAt:this.startedAt,


dependencies:{


SchemaManager:
typeof SchemaManager!=="undefined",


Database:
typeof Database!=="undefined",


EventBus:
typeof EventBus!=="undefined",


ModuleLoader:
typeof ModuleLoader!=="undefined",


EntityRegistry:
typeof EntityRegistry!=="undefined",


RepositoryFactory:
typeof RepositoryFactory!=="undefined"


}


}


);


}



};



globalThis.SystemInit =
SystemInit;