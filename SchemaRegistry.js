// ============================================================
// SchemaRegistry v4.0.5
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


console.log("SchemaRegistry v4.0.5");



const SchemaRegistry = {


version:"4.0.5",


initialized:false,


schemas:{},



source:"EntityMetadata",




// ============================================================
// INIT
// ============================================================


init(){


if(this.initialized){

return true;

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
// LOAD FROM METADATA
// ============================================================


load(){


this.schemas={};



if(
typeof EntityMetadata==="undefined"
){

throw new Error(
"EntityMetadata unavailable"
);

}



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

"Schema skip invalid metadata: "+
JSON.stringify(entity)+
" "+e.message

);


}



});





// совместимость с EntityRegistry

if(
typeof EntityRegistry!=="undefined"
&&
EntityRegistry.list
){


EntityRegistry.list()
.forEach(entity=>{


if(
!this.schemas[entity]
){


const meta =
EntityRegistry.get(entity);



if(meta){


Logger.log(

"Schema synchronized from Registry: "+
entity

);


this.register(
entity,
this.normalize(meta)
);


}


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



if(!meta.table){

throw new Error(
"Table missing"
);

}



let fields=[];



// новый формат v3.1

if(
meta.fields &&
!Array.isArray(meta.fields)
){


fields =
Object.keys(meta.fields)

.map(name=>{


return {

name:name,

...meta.fields[name]

};


});


}


// старый формат

else if(
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





if(!fields.length){


throw new Error(
"Fields empty"
);

}





return {


entity:
meta.entity,


table:
meta.table,


repository:
meta.repository,


module:
meta.module || "core",


idField:
meta.idField || meta.primaryKey,


idPrefix:
meta.idPrefix,


fields:fields,


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
meta.events || {},


system:
meta.system===true


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



this.schemas[entity]=schema;



Logger.debug(

"SCHEMA REGISTERED "+
entity+
" -> "+
schema.table

);



return schema;


},







// ============================================================
// GET
// ============================================================


get(entity){



if(
!entity
){

return null;

}



let key =
String(entity).toUpperCase();



return (

this.schemas[key]

||

this.schemas[entity]

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
// TABLE
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







// ============================================================
// FIELDS
// ============================================================


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
f=>f.name===field
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
!schema.fields.length
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


errors:errors


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



SchemaRegistry.init();



Logger.log(

"SchemaRegistry REGISTERED v"+
SchemaRegistry.version

);