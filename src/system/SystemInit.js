const SystemInit = {


version:"0.6.0",

initialized:false,


init(){


if(this.initialized){

Logger.log(
"ERP SYSTEM ALREADY INITIALIZED"
);

return true;

}



Logger.log(
"ERP SYSTEM INIT START"
);





/*
=================================
CORE INFRASTRUCTURE
=================================
*/


SchemaManager.init();

Database.init();

Registry.init();

EventBus.init();





/*
=================================
MODULE LOADER
=================================
*/


if(
typeof ModuleLoader !== "undefined"
){

ModuleLoader.loadCore();

ModuleLoader.initAll();

}





/*
=================================
EVENT HANDLERS
=================================
*/


if(
typeof TransportOrderEventHandler !== "undefined"
){

TransportOrderEventHandler.init();

}



if(
typeof TripEventHandler !== "undefined"
){

TripEventHandler.init();

}





/*
=================================
EVENT SUBSCRIPTIONS
=================================
*/


if(
typeof LogisticsEventSubscriptions !== "undefined"
){

LogisticsEventSubscriptions.init();

}



if(
typeof EventSubscriptions !== "undefined"
){

EventSubscriptions.initEventSubscriptions();

}





/*
=================================
BUSINESS ENGINES
=================================
*/


if(
typeof FinanceEngine !== "undefined"
){

FinanceEngine.init();

}


if(
typeof KPIEngine !== "undefined"
){

KPIEngine.init();

}



if(
typeof DashboardEngine !== "undefined"
){

DashboardEngine.init?.();

}





this.initialized=true;



Logger.log(
"ERP SYSTEM READY v"+
this.version
);



return true;


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
typeof Database !== "undefined",


EventBus:
typeof EventBus !== "undefined",


Registry:
typeof Registry !== "undefined",


ModuleLoader:
typeof ModuleLoader !== "undefined",


TransportOrderEventHandler:
typeof TransportOrderEventHandler !== "undefined"


}



}


);


}



};



globalThis.SystemInit =
SystemInit;