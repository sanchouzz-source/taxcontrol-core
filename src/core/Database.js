// ============================================================
// Database v3.0.0
// TaxControl ERP Core
//
// Storage Layer
//
// Responsibility:
// - Google Spreadsheet storage
// - CRUD operations
// - Query engine
// - Cache
// - Indexes
// - Transactions
//
// NOT responsible:
// - Business logic
// - Permissions
// - Events
// - Audit
// - Validation
// ============================================================


console.log("Database v3.0.0");



const Database = {


version:"3.0.0",

architecture:
"SchemaRegistry + RepositoryLayer",


status:"CREATED",

initialized:false,

lastError:null,



// ============================================================
// CACHE
// ============================================================


_spreadsheet:null,


_headerCache:{},

_headerMapCache:{},


_rowIndexCache:{},


_tableIndex:{},




// ============================================================
// STATISTICS
// ============================================================


_stats:{


queries:0,

inserts:0,

updates:0,

deletes:0,


cacheHits:0,

cacheMisses:0,


executionTime:0


},





// ============================================================
// INIT
// ============================================================


init(){


if(this.initialized){

return;

}


try{


this.status="INITIALIZING";



if(
typeof SchemaRegistry!=="undefined" &&
SchemaRegistry.init
){

SchemaRegistry.init();

}



this.buildTableIndex();



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


Logger.error(
"Database INIT FAILED "+
e.message
);


throw e;

}


},





// ============================================================
// READY CHECK
// ============================================================


isReady(){


return (
this.initialized &&
this.status==="READY"
);


},





// ============================================================
// SPREADSHEET
// ============================================================


spreadsheet(){


if(!this._spreadsheet){


this._spreadsheet =
SpreadsheetApp.getActiveSpreadsheet();


}


return this._spreadsheet;


},




sheet(name){


return this.spreadsheet()
.getSheetByName(name);


},




getSheet(name){


const sheet=this.sheet(name);


if(!sheet){

throw new Error(
"Sheet not found: "+name
);

}


return sheet;


},





// ============================================================
// METADATA
// ============================================================


buildTableIndex(){


this._tableIndex={};


if(
typeof SchemaRegistry==="undefined"
){

return;

}



const list =
SchemaRegistry.list();



list.forEach(entity=>{


const meta =
SchemaRegistry.get(entity);



if(meta){


this._tableIndex[entity]=meta;


this._tableIndex[meta.table]=meta;


}


});


},




resolveTable(entity){


const meta =
this._tableIndex[entity];


return meta
?
meta.table
:
entity;


},




getMeta(entity){


const meta =
this._tableIndex[entity];


if(!meta){

throw new Error(
"Metadata missing: "+entity
);

}


return meta;


},





// ============================================================
// HEADERS
// ============================================================


headers(sheet){


const name=
sheet.getName();



if(this._headerCache[name]){


this._stats.cacheHits++;


return {

headers:this._headerCache[name],

map:this._headerMapCache[name]

};

}



this._stats.cacheMisses++;



const headers =
sheet
.getRange(
1,
1,
1,
sheet.getLastColumn()
)
.getValues()[0];



const map={};


headers.forEach(
(h,i)=>map[h]=i
);



this._headerCache[name]=headers;

this._headerMapCache[name]=map;



return {

headers,

map

};


},





// ============================================================
// INSERT
// ============================================================


insert(entity,data){


this.init();


const table =
this.resolveTable(entity);


const sheet =
this.getSheet(table);



const {
headers
}=this.headers(sheet);



const row =
headers.map(
h=>data[h] ?? ""
);



sheet
.getRange(
sheet.getLastRow()+1,
1,
1,
headers.length
)
.setValues([row]);



this._stats.inserts++;



return data;


},





// ============================================================
// FIND
// ============================================================


find(entity,id){


this.init();


const table =
this.resolveTable(entity);


const sheet =
this.getSheet(table);



const {
headers,
map
}=this.headers(sheet);



const values =
sheet
.getDataRange()
.getValues();



const idField =
this.getMeta(entity).idField ||
entity+"ID";



const col =
map[idField];



for(
let i=1;
i<values.length;
i++
){


if(
String(values[i][col])===
String(id)
){


const obj={};


headers.forEach(
(h,j)=>
obj[h]=values[i][j]
);



return obj;


}


}



return null;


},





// ============================================================
// QUERY
// ============================================================


query(entity,filters={}){


this.init();



const table =
this.resolveTable(entity);


const sheet =
this.getSheet(table);



const {
headers
}=this.headers(sheet);



const rows =
sheet
.getDataRange()
.getValues();



const result=[];



for(
let i=1;
i<rows.length;
i++
){


const obj={};


headers.forEach(
(h,j)=>
obj[h]=rows[i][j]
);



let ok=true;



Object.keys(filters)
.forEach(k=>{


if(
String(obj[k]) !==
String(filters[k])
){

ok=false;

}


});



if(ok){

result.push(obj);

}


}



this._stats.queries++;


return result;


},





// ============================================================
// UPDATE
// ============================================================


update(entity,id,data){


const current =
this.find(entity,id);



if(!current){

throw new Error(
"Record not found "+id
);

}



const updated={

...current,

...data

};



const table =
this.resolveTable(entity);


const sheet =
this.getSheet(table);



const {
headers,
map
}=this.headers(sheet);



const idField =
this.getMeta(entity).idField ||
entity+"ID";



const values =
sheet.getDataRange().getValues();



for(
let i=1;
i<values.length;
i++
){


if(
String(values[i][map[idField]])===
String(id)
){


sheet
.getRange(
i+1,
1,
1,
headers.length
)
.setValues([

headers.map(
h=>updated[h]??""
)

]);


break;

}


}



this._stats.updates++;


return updated;


},





// ============================================================
// DELETE
// ============================================================


delete(entity,id){


return this.update(
entity,
id,
{
Deleted:true,
DeletedAt:new Date()
}
);


},





// ============================================================
// TRANSACTION
// ============================================================


transaction(callback){


const lock =
LockService.getDocumentLock();


try{


lock.waitLock(5000);


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


this._headerCache={};

this._headerMapCache={};

this._rowIndexCache={};


},





// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){


return {


version:this.version,

status:this.status,


initialized:this.initialized,


tables:
Object.keys(this._tableIndex),


stats:this._stats,


error:this.lastError


};


},





// ============================================================
// HEALTH
// ============================================================


health(){


return HealthContract.create(

"Database",

this.isReady()
?
"OK"
:
"WARNING",


{

version:this.version,

status:this.status,

architecture:this.architecture

}

);


}



};





globalThis.Database =
Database;



Logger.log(
"Database REGISTERED v"+
Database.version
);