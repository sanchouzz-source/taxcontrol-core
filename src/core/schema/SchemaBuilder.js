// ============================================================
// SchemaBuilder v4.1.1
// ERP TexControl Core
//
// Fix:
// EntityMetadata v3 object list support
// Prevent nested metadata corruption
// ============================================================


console.log("SchemaBuilder v4.1.1");


const SchemaBuilder={


version:"4.1.1",



build(){


const schema={};


let entities=[];


// ====================================================
// LOAD METADATA
// ====================================================


if(
typeof EntityMetadata!=="undefined"
&&
EntityMetadata.list
){


entities =
EntityMetadata.list();


}


Logger.log(
"SchemaBuilder entities="+entities.length
);



// ====================================================
// BUILD
// ====================================================


entities.forEach(item=>{


let meta=null;



try{


// Уже объект metadata

if(
typeof item==="object"
){

meta =
JSON.parse(
JSON.stringify(item)
);

}


// строка

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
"Metadata error "+
item+
" "+
e.message
);

return;

}




if(!meta){

return;

}



// защита от битого объекта

if(
typeof meta.table!=="string"
){

Logger.warn(
"Schema skip invalid metadata "+
JSON.stringify(meta.entity)
);

return;

}




const fields =
this.normalizeFields(meta.fields || meta.columns);




if(!fields.length){


Logger.warn(
"Schema entity without fields "+
meta.entity
);


return;


}





schema[meta.entity]={


entity:
meta.entity,


table:
meta.table,


idField:

meta.idField
||
meta.primaryKey
||
"ID",



fields,



softDelete:
meta.softDelete!==false,



timestamps:
meta.timestamps!==false,


audit:
meta.audit===true,


relations:
meta.relations||{},


indexes:
meta.indexes||[]


};




});



return schema;


},







normalizeFields(fields){


if(!fields){

return [];

}



let result=[];



// object format

if(
!Array.isArray(fields)
&&
typeof fields==="object"
){


Object.keys(fields)
.forEach(name=>{


const f =
fields[name]||{};



result.push({


name,


type:
f.type||
"STRING",


required:
f.required===true


});


});


}


// array format

else
if(Array.isArray(fields)){


result =
fields.map(f=>{


if(typeof f==="string"){

return {

name:f,

type:"STRING",

required:false

};

}



return {


name:
f.name,


type:
f.type||"STRING",


required:
f.required===true


};


});


}



return result.filter(
x=>x.name
);


}





};



globalThis.SchemaBuilder=
SchemaBuilder;



Logger.log(
"SchemaBuilder READY v"+
SchemaBuilder.version
);