// ============================================================
// EntityRegistry v2.4.0
// Enterprise Entity Metadata Registry
// TaxControl ERP Core
//
// Sprint 1 CORE-001
//
// Compatible:
// EntityMetadata v2.x
// EntityService v5.x
// RepositoryFactory v2.8.x
// BaseRepository v5.7.x
// ============================================================


console.log("EntityRegistry v2.4.0");



const EntityRegistry = {


version:"2.4.0",


ready:false,

initialized:false,






// ============================================================
// ALIASES
// ============================================================


aliases:{


Client:"CLIENT",

Clients:"CLIENT",

client:"CLIENT",


CLI:"CLIENT",


Trip:"TRIP",

Trips:"TRIP",

TRP:"TRIP",


Carrier:"CARRIER",

Carriers:"CARRIER",

CAR:"CARRIER",


Driver:"DRIVER",

Drivers:"DRIVER",

DRV:"DRIVER",


Vehicle:"VEHICLE",

Vehicles:"VEHICLE",

VEH:"VEHICLE",


Route:"ROUTE",

Routes:"ROUTE",

RTE:"ROUTE",


Cargo:"CARGO",

Cargoes:"CARGO",

CRG:"CARGO",


FinanceTransaction:
"FINANCIAL_TRANSACTION",


FIN:
"FINANCIAL_TRANSACTION",


KPI:
"KPI",


AUD:
"AUDIT",


VER:
"VERSION"


},







// ============================================================
// ENTITY DEFINITIONS
// ============================================================


CLIENT:{


entity:"CLIENT",

module:"CORE",

table:"Clients",

idField:"ClientID",

idPrefix:"CLI",

repository:"ClientRepository",

audit:true,

softDelete:true,

timestamps:true,


events:{

created:"CLIENT_CREATED",

updated:"CLIENT_UPDATED",

deleted:"CLIENT_DELETED",

restored:"CLIENT_RESTORED"

}

},




TRIP:{


entity:"TRIP",

module:"LOGISTICS",

table:"Trips",

idField:"TripID",

idPrefix:"TRP",

repository:"TripRepository",

audit:true,

softDelete:true,

timestamps:true,


events:{


created:"TRIP_CREATED",

updated:"TRIP_UPDATED",

deleted:"TRIP_DELETED",

restored:"TRIP_RESTORED"

}


},




CARRIER:{


entity:"CARRIER",

module:"LOGISTICS",

table:"Carriers",

idField:"CarrierID",

idPrefix:"CAR",

repository:"CarrierRepository",

audit:true,

softDelete:true,

timestamps:true,

events:{}

},





DRIVER:{


entity:"DRIVER",

module:"LOGISTICS",

table:"Drivers",

idField:"DriverID",

idPrefix:"DRV",

repository:"DriverRepository",

audit:true,

softDelete:true,

timestamps:true,

events:{}

},




VEHICLE:{


entity:"VEHICLE",

module:"LOGISTICS",

table:"Vehicles",

idField:"VehicleID",

idPrefix:"VEH",

repository:"VehicleRepository",

audit:true,

softDelete:true,

timestamps:true,

events:{}

},




ROUTE:{


entity:"ROUTE",

module:"LOGISTICS",

table:"Routes",

idField:"RouteID",

idPrefix:"RTE",

repository:"RouteRepository",

audit:true,

softDelete:true,

timestamps:true,

events:{}

},




CARGO:{


entity:"CARGO",

module:"LOGISTICS",

table:"Cargoes",

idField:"CargoID",

idPrefix:"CRG",

repository:"CargoRepository",

audit:true,

softDelete:true,

timestamps:true,

events:{}

},





CLIENT_FINANCE_PROFILE:{


entity:"CLIENT_FINANCE_PROFILE",

module:"FINANCE",

table:"ClientFinanceProfiles",

idField:"FinanceProfileID",

idPrefix:"CFP",

repository:"ClientFinanceProfileRepository",

audit:true,

softDelete:true,

timestamps:true,

events:{}

},





FINANCIAL_TRANSACTION:{


entity:"FINANCIAL_TRANSACTION",

module:"FINANCE",

table:"FinancialTransactions",

idField:"TransactionID",

idPrefix:"FIN",

repository:"FinancialTransactionRepository",

audit:true,

softDelete:false,

timestamps:true,

events:{}

},





AUDIT:{


entity:"AUDIT",

module:"SYSTEM",

table:"AuditLog",

idField:"AuditID",

idPrefix:"AUD",

repository:"AuditRepository",

audit:false,

softDelete:false,

timestamps:true,

events:{}

},




VERSION:{


entity:"VERSION",

module:"SYSTEM",

table:"Versions",

idField:"VersionID",

idPrefix:"VER",

repository:"VersionRepository",

audit:false,

softDelete:false,

timestamps:true,

events:{}

},




KPI:{


entity:"KPI",

module:"ANALYTICS",

table:"KPIMetrics",

idField:"KPIID",

idPrefix:"KPI",

repository:"KPIRepository",

audit:true,

softDelete:true,

timestamps:true,

events:{}

}





};









