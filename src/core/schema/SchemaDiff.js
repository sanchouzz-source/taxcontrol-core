// ============================================================
// SchemaDiff.gs v2.1.0
// ERP TexControl Core
//
// CLEAN SCHEMA MERGE
//
// EntityMetadata v3.x
// SchemaManager v4.2+
// ============================================================


console.log("SchemaDiff v2.1.0");



const SchemaDiff={



version:"2.1.0",




// ============================================================
// MERGE
// ============================================================


merge(
oldSchema={},
newSchema={},
strategy="SAFE"
){


const result={};



Object.keys(newSchema)

.forEach(entity=>{


const incoming =
newSchema[entity];



if(!incoming){

return;

}




// глубокая копия новой схемы

const clean =
JSON.parse(
JSON.stringify(incoming)
);





// нормализация fields

clean.fields =
Array.isArray(clean.fields)
?
clean.fields
:
[];





// добавляем uid

clean.uid =
clean.uid ||
entity;




result[entity]=clean;



});




return result;


},







// ============================================================
// COMPARE
// ============================================================


compare(
oldSchema={},
newSchema={}
){


const added=[];

const removed=[];

const changed=[];



const entities =
new Set([
...Object.keys(oldSchema),
...Object.keys(newSchema)
]);





entities.forEach(entity=>{


const oldMeta =
oldSchema[entity];


const newMeta =
newSchema[entity];



if(!oldMeta){

added.push(entity);

return;

}



if(!newMeta){

removed.push(entity);

return;

}





const oldFields =
(oldMeta.fields||[])
.map(x=>x.name);



const newFields =
(newMeta.fields||[])
.map(x=>x.name);




const addedFields =
newFields.filter(
x=>!oldFields.includes(x)
);



const removedFields =
oldFields.filter(
x=>!newFields.includes(x)
);




if(
addedFields.length ||
removedFields.length
){

changed.push({

entity,

addedFields,

removedFields

});

}



});




return {


added,

removed,

changed


};


},







// ============================================================
// CLEAN
// ============================================================


clean(schema={}){


const result={};



Object.keys(schema)

.forEach(entity=>{


const meta =
schema[entity];



if(
!meta ||
typeof meta!=="object"
){

return;

}



result[entity]={

entity,

table:
typeof meta.table==="string"
?
meta.table
:
entity,


idField:
meta.idField ||
meta.primaryKey ||
"ID",


fields:
Array.isArray(meta.fields)
?
meta.fields
:
[],


softDelete:
meta.softDelete!==false,


timestamps:
meta.timestamps!==false,


relations:
meta.relations || {},


indexes:
meta.indexes || []


};



});



return result;


}





};




globalThis.SchemaDiff =
SchemaDiff;



Logger.log(
"SchemaDiff READY v"+
SchemaDiff.version
);