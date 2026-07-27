// ============================================================
// EntityRegistry v2.5.1
// Enterprise Runtime Entity Registry
// TaxControl ERP Core
//
// Fix:
// - Metadata normalization
// - Object fields support
// - Array fields support
// - SchemaBuilder compatibility
//
// Architecture:
//
// EntityMetadata
//        |
//        v
// EntityRegistry
//        |
//        v
// SchemaRegistry
//        |
//        v
// SchemaManager
//
// Compatible:
// EntityMetadata v3.1+
// SchemaRegistry v4.0.6+
// SchemaManager v4.2+
// BaseRepository v5.7+
// EntityService v5+
// ============================================================


console.log("EntityRegistry v2.5.1");



const EntityRegistry = {


version:"2.5.1",


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


if(this.initialized){

return true;

}



if(
typeof EntityMetadata==="undefined"
){

throw new Error(
"EntityRegistry requires EntityMetadata"
);

}



Logger.log(
"EntityRegistry INIT v"+
this.version
);



this.loadFromMetadata();



this.createCompatibilityObjects();



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
// LOAD FROM METADATA
// ============================================================


loadFromMetadata(){


this.entities={};



const list =
EntityMetadata.list();



list.forEach(name=>{


const meta =
EntityMetadata.get(name);



if(!meta){

return;

}



const key =
String(
meta.entity || name
)
.toUpperCase();



this.entities[key] = {


entity:key,


module:
meta.module || "CORE",


table:
meta.table || null,


idField:
meta.idField ||
meta.primaryKey ||
"ID",


idPrefix:
meta.idPrefix || null,


repository:
meta.repository || null,


fields:
this.normalizeFields(
meta.fields
),



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



});


},







// ============================================================
// NORMALIZE FIELDS
// ============================================================


normalizeFields(fields){


if(!fields){

return [];

}





// array format

if(Array.isArray(fields)){


return fields.map(f=>{


if(typeof f==="string"){


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






// object format

if(
typeof fields==="object"
){


return Object.keys(fields)

.map(name=>{


const f =
fields[name] || {};



return {


name:name,


type:
f.type || "STRING",


required:
f.required===true,


default:
f.default


};


});


}






return [];

},







// ============================================================
// COMPATIBILITY
// ============================================================


createCompatibilityObjects(){


Object.keys(this.entities)

.forEach(key=>{


if(this[key]){

return;

}



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
// NORMALIZE ENTITY NAME
// ============================================================


normalize(value){


return String(value)

.trim()

.replace(/-/g,"")

.toUpperCase();


},







// ============================================================
// RESOLVE
// ============================================================


resolve(value){


if(!value){

throw new Error(
"Entity empty"
);

}



const original =
String(value).trim();



const normalized =
this.normalize(original);





if(this.aliases[original]){

return this.aliases[original];

}



if(this.aliases[normalized]){

return this.aliases[normalized];

}




if(this.entities[normalized]){

return normalized;

}





for(const key of this.list()){


const meta =
this.entities[key];



if(
meta.idPrefix &&
normalized.startsWith(meta.idPrefix)
){

return key;

}


}







for(const key of this.list()){


const meta =
this.entities[key];



if(
meta.table &&
meta.table.toUpperCase()===normalized
){

return key;

}


}






for(const key of this.list()){


const meta =
this.entities[key];



if(
meta.repository &&
meta.repository.toUpperCase()===normalized
){

return key;

}


}






const camel =
original
.replace(
/([a-z])([A-Z])/g,
"$1_$2"
)
.toUpperCase();



if(this.entities[camel]){

return camel;

}





throw new Error(
"Unknown entity "+
value
);


},







// ============================================================
// GET
// ============================================================


get(entity){


return this.entities[
this.resolve(entity)
];

},







has(entity){


return !!this.entities[entity];

},







list(){


return Object.keys(
this.entities
);

},







// ============================================================
// HELPERS
// ============================================================


getRepository(entity){

return this.get(entity)?.repository;

},


getTable(entity){

return this.get(entity)?.table;

},


getIdField(entity){

return this.get(entity)?.idField;

},


getPrefix(entity){

return this.get(entity)?.idPrefix;

},


getFields(entity){

return this.get(entity)?.fields || [];

},







// ============================================================
// VALIDATE
// ============================================================


validate(){


const errors=[];

const tables={};

const repositories={};



this.list()

.forEach(key=>{


const meta =
this.entities[key];



if(!meta.table){

errors.push(
key+" table missing"
);

}



if(!meta.idField){

errors.push(
key+" idField missing"
);

}



if(
!meta.fields ||
!meta.fields.length
){

errors.push(
key+" fields empty"
);

}




if(
tables[meta.table]
){

errors.push(
"Duplicate table "+meta.table
);

}



tables[meta.table]=key;



if(
meta.repository &&
repositories[meta.repository]
){

errors.push(
"Duplicate repository "+meta.repository
);

}



repositories[meta.repository]=key;


});



return errors;


},







// ============================================================
// HEALTH
// ============================================================


health(){


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


count:this.list().length,


entities:this.list(),


errors


}

);


},







diagnostics(){


return {


module:"EntityRegistry",


version:this.version,


initialized:this.initialized,


entities:this.list(),


count:this.list().length


};


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