// ============================================================
// INIT
// ============================================================


EntityRegistry.init=function(){


if(this.initialized)
return true;


this.initialized=true;

this.ready=true;


Logger.log(

"EntityRegistry INIT v"+
this.version+
" entities="+
this.list().length

);


return true;


};









// ============================================================
// NORMALIZE
// ============================================================


EntityRegistry.normalize=function(value){


return String(value)

.trim()

.replace(/-/g,"")

.toUpperCase();


};









// ============================================================
// RESOLVE
// ============================================================


EntityRegistry.resolve=function(value){


if(!value)

throw new Error(
"Entity empty"
);



let original =
String(value).trim();




let normalized =
this.normalize(original);




// alias

if(this.aliases[original])
return this.aliases[original];



if(this.aliases[normalized])
return this.aliases[normalized];





// direct entity

if(this.has(normalized))
return normalized;





// ID prefix search


const entities=this.list();



for(const e of entities){


const meta=this[e];


if(
meta.idPrefix &&
normalized.startsWith(
meta.idPrefix
)
){

return e;

}


}





// table

for(const e of entities){


if(
this[e].table.toUpperCase()
===
normalized
){

return e;

}


}





// repository

for(const e of entities){


if(
this[e].repository.toUpperCase()
===
normalized
){

return e;

}

}






// camelCase

const camel =
original
.replace(
/([a-z])([A-Z])/g,
"$1_$2"
)
.toUpperCase();



if(this.has(camel))
return camel;




throw new Error(
"Unknown entity "+
value
);


};









// ============================================================
// GET
// ============================================================


EntityRegistry.get=function(entity){


return this[
this.resolve(entity)
];


};









EntityRegistry.has=function(entity){


return !!(

this[entity]

&&

typeof this[entity]==="object"

&&

this[entity].entity

);


};









// ============================================================
// LIST
// ============================================================


EntityRegistry.list=function(){


return Object.keys(this)

.filter(k=>{


const x=this[k];


return (

x

&&

typeof x==="object"

&&

x.entity

&&

x.table

);


});


};









// ============================================================
// HELPERS
// ============================================================


EntityRegistry.getRepository=function(entity){

return this.get(entity).repository;

};



EntityRegistry.getTable=function(entity){

return this.get(entity).table;

};



EntityRegistry.getIdField=function(entity){

return this.get(entity).idField;

};



EntityRegistry.getPrefix=function(entity){

return this.get(entity).idPrefix;

};









// ============================================================
// VALIDATE
// ============================================================


EntityRegistry.validate=function(){


const errors=[];


const tables={};

const repos={};



this.list()
.forEach(e=>{


const m=this[e];


if(!m.idField)
errors.push(e+" idField missing");


if(!m.repository)
errors.push(e+" repository missing");


if(tables[m.table])
errors.push(
"Duplicate table "+m.table
);


tables[m.table]=e;



if(repos[m.repository])
errors.push(
"Duplicate repository "+m.repository
);


repos[m.repository]=e;


});


return errors;


};









// ============================================================
// HEALTH
// ============================================================


EntityRegistry.health=function(){


const errors=this.validate();


return HealthContract.create(

"EntityRegistry",

errors.length
?
"WARNING"
:
"OK",

{


version:this.version,

initialized:this.initialized,

entities:this.list(),

count:this.list().length,

errors

}

);


};









globalThis.EntityRegistry =
EntityRegistry;



EntityRegistry.init();



Logger.log(

"EntityRegistry GLOBAL READY v"+
EntityRegistry.version

);