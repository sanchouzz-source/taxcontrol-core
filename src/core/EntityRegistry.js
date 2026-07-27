// ============================================================
// EntityRegistry v2.3.1
// Enterprise Entity Metadata Registry
// TaxControl ERP Core
//
// Compatible:
// EntityMetadata v2.1.x
// EntityService v5.x
// RepositoryFactory v2.7.x
// BaseRepository v5.6.x
// ============================================================


console.log("EntityRegistry v2.3.1");



const EntityRegistry = {


version:"2.3.1",

ready:false,

initialized:false,




// ============================================================
// ALIASES
// ============================================================


aliases:{


ClientFinanceProfiles:
"CLIENT_FINANCE_PROFILE",


FinancialTransactions:
"FINANCIAL_TRANSACTION",


AuditLogs:
"AUDIT",


Versions:
"VERSION",


TransportOrders:
"TRANSPORT_ORDER",


Carriers:
"CARRIER",


Drivers:
"DRIVER",


Vehicles:
"VEHICLE",


Routes:
"ROUTE",


Cargoes:
"CARGO"


},




// ============================================================
// ENTITIES
// ============================================================


CLIENT:{
entity:"CLIENT",
module:"core",
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
module:"core",
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



CLIENT_FINANCE_PROFILE:{
entity:"CLIENT_FINANCE_PROFILE",
module:"finance",
table:"ClientFinanceProfiles",
idField:"FinanceProfileID",
idPrefix:"FP",
repository:"ClientFinanceProfileRepository",
audit:true,
softDelete:true,
timestamps:true,
events:{}
},



FINANCIAL_TRANSACTION:{
entity:"FINANCIAL_TRANSACTION",
module:"finance",
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
module:"system",
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
module:"system",
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
module:"analytics",
table:"KPIMetrics",
idField:"KPIID",
idPrefix:"KPI",
repository:"KPIRepository",
audit:true,
softDelete:true,
timestamps:true,
events:{}
},



TRANSPORT_ORDER:{
entity:"TRANSPORT_ORDER",
module:"logistics",
table:"TransportOrders",
idField:"TransportOrderID",
idPrefix:"TO",
repository:"TransportOrderRepository",
audit:true,
softDelete:true,
timestamps:true,
events:{}
},



CARRIER:{
entity:"CARRIER",
module:"logistics",
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
module:"logistics",
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
module:"logistics",
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
module:"logistics",
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
module:"logistics",
table:"Cargoes",
idField:"CargoID",
idPrefix:"CRG",
repository:"CargoRepository",
audit:true,
softDelete:true,
timestamps:true,
events:{}
},




// ============================================================
// SYSTEM TEST ENTITIES
// ============================================================


__TEST_DATABASE:{
entity:"__TEST_DATABASE",
module:"system",
table:"__TEST_DATABASE",
idField:"id",
idPrefix:"TESTDB",
repository:"BaseRepository",
system:true
},


__TEST_EVENTS:{
entity:"__TEST_EVENTS",
module:"system",
table:"__TEST_EVENTS",
idField:"id",
idPrefix:"TESTEV",
repository:"BaseRepository",
system:true
},


__TEST_REPOSITORY:{
entity:"__TEST_REPOSITORY",
module:"system",
table:"__TEST_REPOSITORY",
idField:"id",
idPrefix:"TESTRP",
repository:"BaseRepository",
system:true
}



};








// ============================================================
// INIT
// ============================================================


EntityRegistry.init=function(){


if(this.initialized){

return true;

}



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
// RESOLVE v2.3.1
// ============================================================


EntityRegistry.resolve=function(value){



if(!value){

throw new Error(
"Entity empty"
);

}



let key =
String(value).trim();




// alias

if(this.aliases[key]){

return this.aliases[key];

}





// direct

if(this.has(key)){

return key;

}





// uppercase

key =
key.toUpperCase();



if(this.has(key)){

return key;

}







// prefix search
// CLI -> CLIENT


const prefix =
this.list()
.find(entity=>{


const meta=this[entity];


return meta.idPrefix &&
meta.idPrefix.toUpperCase()===key;


});



if(prefix){

return prefix;

}







// table search


const table =
this.list()
.find(entity=>{


const meta=this[entity];


return meta.table &&
meta.table.toUpperCase()
===
String(value).toUpperCase();


});



if(table){

return table;

}







// repository search


const repo =
this.list()
.find(entity=>{


const meta=this[entity];


return meta.repository &&
meta.repository.toUpperCase()
===
String(value).toUpperCase();


});



if(repo){

return repo;

}







// camelCase conversion


const normalized =
key.replace(
/([a-z])([A-Z])/g,
"$1_$2"
)
.toUpperCase();



if(this.has(normalized)){

return normalized;

}







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







// ============================================================
// HAS
// ============================================================


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
.filter(key=>{


const item=this[key];


return item
&&
typeof item==="object"
&&
item.entity
&&
item.table;


});


};








// ============================================================
// SEARCH
// ============================================================


EntityRegistry.getByTable=function(table){


const entity =
this.list()
.find(e=>

this[e].table===table

);


return entity || null;

};





EntityRegistry.getByRepository=function(repo){


const entity =
this.list()
.find(e=>

this[e].repository===repo

);


return entity || null;

};






EntityRegistry.getByPrefix=function(prefix){


const entity =
this.list()
.find(e=>


this[e].idPrefix===prefix


);


return entity || null;

};







EntityRegistry.getRepository=function(entity){


return this.get(entity).repository;

};





EntityRegistry.getTable=function(entity){


return this.get(entity).table;

};








// ============================================================
// VALIDATION
// ============================================================


EntityRegistry.validate=function(){


const errors=[];



this.list()
.forEach(entity=>{


const meta=this[entity];



if(!meta.idField){

errors.push(
entity+" missing idField"
);

}



if(!meta.table){

errors.push(
entity+" missing table"
);

}



if(!meta.repository){

errors.push(
entity+" missing repository"
);

}



});



return errors;

};








// ============================================================
// HEALTH
// ============================================================


EntityRegistry.health=function(){


const errors =
this.validate();



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
"EntityRegistry READY v"+
EntityRegistry.version
);