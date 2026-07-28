// ============================================================
// SchemaManager.gs
// ERP TexControl Core
//
// Version:
// SchemaManager v4.2.1
//
// Compatible:
// EntityMetadata v3.1+
// SchemaBuilder v4.1+
// EntityValidator v1.1+
// SchemaRegistry v4.0.6+
// EntityRegistry v2.6+
//
// Fix:
// - Metadata v3 object support
// - Nested metadata protection
// - Object fields normalization
// - Primary key object support
// - SchemaBuilder compatibility
// - Safe cloning
// ============================================================


console.log("SchemaManager v4.2.1");



const SchemaManager = {


version:"4.2.1",


initialized:false,


schema:{},






// ============================================================
// INIT
// ============================================================


init(options={}){


if(this.initialized){


Logger.debug(
"SchemaManager ALREADY READY"
);


return this.schema;


}




return SchemaLock.withLock(()=>{


try{


Logger.log(
"SCHEMA INIT START v"+
this.version
);




// ====================================================
// BUILD
// ====================================================


const built =
SchemaBuilder.build();



Logger.log(

"SCHEMA BUILT TABLES="+
Object.keys(built||{}).length

);





// ====================================================
// NORMALIZE
// ====================================================


const normalized =
this.normalizeSchema(
built
);



Logger.log(

"SCHEMA NORMALIZED TABLES="+
Object.keys(normalized).length

);






// ====================================================
// VALIDATE
// ====================================================


try{


if(
typeof SchemaValidator!=="undefined"
&&
SchemaValidator.check
){


SchemaValidator.check(
normalized
);


}



}
catch(e){


Logger.warn(

"SchemaValidator WARNING "+
e.message

);


}







// ====================================================
// LOAD STORAGE
// ====================================================


let stored={};



try{


stored =
SchemaStorage.load()
||
{};


}
catch(e){


Logger.warn(

"SchemaStorage LOAD skipped "+
e.message

);


}







// ====================================================
// MERGE
// ====================================================


const merged =
SchemaDiff.merge(
stored,
normalized
);






// ====================================================
// FINAL VALIDATION
// ====================================================


this.validateEntities(
merged
);






// ====================================================
// SAVE
// ====================================================


SchemaStorage.save(
merged
);







// ====================================================
// VERSION CONTROL
// ====================================================


const hash =
this._computeHash(
merged
);



const oldHash =
SchemaStorage.getCurrentHash?.();





if(hash!==oldHash){


const version =
(
SchemaStorage.getVersion?.()
||
0
)+1;



SchemaStorage.saveVersion(
version,
hash,
"system"
);



if(
typeof SchemaSnapshot!=="undefined"
&&
SchemaSnapshot.save
){


SchemaSnapshot.save(
version,
hash,
merged
);


}



Logger.log(

"SCHEMA VERSION "+
version

);



}








// ====================================================
// CACHE
// ====================================================


this.schema =
JSON.parse(
JSON.stringify(
merged
)
);




this.initialized=true;





Logger.log(

"SchemaManager READY v"+
this.version+
" TABLES="+
this.getTables().length

);







if(
typeof SchemaEvents!=="undefined"
&&
SchemaEvents.emit
){


SchemaEvents.emit(

"SCHEMA_READY",

{

tables:
this.getTables().length,


version:
this.version


}

);


}




return this.schema;



}
catch(e){


Logger.error(

"SchemaManager FAILED: "+
e.message

);



throw e;


}



});


},







// ============================================================
// NORMALIZE SCHEMA
// ============================================================


normalizeSchema(schema){



const result={};



Object.keys(schema||{})

.forEach(key=>{



let meta =
schema[key];




if(!meta){

return;

}




// ====================================================
// SAFE CLONE
// ====================================================


meta =
JSON.parse(
JSON.stringify(meta)
);







// ====================================================
// ENTITY
// ====================================================


if(
typeof meta.entity==="object"
){


meta.entity =
key;


}



meta.entity =
meta.entity ||
key;








// ====================================================
// TABLE NORMALIZATION
// ====================================================


meta.table =
this.normalizeTable(
meta.table,
key
);







// ====================================================
// FIELDS
// ====================================================


let fields =
meta.fields ||
meta.columns ||
[];





// object fields

if(
!Array.isArray(fields)
&&
typeof fields==="object"
){


fields =
Object.keys(fields)

.map(name=>{


return {


name:name,


...(fields[name]||{})


};


});


}






// fallback metadata

if(
fields.length===0
&&
typeof EntityMetadata!=="undefined"
&&
EntityMetadata.get
){


try{


const source =
EntityMetadata.get(key);



if(source){


fields =
source.fields ||
source.columns ||
[];


}



}
catch(e){}



}






meta.fields =
this.normalizeFields(
fields
);





// ====================================================
// PRIMARY KEY
// ====================================================


meta.idField =
this.normalizePrimaryKey(
meta
);







// ====================================================
// FLAGS
// ====================================================


meta.softDelete =
meta.softDelete!==false;



meta.timestamps =
meta.timestamps!==false;



meta.audit =
meta.audit===true;








result[key]=meta;



});





return result;


},
// ============================================================
// NORMALIZE TABLE
// ============================================================


normalizeTable(table,key){


if(
typeof table==="string"
&&
table.length>0
){

return table;

}




// защита от вложенного объекта

if(
table
&&
typeof table==="object"
){



if(
typeof table.table==="string"
){

return table.table;

}



if(
typeof table.name==="string"
){

return table.name;

}


}





return key;


},







// ============================================================
// NORMALIZE FIELDS
// ============================================================


normalizeFields(fields){



if(!fields){

return [];

}



if(
!Array.isArray(fields)
){

return [];

}




return fields

.map(field=>{



if(
typeof field==="string"
){


return {

name:field,

type:"STRING",

required:false,

nullable:true

};


}





return {


name:
field.name ||
field.key ||
field.field ||
null,


type:
field.type ||
"STRING",


required:
field.required===true,


nullable:
field.nullable!==false,


default:
field.default,


unique:
field.unique===true,


index:
field.index===true


};


})

.filter(
f=>f.name
);



},







// ============================================================
// NORMALIZE PRIMARY KEY
// ============================================================


normalizePrimaryKey(meta){



// новый формат

if(
meta.idField
){

return meta.idField;

}





// primaryKey object

if(
meta.primaryKey
&&
typeof meta.primaryKey==="object"
){


return (

meta.primaryKey.name
||
meta.primaryKey.field
||
"ID"

);


}







// primaryKey string

if(
typeof meta.primaryKey==="string"
){

return meta.primaryKey;

}





return "ID";


},







// ============================================================
// VALIDATE
// ============================================================


validateEntities(schema){



Object.keys(schema||{})

.forEach(name=>{


const entity =
schema[name];





if(
!entity.table
){

throw new Error(

"Entity "+
name+
" missing table"

);

}






if(
!entity.fields
||
entity.fields.length===0
){

throw new Error(

"Entity "+
name+
" has empty fields"

);

}






if(
!entity.idField
){

entity.idField="ID";

}





});



return true;


},







// ============================================================
// HASH
// ============================================================


_computeHash(schema){



const json =
this._canonicalStringify(
schema
);



const bytes =
Utilities.computeDigest(

Utilities.DigestAlgorithm.SHA_256,

Utilities.newBlob(json)
.getBytes()

);




return bytes

.map(b=>


(
"0"+
(
(b+256)%256
)

.toString(16)

)

.slice(-2)


)

.join("");



},







_canonicalStringify(obj){


const sort=value=>{


if(
Array.isArray(value)
){


return value.map(sort);


}





if(
value &&
typeof value==="object"
){



return Object.keys(value)

.sort()

.reduce(
(r,k)=>{


r[k]=sort(value[k]);

return r;


},{}

);


}





return value;


};




return JSON.stringify(
sort(obj)
);



},







// ============================================================
// API
// ============================================================


getSchema(){


return JSON.parse(
JSON.stringify(
this.schema
)
);


},







getTables(){


return Object.keys(
this.schema
);


},







getTableSchema(table){


return this.schema[table]
?
JSON.parse(
JSON.stringify(
this.schema[table]
)
)
:
null;


},







getSchemaVersion(){


return (

SchemaStorage.getVersion?.()
||
0

);


},







// ============================================================
// HEALTH
// ============================================================


health(){



return HealthContract.create(

"SchemaManager",

this.initialized
?
"OK"
:
"WARNING",

{


version:this.version,


tables:this.getTables().length,


schemaVersion:
this.getSchemaVersion(),


initialized:
this.initialized


}


);


},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){


return {


module:"SchemaManager",


version:this.version,


initialized:this.initialized,


tables:this.getTables(),


count:this.getTables().length


};


}







};






globalThis.SchemaManager =
SchemaManager;





Logger.log(

"SchemaManager GLOBAL READY v"+
SchemaManager.version

);