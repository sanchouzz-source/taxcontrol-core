// ============================================================
// SchemaBuilder v4.1.0
// ERP TexControl Core
//
// Metadata compiler
//
// Compatible:
// EntityMetadata v3.x
// SchemaManager v4.1.2
// SchemaRegistry v4.x
// EntityValidator v1.1
// ============================================================


console.log("SchemaBuilder v4.1.0");



const SchemaBuilder = {

version:"4.1.0",




// ============================================================
// BUILD
// ============================================================


build(){


const schema={};



let entities=[];



// ------------------------------------------------------------
// SOURCE PRIORITY
// ------------------------------------------------------------


if(
typeof EntityMetadata!=="undefined"
&&
EntityMetadata.list
){


entities =
EntityMetadata.list();



}
else
if(
typeof SchemaRegistry!=="undefined"
&&
SchemaRegistry.list
){


entities =
SchemaRegistry.list();


}





Logger.log(
"SchemaBuilder entities="+
entities.length
);







for(
const item of entities
){


let meta;



try{


meta =
typeof item==="string"

?

(
EntityMetadata.get
?
EntityMetadata.get(item)
:
SchemaRegistry.get(item)
)

:

item;



}
catch(e){


Logger.warn(
"Metadata load failed "+
item+
" "+
e.message
);


continue;


}





if(
!meta ||
!meta.table
){

continue;

}




const fields =
this.extractFields(meta);





if(!fields.length){


throw new Error(

"Entity "+
(
meta.entity ||
meta.name ||
meta.table
)
+
" has no fields"

);


}






schema[meta.table]={



table:
meta.table,



entity:
meta.entity,



module:
meta.module || null,



repository:
meta.repository || null,



primaryKey:

meta.primaryKey

||

meta.idField

||

null,



idPrefix:
meta.idPrefix || null,



fields,



softDelete:
meta.softDelete !== false,



timestamps:
meta.timestamps !== false,



audit:
meta.audit === true,



versioning:
meta.versioning === true,



relations:
meta.relations || {},



indexes:
meta.indexes || [],



permissions:
meta.permissions || {},



events:
meta.events || {},



uid:
meta.uid || meta.table



};



}



return schema;


},







// ============================================================
// FIELD EXTRACTION
// ============================================================


extractFields(meta){



if(!meta){

return [];

}




let raw =
meta.fields
||
meta.columns
||
[];





// ============================================================
// NEW FORMAT
// fields:{}
// ============================================================


if(
!Array.isArray(raw)
&&
typeof raw==="object"
){



raw =
Object.keys(raw)
.map(name=>{


return {


name:name,


...raw[name]


};


});


}







// ============================================================
// OLD FORMAT
// fields:[]
// ============================================================


return raw

.map(field=>{



if(
typeof field==="string"
){


return {


name:field,


type:"STRING",


required:false,


active:true



};


}






const name =

field.name

||

field.key

||

field.field

||

field.column;





if(!name){

return null;

}






return {



name,



type:
String(
field.type ||
"STRING"
).toUpperCase(),



required:
field.required===true,



default:
field.default,



unique:
field.unique===true,



format:
field.format || null,



maxLength:
field.maxLength || null,



generated:
field.generated===true,



onDelete:
field.onDelete || null,



precision:
field.precision || null,



scale:
field.scale || null,



values:
field.values || null,



index:
field.index===true,



relation:
field.relation || field.reference || null,



nullable:

field.nullable!==undefined

?

field.nullable

:

!field.required,



active:

field.active!==undefined

?

field.active

:

true



};



})

.filter(Boolean);



},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){


return {


module:
"SchemaBuilder",


version:
this.version,


timestamp:
new Date()
.toISOString()


};


},







health(){


return HealthContract.create(

"SchemaBuilder",

"OK",

{

version:this.version

}

);


}



};






globalThis.SchemaBuilder =
SchemaBuilder;



Logger.log(
"SchemaBuilder READY v"+
SchemaBuilder.version
);