// ============================================================
// EntityMetadata v3.1.0
// Enterprise Entity Contract Registry
// TaxControl ERP Core
//
// Sprint 1.2 Metadata Refactor
//
// Single Source Of Truth
//
// Compatible:
// EntityRegistry v2.4+
// SchemaRegistry v4+
// SchemaManager v4.2+
// EntityValidator v1.1+
// EntityService v5.2+
// BaseRepository v5.7+
// ============================================================


console.log("EntityMetadata v3.1.0");



const EntityMetadata = {


version:"3.1.0",

apiVersion:"3.1",


architecture:

"EntityMetadata -> SchemaRegistry -> EntityRegistry -> Repository",



initialized:false,


strictMode:true,



// ============================================================
// SINGLE SOURCE OF TRUTH
// ============================================================


entities:{},



// ============================================================
// REGISTER
// ============================================================


register(entity,meta){


if(!entity){

throw new Error(
"Entity name required"
);

}



if(!meta){

throw new Error(
"Metadata required "+entity
);

}



if(
this.strictMode &&
this.entities[entity]
){

throw new Error(
"Duplicate metadata "+entity
);

}



meta.entity =
entity;



this.entities[entity]=meta;



return meta;


},







// ============================================================
// GET
// ============================================================


get(entity){


if(!entity){

return null;

}



let key =
String(entity)
.toUpperCase();




// direct

if(
this.entities[key]
){

return this.entities[key];

}



// alias through EntityRegistry

if(
typeof EntityRegistry!=="undefined"
&&
EntityRegistry.resolve
){


try{


key =
EntityRegistry.resolve(entity);


return this.entities[key] || null;


}
catch(e){}



}



return null;


},







// ============================================================
// LIST
// ============================================================


list(){


return Object.keys(
this.entities
);


},







// ============================================================
// FIELD API
// ============================================================


getFields(entity){


const meta =
this.get(entity);



if(!meta){

throw new Error(
"Metadata missing "+entity
);

}



return meta.fields || {};

},





getFieldArray(entity){


const fields =
this.getFields(entity);



return Object.keys(fields)

.map(name=>{


return {

name,

...fields[name]

};


});


},







hasField(entity,field){


return !!(
this.getFields(entity)[field]
);


},







// ============================================================
// VALIDATION
// ============================================================


validate(){


const errors=[];



this.list()

.forEach(entity=>{


const meta =
this.entities[entity];



if(!meta.table){

errors.push(
entity+" missing table"
);

}



if(!meta.idField){

errors.push(
entity+" missing idField"
);

}



if(!meta.fields){

errors.push(
entity+" missing fields"
);

}



});



return errors;


},







// ============================================================
// HEALTH
// ============================================================


health(){


const errors =
this.validate();



return HealthContract.create(

"EntityMetadata",

errors.length
?
"WARNING"
:
"OK",

{


version:this.version,


entities:this.list(),


count:this.list().length,


errors


}

);


},







// ============================================================
// INIT
// ============================================================


init(){


if(this.initialized){

return true;

}



this.initialized=true;



Logger.log(

"EntityMetadata READY v"+
this.version+
" definitions="+
this.list().length

);



return true;


}



};






globalThis.EntityMetadata =
EntityMetadata;
// ============================================================
// EntityMetadata v3.1.0
// PART 2/3
// CORE BUSINESS ENTITIES
// ============================================================



// ============================================================
// ORGANIZATION
// ============================================================


EntityMetadata.register(

"ORGANIZATION",

{


module:"CORE",


table:"Organizations",


repository:"OrganizationRepository",


idField:"OrganizationID",


idPrefix:"ORG",


softDelete:true,


timestamps:true,


audit:true,



fields:{



OrganizationID:{


type:"ID",


generated:true


},



Name:{


type:"STRING",


required:true


},



INN:{


type:"STRING"


},



KPP:{


type:"STRING"


},



LegalName:{


type:"STRING"


},



Address:{


type:"STRING"


},



Phone:{


type:"STRING"


},



Email:{


type:"STRING"


},



CreatedAt:{


type:"DATE"


},



UpdatedAt:{


type:"DATE"


},



Deleted:{


type:"BOOLEAN"


}



}


}

);









// ============================================================
// USER
// ============================================================


EntityMetadata.register(

"USER",

{


module:"SYSTEM",


table:"Users",


repository:"UserRepository",


idField:"UserID",


idPrefix:"USR",


softDelete:true,


timestamps:true,


audit:true,



fields:{



UserID:{


type:"ID",


generated:true


},



OrganizationID:{


type:"REFERENCE",


reference:"ORGANIZATION",


required:true


},



Login:{


type:"STRING",


required:true


},



Name:{


type:"STRING"


},



Email:{


type:"STRING"


},



Role:{


type:"STRING",


required:true


},



Active:{


type:"BOOLEAN",


default:true


},



CreatedAt:{


type:"DATE"


},



UpdatedAt:{


type:"DATE"


},



Deleted:{


type:"BOOLEAN"


}



}


}

);









