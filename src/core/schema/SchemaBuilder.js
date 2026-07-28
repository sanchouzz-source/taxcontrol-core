// ============================================================
// SchemaBuilder v4.1.2
// ERP TexControl Core
//
// Enterprise Metadata → Runtime Schema Builder
//
// Compatible:
// EntityMetadata v3.1+
// EntityRegistry v2.5+
// SchemaRegistry v4.0.6+
// SchemaManager v4.2+
// EntityValidator v1.1+
//
// Fix:
// - Preserve repository metadata
// - Preserve module metadata
// - Duplicate entity protection
// - Object fields normalization
// - Runtime schema compatibility
// ============================================================


console.log("SchemaBuilder v4.1.2");



const SchemaBuilder = {


version:"4.1.2",






// ============================================================
// BUILD
// ============================================================


build(){


const schema={};



let entities=[];





// ============================================================
// LOAD ENTITY METADATA
// ============================================================


if(
typeof EntityMetadata!=="undefined"
&&
EntityMetadata.list
){


entities =
EntityMetadata.list();


}




Logger.log(
"SchemaBuilder metadata count="+
entities.length
);






// ============================================================
// PROCESS
// ============================================================


entities.forEach(item=>{


let meta=null;



try{



// object metadata

if(
typeof item==="object"
){

meta =
JSON.parse(
JSON.stringify(item)
);

}




// entity name

else
if(
typeof item==="string"
){

meta =
EntityMetadata.get(item);

}



}
catch(e){


Logger.warn(

"SchemaBuilder metadata error "+
e.message

);


return;


}







if(!meta){

return;

}







// ============================================================
// ENTITY NAME
// ============================================================


const entityName =

String(
meta.entity || ""
)

.trim()

.toUpperCase();






if(!entityName){


Logger.warn(
"SchemaBuilder skip entity without name"
);


return;


}






// ============================================================
// DUPLICATE PROTECTION
// ============================================================


if(
schema[entityName]
){


Logger.warn(

"SchemaBuilder duplicate entity skipped "+
entityName

);


return;


}








// ============================================================
// TABLE CHECK
// ============================================================


if(
typeof meta.table!=="string"
||
!meta.table
){


Logger.warn(

"SchemaBuilder invalid table for "+
entityName

);


return;


}









// ============================================================
// FIELDS
// ============================================================


const fields =

this.normalizeFields(

meta.fields ||
meta.columns ||
[]

);






if(!fields.length){


Logger.warn(

"SchemaBuilder entity without fields "+
entityName

);


return;


}









// ============================================================
// CREATE SCHEMA
// ============================================================


schema[entityName]={



entity:
entityName,



module:
meta.module ||
"CORE",




table:
meta.table,





repository:
meta.repository ||
null,





idField:

meta.idField
||
meta.primaryKey
||
"ID",




idPrefix:

meta.idPrefix ||
null,






fields,







softDelete:

meta.softDelete !== false,






timestamps:

meta.timestamps !== false,






audit:

meta.audit === true,






organization:

meta.organization !== false,






tenant:

meta.tenant !== false,







relations:

meta.relations ||
{},





indexes:

meta.indexes ||
[],





events:

meta.events ||
{},





permissions:

meta.permissions ||
{},





system:

meta.system === true





};








});






Logger.log(

"SchemaBuilder created tables="+
Object.keys(schema).length

);



return schema;



},







// ============================================================
// FIELD NORMALIZER
// ============================================================


normalizeFields(fields){



if(!fields){

return [];

}





let result=[];







// ============================================================
// OBJECT FORMAT
// ============================================================


if(
!Array.isArray(fields)
&&
typeof fields==="object"
){



Object.keys(fields)

.forEach(name=>{


const f =
fields[name] || {};



result.push(

this.normalizeField({

name,

...f

})

);



});



}







// ============================================================
// ARRAY FORMAT
// ============================================================


else
if(
Array.isArray(fields)
){



fields.forEach(f=>{


if(typeof f==="string"){


result.push(

this.normalizeField({

name:f

})

);


}

else{


result.push(

this.normalizeField(f)

);


}



});


}






return result.filter(
f=>f.name
);



},







// ============================================================
// SINGLE FIELD
// ============================================================


normalizeField(f){


return {



name:

f.name ||
f.key ||
f.field ||
null,




type:

f.type ||
"STRING",






required:

f.required === true,






nullable:

f.nullable !== false,






default:

f.default,






unique:

f.unique === true,






index:

f.index === true,






maxLength:

f.maxLength ||
null,






relation:

f.relation ||
null,






generated:

f.generated === true,






format:

f.format ||
null





};



}







};







globalThis.SchemaBuilder =
SchemaBuilder;





Logger.log(

"SchemaBuilder READY v"+
SchemaBuilder.version

);