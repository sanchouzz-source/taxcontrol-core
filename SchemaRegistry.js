// ============================================================
// SchemaRegistry v4.1.0
// Enterprise Schema Registry
// TaxControl ERP Core
//
// Compatible:
// EntityMetadata v3.1+
// SchemaManager v4.2+
// EntityRegistry v2.4+
// Database v4.2+
//
// Architecture:
//
// EntityMetadata
//        |
//        v
// SchemaRegistry
//        |
//        v
// SchemaManager
//        |
//        v
// Database
// ============================================================


console.log("SchemaRegistry v4.1.0");



const SchemaRegistry = {


version:"4.1.0",


initialized:false,


schemas:{},


source:"EntityMetadata",



// ============================================================
// INIT
// ============================================================


init(){


if(this.initialized){

Logger.debug(
"SchemaRegistry ALREADY READY"
);

return true;

}



if(
typeof EntityMetadata==="undefined"
){

throw new Error(
"SchemaRegistry requires EntityMetadata"
);

}



Logger.log(
"SchemaRegistry INIT v"+
this.version
);



this.load();



this.initialized=true;



Logger.log(

"SchemaRegistry READY v"+
this.version+
" TABLES="+
this.list().length

);



return true;


},







// ============================================================
// LOAD
// ============================================================


load(){


this.schemas={};



const entities =
EntityMetadata.list();



Logger.log(

"SchemaRegistry loading "+
entities.length+
" metadata entries"

);




entities.forEach(entity=>{


try{


const meta =
EntityMetadata.get(entity);



if(!meta){

throw new Error(
"Metadata missing"
);

}



const schema =
this.normalize(meta);



this.register(
entity,
schema
);



}

catch(e){


Logger.warn(

"Schema skip invalid metadata "+
entity+
": "+
e.message

);


}


});




// ====================================================
// OPTIONAL SYNC FROM ENTITY REGISTRY
// ====================================================


if(
typeof EntityRegistry!=="undefined"
&&
EntityRegistry.list
){


EntityRegistry.list()

.forEach(entity=>{


if(
this.schemas[entity]
){

return;

}



const meta =
EntityRegistry.get(entity);



if(!meta){

return;

}



try{


this.register(

entity,

this.normalize(meta)

);


Logger.log(

"Schema synchronized from Registry: "+
entity

);



}
catch(e){


Logger.warn(

"Registry sync failed "+
entity+
" "+
e.message

);


}



});


}



return this.schemas;


},







// ============================================================
// NORMALIZE
// ============================================================


normalize(meta){



if(!meta){

throw new Error(
"Empty metadata"
);

}



const table =
typeof meta.table==="string"

?

meta.table

:

null;



if(!table){

throw new Error(
"Table missing"
);

}




let fields=[];



// ----------------------------
// Object fields
// ----------------------------


if(
meta.fields
&&
!Array.isArray(meta.fields)
){


fields =
Object.keys(meta.fields)

.map(name=>{


return {


name:name,


...(meta.fields[name]||{})


};


});


}



// ----------------------------
// Array fields
// ----------------------------


else
if(
Array.isArray(meta.fields)
){


fields =
meta.fields.map(f=>{


if(typeof f==="string"){


return {


name:f,


type:"STRING"


};


}



return {

...f

};


});


}





fields =
fields.filter(
f=>f.name
);





if(!fields.length){


throw new Error(
"Fields empty"
);

}






return {



entity:
meta.entity,


table,


module:
meta.module || "core",



repository:
meta.repository || null,



idField:

meta.idField
||
meta.primaryKey
||
"ID",



idPrefix:
meta.idPrefix || null,



fields,



softDelete:
meta.softDelete!==false,



timestamps:
meta.timestamps!==false,



audit:
meta.audit===true,



system:
meta.system===true,



organization:
meta.organization,



organizationScope:
meta.organizationScope,



permissions:
meta.permissions || {},



options:
meta.options || {},



relations:
meta.relations || {},



indexes:
meta.indexes || [],



events:
meta.events || {}



};


},







// ============================================================
// REGISTER
// ============================================================


register(entity,schema){



if(!entity){

throw new Error(
"Entity required"
);

}



const key =
String(entity)
.toUpperCase();



this.schemas[key]=schema;



Logger.debug(

"SCHEMA REGISTERED "+
key+
" -> "+
schema.table

);



return schema;


},







// ============================================================
// GET
// ============================================================


get(entity){


if(!entity){

return null;

}



const key =
String(entity)
.toUpperCase();



return (

this.schemas[key]

||

null

);


},







// ============================================================
// LIST
// ============================================================


list(){


return Object.keys(
this.schemas
);


},







// ============================================================
// HELPERS
// ============================================================


getTable(entity){


const schema =
this.get(entity);



return schema
?
schema.table
:
null;


},





getFields(entity){


const schema =
this.get(entity);



return schema
?
schema.fields
:
[];


},





hasField(entity,field){


return this.getFields(entity)

.some(
f=>
f.name===field
);


},







// ============================================================
// VALIDATE
// ============================================================


validate(){


const errors=[];



this.list()

.forEach(entity=>{


const schema =
this.schemas[entity];



if(!schema.table){

errors.push(
entity+" missing table"
);

}



if(
!schema.fields ||
schema.fields.length===0
){

errors.push(
entity+" empty fields"
);

}



});



return errors;


},







// ============================================================
// RESET
// ============================================================


reset(){


Logger.debug(
"SchemaRegistry RESET"
);



this.schemas={};


this.initialized=false;


},







// ============================================================
// HEALTH
// ============================================================


health(){


const errors =
this.validate();



return HealthContract.create(

"SchemaRegistry",

errors.length
?
"WARNING"
:
"OK",

{

version:this.version,


tables:this.list(),


count:this.list().length,


errors


}

);


},







diagnostics(){


return {


module:"SchemaRegistry",


version:this.version,


initialized:this.initialized,


source:this.source,


tables:this.list(),


count:this.list().length


};


}



};





globalThis.SchemaRegistry =
SchemaRegistry;



Logger.log(

"SchemaRegistry REGISTERED v"+
SchemaRegistry.version

);