// ============================================================
// CLIENT
// ============================================================


EntityMetadata.register(

"CLIENT",

{


module:"CORE",


table:"Clients",


repository:"ClientRepository",


idField:"ClientID",


idPrefix:"CLI",


softDelete:true,


timestamps:true,


audit:true,



events:{


created:"CLIENT_CREATED",


updated:"CLIENT_UPDATED",


deleted:"CLIENT_DELETED"


},




fields:{



ClientID:{


type:"ID",


generated:true


},



OrganizationID:{


type:"REFERENCE",


reference:"ORGANIZATION"


},



Name:{


type:"STRING",


required:true


},



INN:{


type:"STRING"


},



Phone:{


type:"STRING"


},



Email:{


type:"STRING"


},



Address:{


type:"STRING"


},



ManagerID:{


type:"REFERENCE",


reference:"USER"


},



Rating:{


type:"NUMBER",


default:0


},



Status:{


type:"STRING",


default:"ACTIVE"


},



CreatedAt:{


type:"DATE"


},



UpdatedAt:{


type:"DATE"


},



Deleted:{


type:"BOOLEAN"


}



}


}

);









// ============================================================
// TRIP
// ============================================================


EntityMetadata.register(

"TRIP",

{


module:"TRANSPORT",


table:"Trips",


repository:"TripRepository",


idField:"TripID",


idPrefix:"TRP",


softDelete:true,


timestamps:true,


audit:true,



events:{


created:"TRIP_CREATED",


updated:"TRIP_UPDATED",


deleted:"TRIP_DELETED"


},




fields:{



TripID:{


type:"ID",


generated:true


},



OrganizationID:{


type:"REFERENCE",


reference:"ORGANIZATION"


},



ClientID:{


type:"REFERENCE",


reference:"CLIENT",


required:true


},



ManagerID:{


type:"REFERENCE",


reference:"USER"


},



VehicleID:{


type:"REFERENCE",


reference:"VEHICLE"


},



DriverID:{


type:"REFERENCE",


reference:"DRIVER"


},



CarrierID:{


type:"REFERENCE",


reference:"CARRIER"


},



RouteID:{


type:"REFERENCE",


reference:"ROUTE"


},



CargoID:{


type:"REFERENCE",


reference:"CARGO"


},



OrderNumber:{


type:"STRING"


},



Status:{


type:"STRING",


default:"NEW"


},



Revenue:{


type:"MONEY",


default:0


},



Cost:{


type:"MONEY",


default:0


},



Margin:{


type:"MONEY",


default:0


},



DepartureDate:{


type:"DATE"


},



ArrivalDate:{


type:"DATE"


},



Expedition:{


type:"BOOLEAN",


default:false


},



CreatedAt:{


type:"DATE"


},



UpdatedAt:{


type:"DATE"


},



Deleted:{


type:"BOOLEAN"


}



}


}

);


EntityMetadata.register(

"TRANSPORT_ORDER",

{

module:"LOGISTICS",

table:"TransportOrders",

repository:"TransportOrderRepository",

idField:"TransportOrderID",

idPrefix:"TOR",

softDelete:true,

timestamps:true,

audit:true,


fields:[

{
name:"TransportOrderID",
type:"STRING",
required:true
},

{
name:"ClientID",
type:"STRING",
required:true
},

{
name:"TripID",
type:"STRING"
},

{
name:"CarrierID",
type:"STRING"
},

{
name:"VehicleID",
type:"STRING"
},

{
name:"Status",
type:"STRING"
},

{
name:"CreatedAt",
type:"DATE"
},

{
name:"UpdatedAt",
type:"DATE"
}

],


events:{

created:
"TRANSPORT_ORDER_CREATED",

updated:
"TRANSPORT_ORDER_UPDATED",

deleted:
"TRANSPORT_ORDER_DELETED"

}

}

);




// ============================================================
// EntityMetadata v3.1.0
// PART 3/3
// LOGISTICS + FINANCE + SYSTEM
// ============================================================



// ============================================================
// VEHICLE
// ============================================================


EntityMetadata.register(

"VEHICLE",

{

module:"TRANSPORT",

table:"Vehicles",

repository:"VehicleRepository",

idField:"VehicleID",

idPrefix:"VEH",

softDelete:true,

timestamps:true,

audit:true,


fields:{


VehicleID:{
type:"ID",
generated:true
},


OrganizationID:{
type:"REFERENCE",
reference:"ORGANIZATION"
},


Number:{
type:"STRING",
required:true
},


Brand:{
type:"STRING"
},


Model:{
type:"STRING"
},


Year:{
type:"NUMBER"
},


VIN:{
type:"STRING"
},


FuelType:{
type:"STRING"
},


Capacity:{
type:"NUMBER"
},


Active:{
type:"BOOLEAN",
default:true
},


CreatedAt:{
type:"DATE"
},


UpdatedAt:{
type:"DATE"
},


Deleted:{
type:"BOOLEAN"
}


}

}

);








