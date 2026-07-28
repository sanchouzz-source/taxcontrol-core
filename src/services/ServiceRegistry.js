// ============================================================
// ServiceRegistry v1.0.0
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
// ============================================================


console.log(
"ServiceRegistry v1.0.0"
);



const ServiceRegistry = {


version:"1.0.0",


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



this.registerDefaults();



this.initialized=true;



Logger.log(
"ServiceRegistry READY services="
+
Object.keys(this.services).length
);



return true;

},




// ============================================================
// REGISTER
// ============================================================


register(
name,
service
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



this.services[name]=service;



Logger.log(
"Service registered "
+
name
);



return service;

},




// ============================================================
// GET
// ============================================================


get(name){


return this.services[name] || null;


},




// ============================================================
// DEFAULT SERVICES
// ============================================================


registerDefaults(){



if(
typeof ClientService!=="undefined"
){

this.register(
"ClientService",
ClientService
);

}



if(
typeof TransportOrderService!=="undefined"
){

this.register(
"TransportOrderService",
TransportOrderService
);

}



if(
typeof FinanceService!=="undefined"
){

this.register(
"FinanceService",
FinanceService
);

}



if(
typeof KPIService!=="undefined"
){

this.register(
"KPIService",
KPIService
);

}



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
// HEALTH
// ============================================================


health(){


return {


module:
"ServiceRegistry",


version:
this.version,


count:
this.list().length,


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