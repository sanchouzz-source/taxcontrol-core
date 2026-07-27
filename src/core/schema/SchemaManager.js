// ============================================================
// SchemaManager.gs
// ERP TexControl Core
//
// Version:
// SchemaManager v4.1.2
//
// Compatible:
// EntityMetadata v3.x
// EntityValidator v1.1
// SchemaRegistry v4.x
// EntityRegistry v2.4
//
// Features:
// - Object fields support
// - Array fields compatibility
// - Metadata normalization
// - Schema validation
// - Version control
// ============================================================


console.log("SchemaManager v4.1.2");



const SchemaManager = {



version:"4.1.2",


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



const mode =
options.syncMode ||
"SAFE";



return SchemaLock.withLock(()=>{


try{


Logger.log(
"SCHEMA INIT START v"+
this.version
);





// ------------------------------------------------------------
// 1. BUILD
// ------------------------------------------------------------


const built =
SchemaBuilder.build();



Logger.log(

"SCHEMA BUILT TABLES="+
Object.keys(built).length

);






// ------------------------------------------------------------
// 2. NORMALIZE
// ------------------------------------------------------------


const normalized =
this.normalizeSchema(
built
);





// ------------------------------------------------------------
// 3. VALIDATE
// ------------------------------------------------------------


try{


SchemaValidator.check(
normalized
);


}
catch(e){


Logger.warn(

"SchemaValidator WARNING: "+
e.message

);


}







// ------------------------------------------------------------
// 4. LOAD STORED
// ------------------------------------------------------------


let stored={};



try{


stored =
SchemaStorage.load()
||
{};


}
catch(e){


Logger.warn(
"SchemaStorage skipped "+
e.message
);


}








// ------------------------------------------------------------
// 5. MERGE
// ------------------------------------------------------------


const merged =
SchemaDiff.merge(
stored,
normalized
);








// ------------------------------------------------------------
// 6. STRICT CHECK
// ------------------------------------------------------------


this.validateEntities(
merged
);








// ------------------------------------------------------------
// 7. SAVE
// ------------------------------------------------------------


SchemaStorage.save(
merged
);








// ------------------------------------------------------------
// 8. VERSION
// ------------------------------------------------------------


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
"Schema VERSION "+version
);


}








// ------------------------------------------------------------
// 9. CACHE
// ------------------------------------------------------------


this.schema =
JSON.parse(
JSON.stringify(merged)
);



this.initialized=true;





Logger.log(

"SchemaManager READY v"+
this.version+
" TABLES="+
this.getTables().length

);





SchemaEvents.emit(
"SCHEMA_READY",
{

tables:this.getTables().length,

version:this.version

}

);



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
// NORMALIZER
// ============================================================


normalizeSchema(schema){



const result={};



Object.keys(schema)
.forEach(name=>{


const meta =
schema[name];



if(!meta){

return;

}




// fields object -> array

if(
meta.fields
&&
!Array.isArray(meta.fields)
){


meta.fields =
Object.keys(meta.fields)
.map(field=>{


return {

name:field,

...meta.fields[field]

};


});


}




if(!meta.fields){


throw new Error(

"Entity "+
name+
" has no fields"

);


}





result[name]=meta;



});



return result;


},







// ============================================================
// VALIDATION
// ============================================================


validateEntities(schema){



Object.keys(schema)
.forEach(name=>{


const entity =
schema[name];



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



if(!entity.idField){


throw new Error(

"Entity "+
name+
" missing idField"

);


}



if(!entity.table){


throw new Error(

"Entity "+
name+
" missing table"

);


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

.map(
b=>
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


if(Array.isArray(value)){


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


},
{}
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
JSON.stringify(this.schema)
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


module:
"SchemaManager",


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