// ============================================================
// DRIVER
// ============================================================


EntityMetadata.register(

"DRIVER",

{

module:"TRANSPORT",

table:"Drivers",

repository:"DriverRepository",

idField:"DriverID",

idPrefix:"DRV",

softDelete:true,

timestamps:true,

audit:true,


fields:{


DriverID:{
type:"ID",
generated:true
},


OrganizationID:{
type:"REFERENCE",
reference:"ORGANIZATION"
},


Name:{
type:"STRING",
required:true
},


Phone:{
type:"STRING"
},


LicenseNumber:{
type:"STRING"
},


Category:{
type:"STRING"
},


CreatedAt:{
type:"DATE"
},


UpdatedAt:{
type:"DATE"
},


Deleted:{
type:"BOOLEAN"
}


}

}

);









// ============================================================
// CARRIER
// ============================================================


EntityMetadata.register(

"CARRIER",

{

module:"TRANSPORT",

table:"Carriers",

repository:"CarrierRepository",

idField:"CarrierID",

idPrefix:"CAR",

softDelete:true,

timestamps:true,

audit:true,


fields:{


CarrierID:{
type:"ID",
generated:true
},


OrganizationID:{
type:"REFERENCE",
reference:"ORGANIZATION"
},


Name:{
type:"STRING",
required:true
},


INN:{
type:"STRING"
},


Phone:{
type:"STRING"
},


Email:{
type:"STRING"
},


Rating:{
type:"NUMBER"
},


CreatedAt:{
type:"DATE"
},


UpdatedAt:{
type:"DATE"
},


Deleted:{
type:"BOOLEAN"
}


}

}

);









// ============================================================
// ROUTE
// ============================================================


EntityMetadata.register(

"ROUTE",

{

module:"TRANSPORT",

table:"Routes",

repository:"RouteRepository",

idField:"RouteID",

idPrefix:"RTE",

softDelete:true,

timestamps:true,


fields:{


RouteID:{
type:"ID",
generated:true
},


From:{
type:"STRING"
},


To:{
type:"STRING"
},


Distance:{
type:"NUMBER"
},


Duration:{
type:"NUMBER"
},


CreatedAt:{
type:"DATE"
},


UpdatedAt:{
type:"DATE"
},


Deleted:{
type:"BOOLEAN"
}


}

}

);









// ============================================================
// CARGO
// ============================================================


EntityMetadata.register(

"CARGO",

{

module:"TRANSPORT",

table:"Cargoes",

repository:"CargoRepository",

idField:"CargoID",

idPrefix:"CRG",

softDelete:true,

timestamps:true,


fields:{


CargoID:{
type:"ID",
generated:true
},


Name:{
type:"STRING"
},


Weight:{
type:"NUMBER"
},


Volume:{
type:"NUMBER"
},


Description:{
type:"STRING"
},


CreatedAt:{
type:"DATE"
},


UpdatedAt:{
type:"DATE"
},


Deleted:{
type:"BOOLEAN"
}


}

}

);









// ============================================================
// TRANSPORT ORDER
// ============================================================


EntityMetadata.register(

"TRANSPORT_ORDER",

{

module:"TRANSPORT",

table:"TransportOrders",

repository:"TransportOrderRepository",

idField:"TransportOrderID",

idPrefix:"TO",

softDelete:true,

timestamps:true,


fields:{


TransportOrderID:{
type:"ID",
generated:true
},


ClientID:{
type:"REFERENCE",
reference:"CLIENT",
required:true
},


TripID:{
type:"REFERENCE",
reference:"TRIP"
},


Status:{
type:"STRING"
},


Price:{
type:"MONEY"
},


CreatedAt:{
type:"DATE"
},


UpdatedAt:{
type:"DATE"
},


Deleted:{
type:"BOOLEAN"
}


}

}

);









// ============================================================
// CLIENT FINANCE PROFILE
// ============================================================


EntityMetadata.register(

"CLIENT_FINANCE_PROFILE",

{

module:"FINANCE",

table:"ClientFinanceProfiles",

repository:"ClientFinanceProfileRepository",

idField:"FinanceProfileID",

idPrefix:"CFP",

softDelete:true,

timestamps:true,

audit:true,


fields:{


FinanceProfileID:{
type:"ID",
generated:true
},


ClientID:{
type:"REFERENCE",
reference:"CLIENT",
required:true
},


CreditLimit:{
type:"MONEY",
default:0
},


Debt:{
type:"MONEY",
default:0
},


PaymentTermDays:{
type:"NUMBER"
},


Rating:{
type:"NUMBER"
},


CreatedAt:{
type:"DATE"
},


UpdatedAt:{
type:"DATE"
},


Deleted:{
type:"BOOLEAN"
}


}

}

);









