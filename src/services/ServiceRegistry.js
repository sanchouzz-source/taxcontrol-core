// ============================================================
// ServiceRegistry v1.1.0
// TaxControl ERP Core
//
// Architecture:
//
// ServiceRegistry
//        |
//        +-- ClientService
//        +-- TransportOrderService
//        +-- FinanceService
//        +-- KPIService
//
// Lifecycle:
//
// INIT
//   |
// REFRESH
//   |
// REGISTER SERVICES
//
// Compatible:
// Bootstrap v3.1+
// SystemInit v2.9+
// StartupSequence v1+
//
// ============================================================


console.log(
"ServiceRegistry v1.1.0"
);



const ServiceRegistry = {


version:"1.1.0",


initialized:false,


services:{},



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
// Повторная регистрация после загрузки всех файлов
// ============================================================


refresh(){


Logger.log(
"ServiceRegistry REFRESH"
);



this.registerDefaults();



Logger.log(

"ServiceRegistry REFRESH COMPLETE count="
+
this.list().length

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

throw new Error(
"Service object required "
+
name
);

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
typeof service==="undefined" ||
service===null
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
// GET
// ============================================================


get(name){


return (

this.services[name]
||
null

);


},




// ============================================================
// HAS
// ============================================================


has(name){


return !!this.services[name];


},




// ============================================================
// REMOVE
// ============================================================


remove(name){


if(
this.services[name]
){

delete this.services[name];


return true;

}


return false;


},




// ============================================================
// DEFAULT SERVICES
// ============================================================


registerDefaults(){



this.registerIfExists(

"ClientService",

typeof ClientService!=="undefined"
?
ClientService
:
null

);




this.registerIfExists(

"TransportOrderService",

typeof TransportOrderService!=="undefined"
?
TransportOrderService
:
null

);




this.registerIfExists(

"FinanceService",

typeof FinanceService!=="undefined"
?
FinanceService
:
null

);




this.registerIfExists(

"KPIService",

typeof KPIService!=="undefined"
?
KPIService
:
null

);




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
// CLEAR
// Для тестов
// ============================================================


clear(){


this.services={};


return true;


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


count:
this.count(),


services:
this.list(),


status:

this.initialized
?
"OK"
:
"NOT_READY"


};


}




};





globalThis.ServiceRegistry =
ServiceRegistry;



ServiceRegistry.init();