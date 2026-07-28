// ============================================================
// ServiceRegistry v1.2.0
// TaxControl ERP Core
//
// Service Dependency Container
//
// Lifecycle:
//
// SystemInit
//      |
//      ↓
// ServiceRegistry.init()
//      |
//      ↓
// ServiceRegistry.refresh()
//      |
//      ↓
// register services
//
// ============================================================


console.log(
"ServiceRegistry v1.2.0"
);



const ServiceRegistry = {


version:"1.2.0",


initialized:false,


services:{},


lastRefresh:null,




// ============================================================
// INIT
// ============================================================


init(){


if(this.initialized){

return true;

}


Logger.log(
"ServiceRegistry INIT v"+
this.version
);



this.initialized=true;


return true;

},





// ============================================================
// REFRESH
// ============================================================


refresh(){


Logger.log(
"ServiceRegistry REFRESH START"
);



this.registerDefaults();



this.lastRefresh =
new Date()
.toISOString();



Logger.log(

"ServiceRegistry REFRESH COMPLETE count="
+
this.count()

);



return true;

},






// ============================================================
// REGISTER
// ============================================================


register(
name,
service,
options={}
){


if(!name){

throw new Error(
"Service name required"
);

}



if(!service){

return null;

}



if(
this.services[name]
&&
!options.force
){

Logger.warn(

"Service already registered "
+
name

);



return this.services[name];

}



this.services[name]=service;



Logger.log(

"Service registered "
+
name

);



return service;

},






// ============================================================
// REGISTER IF EXISTS
// ============================================================


registerIfExists(
name,
service
){


if(
!service
){

Logger.warn(

"Service unavailable "
+
name

);


return null;

}



return this.register(
name,
service
);


},






// ============================================================
// DEFAULT SERVICES
// ============================================================


registerDefaults(){



this.registerIfExists(

"ClientService",

globalThis.ClientService

);




this.registerIfExists(

"TransportOrderService",

globalThis.TransportOrderService

);




this.registerIfExists(

"FinanceService",

globalThis.FinanceService

);




this.registerIfExists(

"KPIService",

globalThis.KPIService

);



},






// ============================================================
// GET
// ============================================================


get(name){


return this.services[name] || null;


},






// ============================================================
// HAS
// ============================================================


has(name){


return !!this.services[name];


},






// ============================================================
// LIST
// ============================================================


list(){


return Object.keys(
this.services
);


},






// ============================================================
// COUNT
// ============================================================


count(){


return this.list().length;


},






// ============================================================
// HEALTH
// ============================================================


health(){


return {


module:
"ServiceRegistry",


version:
this.version,


initialized:
this.initialized,


count:
this.count(),


services:
this.list(),


lastRefresh:
this.lastRefresh,


status:

this.initialized
?
"OK"
:
"NOT_READY"


};


},






// ============================================================
// RESET
// ============================================================


reset(){


this.services={};


this.initialized=false;


this.lastRefresh=null;



return true;

}



};





globalThis.ServiceRegistry =
ServiceRegistry;