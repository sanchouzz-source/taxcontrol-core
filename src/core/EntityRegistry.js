// ============================================================
// EntityRegistry v2.5.0
// Enterprise Runtime Entity Registry
// TaxControl ERP Core
//
// Architecture:
//
// EntityMetadata
//        |
//        v
// EntityRegistry
//        |
//        v
// RepositoryFactory
//
// Compatible:
// EntityMetadata v3.1+
// SchemaRegistry v4.0.6+
// SchemaManager v4.2+
// BaseRepository v5.7+
// EntityService v5+
// ============================================================


console.log("EntityRegistry v2.5.0");



const EntityRegistry = {


version:"2.5.0",


initialized:false,


ready:false,


entities:{},


aliases:{



// names

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



// prefixes

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
// LOAD
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
String(name)
.toUpperCase();



this.entities[key]=meta;



});



},







// ============================================================
// OLD COMPATIBILITY
// EntityRegistry.CLIENT
// ============================================================


createCompatibilityObjects(){



Object.keys(this.entities)

.forEach(key=>{


if(
this[key]
){

return;

}



Object.defineProperty(

this,

key,

{


get(){

return EntityRegistry.entities[key];

},


configurable:true

}


);



});


},







// ============================================================
// NORMALIZE
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





// alias

if(this.aliases[original]){

return this.aliases[original];

}



if(this.aliases[normalized]){

return this.aliases[normalized];

}






// direct

if(this.entities[normalized]){

return normalized;

}






// prefix

for(
const key of this.list()
){


const meta =
this.entities[key];



if(
meta.idPrefix &&
normalized.startsWith(
meta.idPrefix
)
){

return key;

}


}






// table

for(
const key of this.list()
){


if(

this.entities[key].table
.toUpperCase()
===
normalized

){

return key;

}


}






// repository

for(
const key of this.list()
){


if(

this.entities[key].repository
&&
this.entities[key].repository
.toUpperCase()
===
normalized

){

return key;

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







// ============================================================
// HAS
// ============================================================


has(entity){


return !!this.entities[entity];


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
// HELPERS
// ============================================================


getRepository(entity){


return this.get(entity)
.repository;


},





getTable(entity){


return this.get(entity)
.table;


},





getIdField(entity){


return this.get(entity)
.idField;


},





getPrefix(entity){


return this.get(entity)
.idPrefix;


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
key+
" table missing"
);

}



if(!meta.idField){

errors.push(
key+
" idField missing"
);

}



if(
meta.table
&&
tables[meta.table]
){

errors.push(
"Duplicate table "+
meta.table
);

}



tables[meta.table]=key;




if(
meta.repository
&&
repositories[meta.repository]
){

errors.push(
"Duplicate repository "+
meta.repository
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







// ============================================================
// RESET
// ============================================================


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