// ============================================================
// Database v4.1.0
// TaxControl ERP Core
//
// Storage Engine
//
// Layer:
// Repository
//      |
// Database
//      |
// SpreadsheetAdapter
//
// Responsibility:
// - Persistence
// - CRUD
// - Query
// - Bulk
// - Transactions
// - Storage diagnostics
//
// NOT responsible:
// - Validation
// - Permissions
// - Audit
// - Events
// ============================================================


console.log("Database v4.1.0");



const Database = {


version:"4.1.0",


architecture:
"Repository -> Database -> SpreadsheetAdapter",



initialized:false,

status:"CREATED",

lastError:null,


_adapter:null,


_metaCache:{},



_stats:{


queries:0,

inserts:0,

updates:0,

deletes:0,

bulkInserts:0,


adapterCalls:0,


cacheHits:0,

cacheMisses:0


},



// ============================================================
// INIT
// ============================================================


init(adapter){


if(this.initialized){

return;

}



try{


this.status="INITIALIZING";



this._adapter =
adapter ||
(
typeof SpreadsheetAdapter!=="undefined"
?
SpreadsheetAdapter
:
null
);



if(!this._adapter){

throw new Error(
"SpreadsheetAdapter unavailable"
);

}



this.buildMetadata();



this.initialized=true;

this.status="READY";



Logger.log(
"Database READY v"+
this.version+
" adapter="+
this.adapterName()
);



}

catch(e){


this.status="FAILED";

this.lastError=e.message;


Logger.error(
"Database INIT FAILED "+
e.message
);


throw e;


}


},




// ============================================================
// REQUIRE READY
// ============================================================


_require(){


if(!this.initialized){

this.init();

}


},




// ============================================================
// ADAPTER
// ============================================================


adapterName(){


if(!this._adapter)
return "none";


return (
this._adapter.version
?
"SpreadsheetAdapter v"+
this._adapter.version
:
this._adapter.constructor.name
);


},





// ============================================================
// METADATA
// ============================================================


// ============================================================
// BUILD METADATA v4.2
// ============================================================

buildMetadata(){

this._metaCache={};


if(typeof SchemaRegistry==="undefined"){

Logger.warn(
"Database: SchemaRegistry unavailable"
);

return;

}



let entities=[];



// вариант 1
if(typeof SchemaRegistry.list==="function"){

entities = SchemaRegistry.list();

}


// вариант 2
else if(typeof SchemaRegistry.getAll==="function"){

entities =
Object.keys(
SchemaRegistry.getAll()
);

}


// вариант 3
else if(SchemaRegistry.registry){

entities =
Object.keys(
SchemaRegistry.registry
);

}


// вариант 4
else if(SchemaRegistry.entities){

entities =
Object.keys(
SchemaRegistry.entities
);

}



Logger.log(
"Database metadata loading entities="+
entities.length
);



entities.forEach(entity=>{


let meta=null;



if(typeof SchemaRegistry.get==="function"){

meta =
SchemaRegistry.get(entity);

}


else if(SchemaRegistry.registry){

meta =
SchemaRegistry.registry[entity];

}


else if(SchemaRegistry.entities){

meta =
SchemaRegistry.entities[entity];

}



if(meta){

this._metaCache[entity]=meta;

}


});



Logger.log(
"Database metadata loaded="+
Object.keys(this._metaCache).length
);


},





getMeta(entity){


const meta =
this._metaCache[entity];



if(!meta){


this.buildMetadata();


}



const result =
this._metaCache[entity];



if(!result){

throw new Error(
"Metadata missing: "+entity
);

}



return result;


},





resolveTable(entity){


return this
.getMeta(entity)
.table;


},




// ============================================================
// INSERT
// ============================================================


insert(entity,data){


this._require();



const meta =
this.getMeta(entity);



if(
!this._adapter.appendObject
){

throw new Error(
"Adapter appendObject unavailable"
);

}



const result =
this._adapter.appendObject(

meta.table,

data

);



this._stats.inserts++;

this._stats.adapterCalls++;



return result || data;


},





// ============================================================
// BULK INSERT
// ============================================================


bulkInsert(entity,items){


this._require();



if(
!items ||
!items.length
){

return [];

}



const meta =
this.getMeta(entity);



let result;



if(
this._adapter.bulkInsert
){

result =
this._adapter.bulkInsert(
meta.table,
items
);


}

else if(
this._adapter.appendObjects
){

result =
this._adapter.appendObjects(
meta.table,
items
);


}

else{


result =
items.map(
i=>
this.insert(entity,i)
);


}



this._stats.bulkInserts++;

this._stats.adapterCalls++;



return result || items;


},




// ============================================================
// FIND
// ============================================================


find(entity,id){


this._require();



const meta =
this.getMeta(entity);



const result =
this._adapter.findById(

meta.table,

meta.idField ||
meta.primaryKey ||
"id",

id

);



this._stats.adapterCalls++;



return result;


},





// ============================================================
// QUERY
// ============================================================


query(entity,filters={}){


this._require();



const meta =
this.getMeta(entity);



const rows =
this._adapter.readObjects(
meta.table
);



const result =
rows.filter(row=>{


return Object
.keys(filters)
.every(
key=>
String(row[key])
===
String(filters[key])
);


});



this._stats.queries++;



return result;


},




// ============================================================
// UPDATE
// ============================================================


update(entity,id,data){


this._require();



const meta =
this.getMeta(entity);



if(
!this._adapter.updateById
){

throw new Error(
"Adapter updateById unavailable"
);

}



const result =
this._adapter.updateById(

meta.table,

meta.idField ||
meta.primaryKey ||
"id",

id,

data

);



this._stats.updates++;

this._stats.adapterCalls++;



return result;


},





// ============================================================
// DELETE
// ============================================================


delete(entity,id){


this._require();



const meta =
this.getMeta(entity);



const result =
this._adapter.deleteById(

meta.table,

meta.idField ||
meta.primaryKey ||
"id",

id

);



this._stats.deletes++;

this._stats.adapterCalls++;



return result;


},




// ============================================================
// EXISTS
// ============================================================


exists(entity,id){


return this.find(entity,id)!==null;


},





// ============================================================
// TRANSACTION
// ============================================================


transaction(callback){


const lock =
LockService.getScriptLock();



lock.waitLock(10000);



try{


return callback();


}

finally{


lock.releaseLock();


}


},





// ============================================================
// CACHE
// ============================================================


clearCache(){


this._metaCache={};


if(
this._adapter.clearCache
){

this._adapter.clearCache();

}


},





// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){


return {


module:"Database",

version:this.version,


status:this.status,


initialized:this.initialized,


architecture:this.architecture,


adapter:this.adapterName(),


tables:
Object.keys(
this._metaCache
),


stats:this._stats,


error:this.lastError


};


},





// ============================================================
// HEALTH
// ============================================================


health(){


const data=this.diagnostics();



if(
typeof HealthContract!=="undefined"
){

return HealthContract.create(

"Database",

this.status==="READY"
?
"OK"
:
"WARNING",

data

);

}



return data;


}



};





globalThis.Database =
Database;



Logger.log(
"Database REGISTERED v"+
Database.version
);