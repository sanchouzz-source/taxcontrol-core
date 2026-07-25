// ============================================================
// Database v4.0.0
// TaxControl ERP Core
//
// Storage Engine
//
// Responsibility:
// - Persistence
// - CRUD
// - Query
// - Bulk operations
// - Indexing
// - Transactions
//
// NOT responsible:
// - Permissions
// - Validation
// - Audit
// - Events
// ============================================================


console.log("Database v4.0.0");


const Database = {


version:"4.0.0",

architecture:
"Repository -> Database -> SpreadsheetAdapter",


initialized:false,

status:"CREATED",

lastError:null,


_adapter:null,

_metaCache:{},

_indexes:{},


_stats:{


queries:0,

inserts:0,

updates:0,

deletes:0,

bulkInserts:0,


cacheHits:0,

cacheMisses:0


},



// ============================================================
// INIT
// ============================================================


init(adapter){


if(this.initialized)
return;


try{


this.status="INITIALIZING";


this._adapter =
adapter ||
SpreadsheetAdapter;



if(!this._adapter){

throw new Error(
"Storage adapter missing"
);

}



this.buildMetadata();


this.initialized=true;

this.status="READY";



Logger.log(
"Database READY v"+
this.version
);



}

catch(e){


this.status="FAILED";

this.lastError=e.message;


throw e;


}


},




_require(){


if(!this.initialized){

this.init();

}


},




// ============================================================
// METADATA
// ============================================================


buildMetadata(){


if(
typeof SchemaRegistry==="undefined"
)
return;


SchemaRegistry
.list()
.forEach(entity=>{


const meta =
SchemaRegistry.get(entity);


if(meta){

this._metaCache[entity]=meta;

}


});


},



getMeta(entity){


const meta =
this._metaCache[entity];


if(!meta){

throw new Error(
"Metadata missing: "+entity
);

}


return meta;


},




resolveTable(entity){


return this.getMeta(entity).table;


},




// ============================================================
// INSERT
// ============================================================


insert(entity,data){


this._require();


const meta =
this.getMeta(entity);



const result =
this._adapter.appendObject(

meta.table,

data

);



this._stats.inserts++;


return data;


},




// ============================================================
// BULK INSERT
// ============================================================


bulkInsert(entity,items){


if(!items.length)
return [];


this._require();


const meta =
this.getMeta(entity);



this._adapter.appendObjects(

meta.table,

items

);



this._stats.bulkInserts++;


return items;


},




// ============================================================
// FIND
// ============================================================


find(entity,id){


this._require();



const meta =
this.getMeta(entity);



return this._adapter.findById(

meta.table,

meta.idField || entity+"ID",

id

);


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


return Object.keys(filters)
.every(key=>


String(row[key]) ===
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



const result =
this._adapter.updateById(

meta.table,

meta.idField || entity+"ID",

id,

data

);



this._stats.updates++;


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

meta.idField || entity+"ID",

id

);



this._stats.deletes++;


return result;


},





// ============================================================
// EXISTS
// ============================================================


exists(entity,id){


return !!this.find(entity,id);


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

this._indexes={};


},





// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){


return {


version:this.version,

status:this.status,

initialized:this.initialized,


adapter:
this._adapter?.constructor?.name,


tables:
Object.keys(this._metaCache),


stats:this._stats,


error:this.lastError


};


},





// ============================================================
// HEALTH
// ============================================================


health(){


const data={


version:this.version,

architecture:this.architecture,

status:this.status,


adapter:
!!this._adapter,


stats:this._stats


};



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