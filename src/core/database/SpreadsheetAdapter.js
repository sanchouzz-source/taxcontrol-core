// ============================================================
// SpreadsheetAdapter.gs v4.4.0
// TaxControl ERP Core
//
// Enterprise Storage Adapter
//
// Architecture:
//
// EntityService
//       |
// RepositoryFactory
//       |
// BaseRepository
//       |
// Database
//       |
// SpreadsheetAdapter
//       |
// Google Sheets
//
// ============================================================


console.log("SpreadsheetAdapter v4.4.0");



const SpreadsheetAdapter = {


version:"4.4.0",


architecture:
"Enterprise Storage Adapter",


initialized:false,



_spreadsheet:null,


_sheetCache:{},


_headerCache:{},


_indexCache:{},



_cacheTTL:300000,



_stats:{


insert:0,

find:0,

update:0,

delete:0,

restore:0,

query:0,

bulk:0,

replace:0,

cacheHit:0,

cacheMiss:0,

transactions:0,

errors:0


},





protectedSheets:[


"_SystemSchemaTables",

"_SystemSchemaFields",

"_SchemaVersions",

"_SchemaHistory",

"_SchemaMigrations",

"_SchemaUIDMap",

"_SchemaSnapshots",

"_SchemaFields",

"_SchemaTables",

"_SchemaIndexes",

"_MigrationLock"


],







// ============================================================
// INIT
// ============================================================


init(){


if(this.initialized){

return true;

}



this.getSpreadsheet();


this.initialized=true;



Logger.log(
"SpreadsheetAdapter READY v"+
this.version
);



return true;


},







_require(){


if(!this.initialized){

this.init();

}


},







// ============================================================
// CONNECTION
// ============================================================


getSpreadsheet(){


if(this._spreadsheet){

return this._spreadsheet;

}



try{


const props =
PropertiesService.getScriptProperties();



const id =
props.getProperty(
"SPREADSHEET_ID"
);



if(id){


this._spreadsheet =
SpreadsheetApp.openById(id);


}
else{


this._spreadsheet =
SpreadsheetApp.getActiveSpreadsheet();


}



}
catch(e){


this._stats.errors++;


throw new Error(
"Spreadsheet connection failed "+
e.message
);


}



if(!this._spreadsheet){

throw new Error(
"Spreadsheet not configured"
);

}



return this._spreadsheet;


},







// ============================================================
// SHEET
// ============================================================


getSheet(name){


const now=Date.now();



if(
this._sheetCache[name]
&&
now-this._sheetCache[name].time<this._cacheTTL
){


this._stats.cacheHit++;


return this._sheetCache[name].sheet;


}



this._stats.cacheMiss++;



const sheet =
this.getSpreadsheet()
.getSheetByName(name);



if(sheet){


this._sheetCache[name]={

sheet,

time:now

};


}



return sheet;


},







getOrCreateSheet(name,headers=[]){


let sheet =
this.getSheet(name);



if(!sheet){


sheet =
this.getSpreadsheet()
.insertSheet(name);



if(headers.length){

this.setHeaders(
sheet,
headers
);

}


}



return sheet;


},







sheetExists(name){


return !!this.getSheet(name);


},







deleteSheet(name){


if(
this.protectedSheets.includes(name)
){

throw new Error(
"Protected sheet "+name
);

}



const sheet =
this.getSheet(name);



if(sheet){


this.getSpreadsheet()
.deleteSheet(sheet);


this.clearCache(name);


}


},







// ============================================================
// HEADERS
// ============================================================


getHeaders(sheet){


const name =
sheet.getName();



if(this._headerCache[name]){


return this._headerCache[name];

}



const last =
sheet.getLastColumn();



if(!last){

return [];

}



const headers =
sheet
.getRange(
1,
1,
1,
last
)
.getValues()[0];



this._headerCache[name]=headers;


return headers;


},







setHeaders(sheet,headers){


sheet
.getRange(
1,
1,
1,
headers.length
)
.setValues([
headers
]);



this._headerCache[
sheet.getName()
]=headers;


},










// ============================================================
// SCHEMA AUTO MIGRATION
// ============================================================


ensureSchema(sheetName,data){


const sheet =
this.getOrCreateSheet(sheetName);



let headers =
this.getHeaders(sheet);



Object.keys(data)
.forEach(field=>{


if(!headers.includes(field)){


headers.push(field);


this.setHeaders(
sheet,
headers
);


}


});



return headers;


},







// ============================================================
// CONVERSION
// ============================================================


objectToRow(headers,obj){


return headers.map(
h=>obj[h] ?? ""
);


},




rowToObject(headers,row){


const obj={};


headers.forEach(
(h,i)=>{


obj[h]=row[i];


}
);



return obj;


},







// ============================================================
// INSERT
// ============================================================


insert(sheetName,data){


this._require();



const sheet =
this.getOrCreateSheet(sheetName);



const headers =
this.ensureSchema(
sheetName,
data
);



sheet.appendRow(
this.objectToRow(
headers,
data
)
);



this.invalidate(sheetName);



this._stats.insert++;



return data;


},







appendObject(sheet,data){

return this.insert(
sheet,
data
);

},







bulkInsert(sheetName,list=[]){


if(!list.length){

return [];

}



const sheet =
this.getOrCreateSheet(
sheetName
);



const headers =
this.ensureSchema(
sheetName,
list[0]
);



const rows =
list.map(
x=>this.objectToRow(headers,x)
);



sheet
.getRange(
sheet.getLastRow()+1,
1,
rows.length,
headers.length
)
.setValues(rows);



this.invalidate(sheetName);



this._stats.bulk+=rows.length;



return list;


},





// ============================================================
// REPLACE TABLE CONTENTS
// ============================================================


replace(sheetName,rows=[],headers=[]){


this._require();


if(
typeof sheetName!=="string"
||
!sheetName.trim()
){

throw new Error(
"SpreadsheetAdapter.replace sheetName required"
);

}


if(!Array.isArray(rows)){

throw new Error(
"SpreadsheetAdapter.replace rows must be array"
);

}


if(
!Array.isArray(headers)
||
!headers.length
){

throw new Error(
"SpreadsheetAdapter.replace headers required"
);

}


const normalizedHeaders =
headers.map(header=>{


if(
typeof header!=="string"
||
!header.trim()
){

throw new Error(
"SpreadsheetAdapter.replace invalid header"
);

}


return header;


});


if(
new Set(normalizedHeaders).size
!==
normalizedHeaders.length
){

throw new Error(
"SpreadsheetAdapter.replace duplicate headers"
);

}


let values=[];


if(rows.length){


const objectRows =
rows.every(
row=>
row
&&
typeof row==="object"
&&
!Array.isArray(row)
);


const arrayRows =
rows.every(
row=>Array.isArray(row)
);


if(
!objectRows
&&
!arrayRows
){

throw new Error(
"SpreadsheetAdapter.replace rows must use one format"
);

}


if(objectRows){


values =
rows.map(
row=>
this.objectToRow(
normalizedHeaders,
row
)
);


}
else{


rows.forEach((row,index)=>{


if(
row.length
!==
normalizedHeaders.length
){

throw new Error(
"SpreadsheetAdapter.replace row width mismatch at "+index
);

}


});


values =
rows.map(
row=>row.slice()
);


}


}


const sheet =
this.getOrCreateSheet(
sheetName
);


if(
typeof sheet.clearContents==="function"
){

sheet.clearContents();

}
else{

sheet.clear();

}


this.setHeaders(
sheet,
normalizedHeaders
);


if(values.length){


sheet
.getRange(
2,
1,
values.length,
normalizedHeaders.length
)
.setValues(values);


}


this.invalidate(
sheetName
);


this._stats.replace++;


return rows;


},
// ============================================================
// READ
// ============================================================


find(sheetName,idField,id){


const row =
this.findRow(
sheetName,
idField,
id
);



if(!row){

return null;

}



const sheet =
this.getSheet(sheetName);



const headers =
this.getHeaders(sheet);



const values =
sheet
.getRange(
row,
1,
1,
headers.length
)
.getValues()[0];



this._stats.find++;



return this.rowToObject(
headers,
values
);


},







findById(sheetName,idField,id){


return this.find(
sheetName,
idField,
id
);


},







findAll(sheetName){


const sheet =
this.getSheet(sheetName);



if(!sheet){

return [];

}



const values =
sheet
.getDataRange()
.getValues();



if(values.length<=1){

return [];

}



const headers =
values[0];



return values
.slice(1)
.map(
row=>
this.rowToObject(
headers,
row
)
)
.filter(
x=>
x.Deleted!==true
);



},







query(sheetName,filters={}){


const rows =
this.findAll(sheetName);



this._stats.query++;



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







findWhere(sheetName,criteria){


return this.query(
sheetName,
criteria
);


},







// ============================================================
// FIND ROW
// ============================================================


findRow(sheetName,field,value){


const index =
this.getIndex(
sheetName,
field
);



return index[
String(value)
]
||
null;


},







// ============================================================
// UPDATE
// ============================================================


update(sheetName,idField,id,data){


const row =
this.findRow(
sheetName,
idField,
id
);



if(!row){

throw new Error(
"Record not found "+id
);

}



const sheet =
this.getSheet(sheetName);



const headers =
this.getHeaders(sheet);



const current =
this.rowToObject(

headers,

sheet
.getRange(
row,
1,
1,
headers.length
)
.getValues()[0]

);



const updated={

...current,

...data,


_updatedAt:
new Date().toISOString(),


_version:
Number(current._version||0)+1


};




sheet
.getRange(
row,
1,
1,
headers.length
)
.setValues([

this.objectToRow(
headers,
updated
)

]);



this.invalidate(
sheetName
);



this._stats.update++;



return updated;


},







updateById(sheetName,idField,id,data){


return this.update(
sheetName,
idField,
id,
data
);


},







// ============================================================
// SOFT DELETE
// ============================================================


delete(sheetName,idField,id){


return this.update(

sheetName,

idField,

id,

{


Deleted:true,


DeletedAt:
new Date().toISOString()


}

);


},







restore(sheetName,idField,id){


const result =
this.update(

sheetName,

idField,

id,

{


Deleted:false,


DeletedAt:""


}

);



this._stats.restore++;



return result;


},







exists(sheetName,idField,id){


if(arguments.length===1){

return this.sheetExists(
sheetName
);

}


return !!this.find(
sheetName,
idField,
id
);


},







// ============================================================
// INDEX ENGINE
// ============================================================


getIndex(sheetName,field){


const key =
sheetName+
"|"+
field;



if(
this._indexCache[key]
){

return this._indexCache[key];

}



const sheet =
this.getSheet(sheetName);



if(!sheet){

return {};

}



const headers =
this.getHeaders(sheet);



const column =
headers.indexOf(field);



if(column===-1){

throw new Error(
"Index field missing "+
field
);

}



const values =
sheet
.getDataRange()
.getValues();



const index={};



for(
let i=1;
i<values.length;
i++
){


const value =
values[i][column];


if(value!=="" && value!=null){


index[String(value)]
=
i+1;


}


}



this._indexCache[key]=index;



return index;


},







invalidate(sheetName){


Object.keys(this._indexCache)
.forEach(key=>{


if(
key.startsWith(sheetName+"|")
){

delete this._indexCache[key];

}


});



delete this._headerCache[sheetName];


},







// ============================================================
// TRANSACTION
// ============================================================


transaction(callback){


const lock =
LockService
.getScriptLock();



lock.waitLock(10000);



this._stats.transactions++;



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


clearCache(sheetName){


if(sheetName){


delete this._sheetCache[sheetName];

delete this._headerCache[sheetName];


return;

}



this._sheetCache={};

this._headerCache={};

this._indexCache={};


},







reset(){


this.clearCache();


this._spreadsheet=null;


this.initialized=false;


Logger.log(
"SpreadsheetAdapter RESET"
);


},







// ============================================================
// METRICS
// ============================================================


metrics(){


return {


version:this.version,


stats:this._stats,


cache:{


sheets:
Object.keys(
this._sheetCache
).length,


headers:
Object.keys(
this._headerCache
).length,


indexes:
Object.keys(
this._indexCache
).length


}


};


},







// ============================================================
// HEALTH
// ============================================================


health(){


const data={


version:this.version,


architecture:
this.architecture,


initialized:this.initialized,


metrics:this.metrics()


};



if(
typeof HealthContract!=="undefined"
){


return HealthContract.create(

"SpreadsheetAdapter",

this.initialized
?
"OK"
:
"WARNING",

data

);


}



return {


module:
"SpreadsheetAdapter",

status:
"OK",

...data


};


},







diagnostics(){


return this.health();


}



};







// ============================================================
// COMPATIBILITY API
// ============================================================


SpreadsheetAdapter.write =
function(sheet,data){


return this.insert(
sheet,
data
);


};




SpreadsheetAdapter.writeRows =
function(sheetName,rows,headers=[]){


if(headers.length){

return this.replace(
sheetName,
rows,
headers
);

}


const sheet =
this.getOrCreateSheet(
sheetName,
headers
);



sheet.clear();



if(headers.length){

this.setHeaders(
sheet,
headers
);


}



if(rows.length){


sheet
.getRange(
2,
1,
rows.length,
rows[0].length
)
.setValues(rows);


}



this.invalidate(sheetName);


};





SpreadsheetAdapter.readRows =
function(sheetName){


const sheet =
this.getSheet(sheetName);



if(!sheet){

return [];

}



const values =
sheet
.getDataRange()
.getValues();



return values.length>1
?
values.slice(1)
:
[];


};






SpreadsheetAdapter.appendRow =
function(sheetName,row){


this.getOrCreateSheet(
sheetName
)
.appendRow(row);



this.invalidate(sheetName);


};






SpreadsheetAdapter.hasSheet =
function(name){


return this.sheetExists(name);


};






// ============================================================
// REGISTER GLOBAL
// ============================================================


globalThis.SpreadsheetAdapter =
SpreadsheetAdapter;



Logger.log(
"SpreadsheetAdapter GLOBAL READY v"+
SpreadsheetAdapter.version
);
