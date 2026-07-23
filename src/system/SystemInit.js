console.log("SystemInit v1.0.0");


const SystemInit = {


version:"1.0.0",

initialized:false,

startedAt:null,


safeInit(name){


try{


const obj=globalThis[name];


if(
obj &&
typeof obj.init==="function"
){

obj.init();

Logger.log(
name+" READY"
);

return true;

}


Logger.debug(
name+" skipped"
);


}
catch(e){


Logger.error(
name+" FAILED "+e.message
);


return false;

}


},



init(){


if(this.initialized)
return this.health();



Logger.log(
"===== ERP BOOT START ====="
);



this.startedAt =
new Date().toISOString();



// 1 CORE

this.initCore();



// 2 EVENT ENGINE

this.initEventEngine();



// 3 MODULE SYSTEM

this.initModules();



// 4 SERVICES

this.initServices();



this.initialized=true;



Logger.log(
"===== ERP READY v"+
this.version+
" ====="
);



return this.health();


},



initCore(){


[
"SchemaManager",
"Database",
"EntityRegistry",
"Registry"
]
.forEach(
n=>this.safeInit(n)
);


},



initEventEngine(){


[
"EventBus",
"ERPEventContract",
"BusinessEventProcessor"
]
.forEach(
n=>this.safeInit(n)
);


},



initModules(){



if(typeof ModuleLoader==="undefined")
{

Logger.warn(
"ModuleLoader unavailable"
);

return;

}



try{


ModuleLoader.loadCore();


ModuleLoader.initAll();



Logger.log(
"MODULE SYSTEM READY"
);


}
catch(e){


Logger.error(
"MODULE SYSTEM FAILED "+
e.message
);


}


},



initServices(){


[
"FinanceEngine",
"KPIEngine",
"DashboardEngine"
]
.forEach(
n=>this.safeInit(n)
);


},



health(){


return HealthContract.create(

"SystemInit",

this.initialized?
"OK":
"WARNING",

{


version:this.version,


startedAt:this.startedAt,


core:{

Database:
typeof Database!=="undefined",

EventBus:
typeof EventBus!=="undefined",

EntityRegistry:
typeof EntityRegistry!=="undefined"

},


modules:{

ModuleLoader:
typeof ModuleLoader!=="undefined",

TransportOrder:
typeof TransportOrderEventHandler!=="undefined",

CRM:
typeof CRMSubscriptions!=="undefined"

}


}


);


}



};



globalThis.SystemInit=SystemInit;


Logger.log(
"SystemInit READY v1.0.0"
);