// ============================================================
// FINANCIAL TRANSACTION
// ============================================================


EntityMetadata.register(

"FINANCIAL_TRANSACTION",

{

module:"FINANCE",

table:"FinancialTransactions",

repository:"FinancialTransactionRepository",

idField:"TransactionID",

idPrefix:"FIN",

softDelete:false,

timestamps:true,


fields:{


TransactionID:{
type:"ID",
generated:true
},


OrganizationID:{
type:"REFERENCE",
reference:"ORGANIZATION"
},


ClientID:{
type:"REFERENCE",
reference:"CLIENT"
},


TripID:{
type:"REFERENCE",
reference:"TRIP"
},


Type:{
type:"STRING",
required:true
},


Amount:{
type:"MONEY",
required:true
},


Currency:{
type:"STRING",
default:"RUB"
},


PaymentDate:{
type:"DATE"
},


Comment:{
type:"STRING"
},


CreatedAt:{
type:"DATE"
},


UpdatedAt:{
type:"DATE"
}


}

}

);









// ============================================================
// KPI
// ============================================================


EntityMetadata.register(

"KPI",

{

module:"ANALYTICS",

table:"KPIMetrics",

repository:"KPIRepository",

idField:"KPIID",

idPrefix:"KPI",

softDelete:true,

timestamps:true,


fields:{


KPIID:{
type:"ID",
generated:true
},


OrganizationID:{
type:"REFERENCE",
reference:"ORGANIZATION"
},


Name:{
type:"STRING",
required:true
},


Value:{
type:"NUMBER"
},


Period:{
type:"STRING"
},


CreatedAt:{
type:"DATE"
},


UpdatedAt:{
type:"DATE"
},


Deleted:{
type:"BOOLEAN"
}


}

}

);









// ============================================================
// AUDIT
// ============================================================


EntityMetadata.register(

"AUDIT",

{

module:"SYSTEM",

table:"AuditLog",

repository:"AuditRepository",

idField:"AuditID",

idPrefix:"AUD",

softDelete:false,

timestamps:true,


fields:{


AuditID:{
type:"ID",
generated:true
},


Action:{
type:"STRING",
required:true
},


Entity:{
type:"STRING"
},


EntityID:{
type:"STRING"
},


Before:{
type:"JSON"
},


After:{
type:"JSON"
},


CreatedAt:{
type:"DATE"
}


}

}

);









// ============================================================
// VERSION
// ============================================================


EntityMetadata.register(

"VERSION",

{

module:"SYSTEM",

table:"Versions",

repository:"VersionRepository",

idField:"VersionID",

idPrefix:"VER",

softDelete:false,

timestamps:true,


fields:{


VersionID:{
type:"ID",
generated:true
},


Entity:{
type:"STRING"
},


EntityID:{
type:"STRING"
},


VersionNumber:{
type:"NUMBER"
},


Snapshot:{
type:"JSON"
},


CreatedAt:{
type:"DATE"
}


}

}

);









// ============================================================
// TEST ENTITIES
// ============================================================


EntityMetadata.register(

"__TEST_DATABASE",

{

module:"SYSTEM",

system:true,

table:"__TEST_DATABASE",

repository:"BaseRepository",

idField:"id",

fields:{


id:{
type:"ID",
generated:true
}


}

}

);





EntityMetadata.register(

"__TEST_EVENTS",

{

module:"SYSTEM",

system:true,

table:"__TEST_EVENTS",

repository:"BaseRepository",

idField:"id",

fields:{


id:{
type:"ID",
generated:true
}


}

}

);





EntityMetadata.register(

"__TEST_REPOSITORY",

{

module:"SYSTEM",

system:true,

table:"__TEST_REPOSITORY",

repository:"BaseRepository",

idField:"id",

fields:{


id:{
type:"ID",
generated:true
}


}

}

);









// ============================================================
// COMPATIBILITY LAYER
// старые обращения:
// EntityMetadata.CLIENT
// EntityMetadata.TRIP
// ============================================================


EntityMetadata.list()
.forEach(entity=>{


if(!EntityMetadata[entity]){


Object.defineProperty(

EntityMetadata,

entity,

{


get(){

return EntityMetadata.entities[entity];

},


configurable:true

}


);


}


});







EntityMetadata.init();



Logger.log(
"EntityMetadata v3.1.0 REGISTERED ENTITIES="+
EntityMetadata.list().length
);