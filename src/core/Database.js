// ============================================================
// Database v4.2.0
// TaxControl ERP Core
//
// Storage Engine
//
// Repository
//      |
// Database
//      |
// SpreadsheetAdapter
//
// Compatible:
// SpreadsheetAdapter v4.3+
// RepositoryFactory v2.5.8+
// EntityService v5.0+
// SystemInit v2.5+
// ============================================================


console.log("Database v4.2.0");



const Database = {


version:"4.2.0",


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

restores:0,

bulkInserts:0,

adapterCalls:0,

transactions:0


},






// ============================================================
// INIT
// ============================================================


init(adapter){


if(this.initialized){

return true;

}



try{


this.status="INITIALIZING";



this._adapter =
adapter ||
SpreadsheetAdapter;



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



return true;


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
// REQUIRE
// ============================================================


_require(){


if(!this.initialized){

this.init();

}


},







// ============================================================
// ADAPTER INFO
// ============================================================


adapterName(){


return this._adapter?.version

?

"SpreadsheetAdapter v"+
this._adapter.version

:

"unknown";


},







// ============================================================
// METADATA
// ============================================================


buildMetadata(){


this._metaCache={};



if(
typeof SchemaRegistry==="undefined"
){

throw new Error(
"SchemaRegistry unavailable"
);

}



const entities =
SchemaRegistry.list();



entities.forEach(entity=>{


const name =
typeof entity==="string"

?

entity

:

entity.entity;



if(!name){

return;

}



const meta =
SchemaRegistry.get(name);



if(meta){

this._metaCache[name]=meta;

}



});



Logger.log(

"Database metadata loaded "+
Object.keys(this._metaCache).length

);



},







getMeta(entity){


this._require();



entity =
this.resolveEntity(entity);



let meta =
this._metaCache[entity];



if(!meta){


this.buildMetadata();


meta =
this._metaCache[entity];


}



if(!meta){

throw new Error(
"Metadata missing "+
entity
);

}



return meta;


},







resolveEntity(entity){


if(
typeof EntityRegistry!=="undefined"
&&
EntityRegistry.resolve
){

return EntityRegistry.resolve(entity);

}



return entity;


},







table(entity){


return this.getMeta(entity).table;


},







idField(entity){


const meta =
this.getMeta(entity);



return (

meta.idField ||

meta.primaryKey ||

"id"

);


},







// ============================================================
// CREATE
// ============================================================


insert(entity,data){


this._require();



const meta =
this.getMeta(entity);



let result;



if(
this._adapter.appendObject
){

result =
this._adapter.appendObject(
meta.table,
data
);


}

else{


throw new Error(
"Adapter appendObject missing"
);


}



this._stats.inserts++;

this._stats.adapterCalls++;



return result || data;


},







// ============================================================
// BULK
// ============================================================


bulkInsert(entity,items=[]){


if(!items.length){

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
else{


result =
items.map(
x=>
this.insert(entity,x)
);


}



this._stats.bulkInserts++;



return result;


},







// ============================================================
// READ
// ============================================================


find(entity,id){


const meta =
this.getMeta(entity);



const result =
this._adapter.findById(

meta.table,

this.idField(entity),

id

);



this._stats.adapterCalls++;



return result;


},







findAll(entity){


const meta =
this.getMeta(entity);



return this._adapter.findAll(
meta.table
);


},







query(entity,filters={}){


const rows =
this.findAll(entity);



this._stats.queries++;



return rows.filter(row=>{


return Object.keys(filters)
.every(

key=>

String(row[key])
===
String(filters[key])

);


});


},







findWhere(entity,criteria={}){


return this.query(
entity,
criteria
);


},







count(entity,filters={}){


return this.query(
entity,
filters
).length;


},







// ============================================================
// UPDATE
// ============================================================


update(entity,id,data){


const meta =
this.getMeta(entity);



if(
!this._adapter.updateById
){

throw new Error(
"Adapter updateById missing"
);

}



const result =
this._adapter.updateById(

meta.table,

this.idField(entity),

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


const meta =
this.getMeta(entity);



let result;



if(
this._adapter.delete
){


result =
this._adapter.delete(

meta.table,

this.idField(entity),

id

);


}

else{


throw new Error(
"Adapter delete missing"
);


}



this._stats.deletes++;



return result;


},







restore(entity,id){


const meta =
this.getMeta(entity);



const result =
this._adapter.restore(

meta.table,

this.idField(entity),

id

);



this._stats.restores++;



return result;


},







exists(entity,id){


return !!this.find(
entity,
id
);


},







// ============================================================
// TRANSACTION
// ============================================================


transaction(callback){


this._stats.transactions++;



if(
this._adapter.transaction
){

return this._adapter.transaction(
callback
);


}



return callback();


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


return{


module:
"Database",


version:
this.version,


status:
this.status,


initialized:
this.initialized,


architecture:
this.architecture,


adapter:
this.adapterName(),


entities:
Object.keys(
this._metaCache
),


stats:
this._stats,


error:
this.lastError


};


},







// ============================================================
// HEALTH
// ============================================================


health(){


const data =
this.diagnostics();



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