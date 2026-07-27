// ============================================================
// SchemaManager.gs
// ERP TexControl Core
//
// Version:
// SchemaManager v4.2.0
//
// Compatible:
// EntityMetadata v3.x
// EntityValidator v1.1+
// SchemaRegistry v4.x
// EntityRegistry v2.4+
//
// Fix:
// - Metadata v3 object support
// - Registry compatibility
// - Object fields normalization
// - Primary key normalization
// - System entities support
// ============================================================


console.log("SchemaManager v4.2.0");



const SchemaManager = {


version:"4.2.0",

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


let built =
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

if(typeof SchemaValidator!=="undefined"){

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
// LOAD
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
// STRICT VALIDATION
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
// VERSION HASH
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



SchemaSnapshot.save(
version,
hash,
merged
);



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




if(typeof SchemaEvents!=="undefined"
&&
SchemaEvents.emit
){

SchemaEvents.emit(
"SCHEMA_READY",
{
tables:this.getTables().length,
version:this.version
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



if(!meta)
return;



// ----------------------------------------------------
// Если пришёл объект metadata вместо имени
// ----------------------------------------------------


if(
meta.entity &&
typeof meta.entity==="object"
){

meta.entity =
key;

}



// ----------------------------------------------------
// TABLE
// ----------------------------------------------------


if(
typeof meta.table==="object"
){

if(meta.table.table){

meta.table =
meta.table.table;

}

else{

meta.table =
key;

}

}



// ----------------------------------------------------
// FIELDS
// ----------------------------------------------------


let fields =
meta.fields
||
meta.columns
||
[];





// object fields -> array

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




// если нет полей - пробуем metadata

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
source.fields
||
source.columns
||
[];

}



}
catch(e){}



}






// normalize fields

fields =
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
f.name ||
f.key ||
f.field,

type:
f.type ||
"STRING",

required:
f.required===true,


nullable:
f.nullable!==false

};


})
.filter(f=>f.name);






meta.fields =
fields;





// ----------------------------------------------------
// PRIMARY KEY
// ----------------------------------------------------


meta.idField =
meta.idField
||
meta.primaryKey
||
"ID";





// ----------------------------------------------------
// ENTITY NAME
// ----------------------------------------------------


meta.entity =
meta.entity
||
key;



result[key]=meta;



});



return result;


},







// ============================================================
// VALIDATE
// ============================================================


validateEntities(schema){



Object.keys(schema)
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
this._canonicalStringify(schema);



const bytes =
Utilities.computeDigest(

Utilities.DigestAlgorithm.SHA_256,

Utilities.newBlob(json)
.getBytes()

);



return bytes.map(b=>

('0'+
((b+256)%256)
.toString(16)
)
.slice(-2)

)
.join("");

},






_canonicalStringify(obj){


const sort=value=>{


if(Array.isArray(value))

return value.map(sort);



if(value && typeof value==="object"){


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

schemaVersion:this.getSchemaVersion(),

initialized:this.initialized

}

);


},





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