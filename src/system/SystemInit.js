const SystemInit = {

version:"0.6.0",

initialized:false,

modules:{},


init(){


if(this.initialized){

Logger.log(
"ERP SYSTEM ALREADY INITIALIZED"
);

return true;

}



Logger.log(
"===== ERP SYSTEM INIT START ====="
);



this.initModule(
"SchemaManager",
()=>SchemaManager.init()
);



this.initModule(
"Database",
()=>Database.init()
);



this.initModule(
"Registry",
()=>Registry.init?.()
);



this.initModule(
"EventBus",
()=>EventBus.init()
);





/*
==============================
EVENT HANDLERS
==============================
*/


this.initModule(
"ClientEventHandler",
()=>ClientEventHandler.init?.()
);



this.initModule(
"TripEventHandler",
()=>TripEventHandler.init?.()
);



this.initModule(
"TransportOrderEventHandler",
()=>TransportOrderEventHandler.init?.()
);





/*
==============================
BUSINESS ENGINES
==============================
*/


this.initModule(
"FinanceEngine",
()=>FinanceEngine.init?.()
);



this.initModule(
"KPIEngine",
()=>KPIEngine.init?.()
);



this.initModule(
"DashboardEngine",
()=>DashboardEngine.init?.()
);





/*
==============================
SUBSCRIPTIONS
==============================
*/


this.initModule(
"LogisticsEventSubscriptions",
()=>LogisticsEventSubscriptions.init?.()
);



this.initModule(
"EventSubscriptions",
()=>EventSubscriptions.initEventSubscriptions?.()
);






/*
==============================
MODULES
==============================
*/


this.initModule(
"ModuleLoader",
()=>ModuleLoader.initAll?.()
);





this.initialized=true;



Logger.log(
"===== ERP SYSTEM READY v"+
this.version+
" ====="
);



return true;


},





initModule(name,callback){


try{


if(
typeof callback==="function"
){

callback();

this.modules[name]="READY";


Logger.log(
"MODULE READY "+name
);


}


}
catch(e){


this.modules[name]="ERROR";


Logger.error(
"MODULE FAILED "+
name+
" "+
e.message
);


}


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

modules:this.modules,

dependencies:{


Database:
typeof Database!=="undefined",


EventBus:
typeof EventBus!=="undefined",


Registry:
typeof Registry!=="undefined"


}


}


);


}


};



globalThis.SystemInit =
SystemInit;