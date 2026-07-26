console.log("EntityMetadata v1.0.0");


const EntityMetadata = {

version:"1.0.0",


initialized:false,


// ============================================================
// CORE ENTITIES
// ============================================================


CLIENT:{

entity:"CLIENT",

table:"Clients",

idField:"ClientID",

idPrefix:"CLI",

version:1,

softDelete:true,

timestamps:true,


fields:[

{name:"ClientID",type:"ID",required:true},

{name:"OrganizationID",type:"REFERENCE",required:true},

{name:"Name",type:"STRING",required:true},

{name:"INN",type:"STRING",unique:true},

{name:"Phone",type:"STRING"},

{name:"Email",type:"STRING"},

{name:"Address",type:"STRING"},

{name:"Status",type:"ENUM",default:"ACTIVE"},

{name:"CreatedAt",type:"DATETIME"},

{name:"UpdatedAt",type:"DATETIME"},

{name:"Deleted",type:"BOOLEAN"}

],


relations:{

OrganizationID:{
entity:"ORGANIZATION",
type:"MANY_TO_ONE"
}

}

},



// ============================================================
// TRIP
// ============================================================


TRIP:{


entity:"TRIP",

table:"Trips",

idField:"TripID",

idPrefix:"TRP",

version:1,


softDelete:true,

timestamps:true,


fields:[


{
name:"TripID",
type:"ID",
required:true
},


{
name:"OrganizationID",
type:"REFERENCE",
required:true
},


{
name:"ClientID",
type:"REFERENCE"
},


{
name:"VehicleID",
type:"REFERENCE"
},


{
name:"DriverID",
type:"REFERENCE"
},


{
name:"RouteID",
type:"REFERENCE"
},


{
name:"LoadingPoint",
type:"STRING"
},


{
name:"UnloadingPoint",
type:"STRING"
},


{
name:"Distance",
type:"NUMBER"
},


{
name:"Cargo",
type:"STRING"
},


{
name:"Revenue",
type:"NUMBER"
},


{
name:"PlannedCost",
type:"NUMBER"
},


{
name:"ActualCost",
type:"NUMBER"
},


{
name:"Status",
type:"ENUM",
default:"NEW"
},


{
name:"CreatedAt",
type:"DATETIME"
},


{
name:"UpdatedAt",
type:"DATETIME"
},


{
name:"Deleted",
type:"BOOLEAN"
}


],


relations:{

ClientID:{
entity:"CLIENT",
type:"MANY_TO_ONE"
},


VehicleID:{
entity:"VEHICLE",
type:"MANY_TO_ONE"
},


DriverID:{
entity:"DRIVER",
type:"MANY_TO_ONE"
}


}


},



// ============================================================
// SYSTEM ENTITIES
// ============================================================


ORGANIZATION:{


entity:"ORGANIZATION",

table:"Organizations",

idField:"OrganizationID",

idPrefix:"ORG",

version:1,


softDelete:true,

timestamps:true,


fields:[

{
name:"OrganizationID",
type:"ID",
required:true
},

{
name:"Name",
type:"STRING",
required:true
},

{
name:"INN",
type:"STRING"
},


{
name:"Status",
type:"ENUM"
},


{
name:"CreatedAt",
type:"DATETIME"
},


{
name:"UpdatedAt",
type:"DATETIME"
},


{
name:"Deleted",
type:"BOOLEAN"
}


],


relations:{}


},




USER:{


entity:"USER",

table:"Users",

idField:"UserID",

idPrefix:"USR",

version:1,


softDelete:true,

timestamps:true,


fields:[

{
name:"UserID",
type:"ID",
required:true
},

{
name:"OrganizationID",
type:"REFERENCE"
},

{
name:"Name",
type:"STRING"
},

{
name:"Email",
type:"STRING"
},


{
name:"RoleID",
type:"REFERENCE"
},


{
name:"Status",
type:"ENUM"
},


{
name:"CreatedAt",
type:"DATETIME"
},

{
name:"UpdatedAt",
type:"DATETIME"
},

{
name:"Deleted",
type:"BOOLEAN"
}


]


}



// ============================================================
// METHODS
// ============================================================



};



//
// GET
//

EntityMetadata.get=function(entity){

return this[entity] || null;

};




// HAS

EntityMetadata.has=function(entity){

return !!this[entity];

};




// ============================================================
// AUTO SYNC FROM ENTITY REGISTRY
// ============================================================


EntityMetadata.syncFromRegistry=function(){


if(typeof EntityRegistry==="undefined"){

return;

}



EntityRegistry.list().forEach(entity=>{


if(this[entity]){

return;

}



const meta =
EntityRegistry.get(entity);



if(!meta){

return;

}



Logger.warn(
"EntityMetadata AUTO CREATE "+entity
);



this.register({

entity:entity,


table:
meta.table || entity+"s",


idField:
meta.idField || entity+"ID",


idPrefix:
meta.idPrefix || entity.substring(0,3),


module:
meta.module || "core",



fields:[


{
name:
meta.idField || entity+"ID",

type:"ID",

required:true

},


{
name:"CreatedAt",

type:"DATETIME"

},


{
name:"UpdatedAt",

type:"DATETIME"

},


{
name:"Deleted",

type:"BOOLEAN"

}


],


relations:{}



});



});



};




// ============================================================
// LIST
// ============================================================


EntityMetadata.list=function(){


this.syncFromRegistry();



return Object.values(this)
.filter(item=>

item &&

typeof item==="object" &&

item.entity &&

item.table &&

Array.isArray(item.fields)

);


};




// ============================================================
// FIND TABLE
// ============================================================


EntityMetadata.getByTable=function(table){


return this.list()
.find(x=>x.table===table)
||null;


};




// ============================================================
// VALIDATE
// ============================================================


EntityMetadata.validate=function(){


const errors=[];



this.list().forEach(meta=>{


if(!meta.fields.length){

errors.push(
meta.entity+" has no fields"
);

}



if(!meta.idField){

errors.push(
meta.entity+" missing idField"
);

}



});



return errors;

};




// ============================================================
// HEALTH
// ============================================================


EntityMetadata.health=function(){


const errors=this.validate();



return HealthContract.create(

"EntityMetadata",

errors.length===0
?
"OK"
:
"WARNING",

{

version:this.version,

entities:this.list()
.map(e=>e.entity),

errors:errors

}

);


};




// ============================================================
// REGISTER
// ============================================================


EntityMetadata.register=function(definition){


if(!definition.entity){

throw new Error(
"EntityMetadata.register entity required"
);

}



const entity=definition.entity;



if(this[entity]){

Logger.warn(
"EntityMetadata overwrite "+entity
);

}



if(!definition.table){

definition.table=entity+"s";

}



if(!definition.idField){

definition.idField=entity+"ID";

}



if(!definition.fields){

definition.fields=[];

}



if(!definition.relations){

definition.relations={};

}



this[entity]=definition;



Logger.log(
"EntityMetadata REGISTERED "+entity
);



return definition;


};




// ============================================================
// EXPORT
// ============================================================


globalThis.EntityMetadata=EntityMetadata;


Logger.log(
"EntityMetadata READY v"+EntityMetadata.version
);