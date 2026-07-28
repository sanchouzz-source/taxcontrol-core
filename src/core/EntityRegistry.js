// ============================================================
// EntityRegistry v2.6.0
// Enterprise Runtime Entity Registry
// TaxControl ERP Core
//
// Compatible:
// EntityMetadata v3.1+
// SchemaRegistry v4.0.6+
// SchemaManager v4.2+
// RepositoryFactory v3+
// BaseRepository v5.7+
// ============================================================


console.log("EntityRegistry v2.6.0");


const EntityRegistry = {


version:"2.6.0",

initialized:false,

ready:false,

entities:{},


aliases:{


CLIENT:"CLIENT",
Client:"CLIENT",
Clients:"CLIENT",

TRIP:"TRIP",
Trip:"TRIP",
Trips:"TRIP",

TRANSPORT_ORDER:"TRANSPORT_ORDER",
TransportOrder:"TRANSPORT_ORDER",
TransportOrders:"TRANSPORT_ORDER",
TOR:"TRANSPORT_ORDER",


VEHICLE:"VEHICLE",
Vehicle:"VEHICLE",
Vehicles:"VEHICLE",

DRIVER:"DRIVER",
Driver:"DRIVER",
Drivers:"DRIVER",

CARRIER:"CARRIER",
Carrier:"CARRIER",
Carriers:"CARRIER",

ROUTE:"ROUTE",
Route:"ROUTE",
Routes:"ROUTE",

CARGO:"CARGO",
Cargo:"CARGO",
Cargoes:"CARGO",


CLI:"CLIENT",
TRP:"TRIP",
TO:"TRANSPORT_ORDER",
TOR:"TRANSPORT_ORDER",

VEH:"VEHICLE",
DRV:"DRIVER",
CAR:"CARRIER",
RTE:"ROUTE",
CRG:"CARGO",

CFP:"CLIENT_FINANCE_PROFILE",

FIN:"FINANCIAL_TRANSACTION",

KPI:"KPI",

AUD:"AUDIT",

VER:"VERSION"


},



// ============================================================
// INIT
// ============================================================

init(){


if(this.initialized)
return true;


if(typeof EntityMetadata==="undefined")
{
throw new Error(
"EntityRegistry requires EntityMetadata"
);
}


Logger.log(
"EntityRegistry INIT v"+
this.version
);


this.sync();


this.initialized=true;
this.ready=true;


Logger.log(
"EntityRegistry READY v"+
this.version+
" entities="+
this.list().length
);


return true;

},



// ============================================================
// SYNC FROM METADATA
// ============================================================

sync(){


this.entities={};


const list =
EntityMetadata.list();



list.forEach(name=>{


const meta =
EntityMetadata.get(name);


if(!meta)
return;



const key =
String(
meta.entity || name
)
.toUpperCase();



this.entities[key]=this.normalizeMeta(
key,
meta
);



});



this.createCompatibilityObjects();



return this.entities;

},



// ============================================================
// NORMALIZE META
// ============================================================

normalizeMeta(entity,meta){


return {


entity,


module:
meta.module || "CORE",


table:
meta.table || null,


repository:
meta.repository || null,


idField:
meta.idField ||
meta.primaryKey ||
"ID",


idPrefix:
meta.idPrefix || null,


fields:
this.normalizeFields(meta.fields),


softDelete:
meta.softDelete!==false,


timestamps:
meta.timestamps!==false,


audit:
meta.audit===true,


relations:
meta.relations || {},


indexes:
meta.indexes || [],


events:
meta.events || {}

};


},



normalizeFields(fields){


if(!fields)
return [];



if(Array.isArray(fields)){


return fields.map(f=>{


if(typeof f==="string")
{

return {
name:f,
type:"STRING",
required:false
};

}


return {

name:f.name,

type:f.type || "STRING",

required:f.required===true,

default:f.default

};


});


}



return Object.keys(fields)
.map(name=>{


return {

name,

type:
fields[name].type || "STRING",

required:
fields[name].required===true

};


});


},



// ============================================================
// COMPATIBILITY
// ============================================================

createCompatibilityObjects(){


this.list()
.forEach(key=>{


if(this[key])
return;


Object.defineProperty(

this,

key,

{

get:()=>this.entities[key],

configurable:true

}

);


});


},



// ============================================================
// RESOLVE
// ============================================================

resolve(value){


if(!value)
throw new Error(
"Entity empty"
);



let original =
String(value).trim();



let normalized =
original
.replace(/-/g,"")
.toUpperCase();



if(this.aliases[original])
return this.aliases[original];



if(this.aliases[normalized])
return this.aliases[normalized];



if(this.entities[normalized])
return normalized;



for(const key of this.list())
{

const meta=this.entities[key];


if(
meta.idPrefix &&
normalized.startsWith(
meta.idPrefix
)
)
return key;


}



for(const key of this.list())
{


const meta=this.entities[key];


if(
meta.table &&
meta.table.toUpperCase()===normalized
)
return key;


}



for(const key of this.list())
{


const meta=this.entities[key];


if(
meta.repository &&
meta.repository.toUpperCase()===normalized
)
return key;


}



throw new Error(
"Unknown entity "+
value
);


},



get(entity){

return this.entities[
this.resolve(entity)
];

},



has(entity){

try{

return !!this.get(entity);

}
catch(e){

return false;

}

},



list(){

return Object.keys(
this.entities
);

},



getRepository(entity){

return this.get(entity)?.repository;

},



getTable(entity){

return this.get(entity)?.table;

},



getFields(entity){

return this.get(entity)?.fields || [];

},



validate(){


const errors=[];

const tables={};


this.list()
.forEach(key=>{


const m=this.entities[key];


if(!m.table)
errors.push(
key+" table missing"
);


if(!m.fields.length)
errors.push(
key+" fields empty"
);



if(tables[m.table])
errors.push(
"Duplicate table "+m.table
);


tables[m.table]=key;


});


return errors;

},



health(){

return HealthContract.create(

"EntityRegistry",

this.validate().length
?
"WARNING"
:
"OK",

{

version:this.version,

count:this.list().length,

entities:this.list(),

errors:this.validate()

}

);

},



reset(){

this.entities={};

this.initialized=false;

this.ready=false;

}

};



globalThis.EntityRegistry =
EntityRegistry;


Logger.log(
"EntityRegistry REGISTERED v"+
EntityRegistry.version
);