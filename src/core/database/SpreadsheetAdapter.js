// ============================================================
// SpreadsheetAdapter.gs v4.0.0
// TaxControl ERP Core
//
// Infrastructure Storage Adapter
//
// Responsibility:
// - Google Sheets persistence
// - CRUD operations
// - Query
// - Bulk operations
// - Cache
// - Indexes
// - Transactions
//
// NOT responsible:
// - Business logic
// - Permissions
// - Validation
// - Audit
// - Events
// ============================================================


console.log("SpreadsheetAdapter v4.0.0");



const SpreadsheetAdapter = {


version:"4.0.0",



architecture:
"Database -> SpreadsheetAdapter -> GoogleSheets",



initialized:false,



_spreadsheet:null,


_sheetCache:{},


_headerCache:{},


_indexCache:{},



_cacheTTL:300000,


_cacheTime:{},



_batchMode:false,


_batchQueue:[],



_stats:{


insert:0,

find:0,

query:0,

update:0,

delete:0,

bulkInsert:0,

cacheHit:0,

cacheMiss:0


},




// ============================================================
// PROTECTED SHEETS
// ============================================================


_protectedSheets:[


"_SchemaVersions",

"_SchemaHistory",

"_SchemaFields",

"_SchemaTables",

"_SchemaIndexes",

"_SchemaMigrations",

"_MigrationLock"


],





// ============================================================
// INIT
// ============================================================


init(){


if(this.initialized)
return;



this.getSpreadsheet();


this.initialized=true;


Logger.log(
"SpreadsheetAdapter READY v"+
this.version
);


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


if(this._spreadsheet)
return this._spreadsheet;



const props=
PropertiesService.getScriptProperties();



const id=
props.getProperty(
"SPREADSHEET_ID"
);



try{


if(id){

this._spreadsheet=
SpreadsheetApp.openById(id);


}else{


this._spreadsheet=
SpreadsheetApp.getActiveSpreadsheet();


}



}

catch(e){


throw new Error(
"Spreadsheet connection failed: "+
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
// SHEETS
// ============================================================


getSheet(name){


const now=
Date.now();



if(
this._sheetCache[name]
&&
now-this._cacheTime[name]
<
this._cacheTTL
){

this._stats.cacheHit++;

return this._sheetCache[name];

}



this._stats.cacheMiss++;



const sheet=
this
.getSpreadsheet()
.getSheetByName(name);



if(sheet){

this._sheetCache[name]=sheet;

this._cacheTime[name]=now;


}



return sheet;


},




getOrCreateSheet(
name,
headers=[]
){


let sheet=
this.getSheet(name);



if(!sheet){


sheet=
this
.getSpreadsheet()
.insertSheet(name);



if(headers.length){

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


}


this.cacheSheet(sheet);


}



return sheet;


},




cacheSheet(sheet){


const name=
sheet.getName();



this._sheetCache[name]=sheet;

this._cacheTime[name]=Date.now();


},





exists(name){


return !!this.getSheet(name);


},




deleteSheet(name){


if(
this._protectedSheets
.includes(name)
){

throw new Error(
"Protected sheet cannot be deleted: "+
name
);


}



const sheet=
this.getSheet(name);



if(sheet){


this
.getSpreadsheet()
.deleteSheet(sheet);


delete this._sheetCache[name];

}



},





// ============================================================
// HEADERS
// ============================================================


getHeaders(sheet){


const name=
sheet.getName();



if(
this._headerCache[name]
){

return this._headerCache[name];

}



const last=
sheet.getLastColumn();



if(!last)
return [];



const headers=
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




getHeaderMap(sheet){


const headers=
this.getHeaders(sheet);



const map={};



headers.forEach(
(h,i)=>{


map[h]=i;


});


return map;


},





ensureHeaders(sheet,headers){


const current=
this.getHeaders(sheet);



const missing=
headers.filter(
h=>!current.includes(h)
);



if(missing.length){


sheet
.getRange(
1,
current.length+1,
1,
missing.length
)
.setValues([
missing
]);


delete this._headerCache[
sheet.getName()
];


}



return missing;


},




// ============================================================
// OBJECT CONVERSION
// ============================================================


rowToObject(
headers,
row
){


const obj={};



headers.forEach(
(h,i)=>{


if(h)
obj[h]=row[i];


});


return obj;


},





// ============================================================
// READ
// ============================================================


readObjects(sheetName){


const sheet=
this.getSheet(sheetName);



if(!sheet)
return [];



const values=
sheet
.getDataRange()
.getValues();



if(values.length<2)
return [];



const headers=
values[0];



return values
.slice(1)
.map(
row=>
this.rowToObject(
headers,
row
)
);


},





// ============================================================
// INSERT
// ============================================================


insert(
sheetName,
data
){


this._require();



const sheet=
this.getSheet(sheetName);



if(!sheet)
throw new Error(
"Sheet not found: "+
sheetName
);



const headers=
this.getHeaders(sheet);



const row=
headers.map(
h=>
data[h] ?? ""
);



sheet.appendRow(row);



this.invalidateIndexes(sheetName);



this._stats.insert++;



return data;


},




bulkInsert(
sheetName,
items
){


if(!items.length)
return [];



const sheet=
this.getSheet(sheetName);



const headers=
this.getHeaders(sheet);



const rows=
items.map(
item=>
headers.map(
h=>item[h] ?? ""
)
);



sheet
.getRange(
this.getLastRow(sheet)+1,
1,
rows.length,
headers.length
)
.setValues(rows);



this.invalidateIndexes(sheetName);



this._stats.bulkInsert++;



return items;


},





// ============================================================
// FIND
// ============================================================


find(
sheetName,
idField,
id
){


const row=
this.findRow(
sheetName,
idField,
id
);



if(!row)
return null;



const sheet=
this.getSheet(sheetName);



const headers=
this.getHeaders(sheet);



const values=
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





findRow(
sheetName,
field,
value
){


const index=
this.getIndex(
sheetName,
field
);



return index[
String(value)
] || null;


},





// ============================================================
// QUERY
// ============================================================


query(
sheetName,
filters={}
){


const rows=
this.readObjects(sheetName);



const result=
rows.filter(
row=>{


return Object.keys(filters)
.every(
key=>

String(row[key])
===
String(filters[key])

);


});


this._stats.query++;



return result;


},





// ============================================================
// UPDATE
// ============================================================


update(
sheetName,
idField,
id,
data
){


const row=
this.findRow(
sheetName,
idField,
id
);



if(!row){

throw new Error(
"Record not found: "+
id
);

}



const sheet=
this.getSheet(sheetName);



const headers=
this.getHeaders(sheet);



const current=
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

...data

};



sheet
.getRange(
row,
1,
1,
headers.length
)
.setValues([

headers.map(
h=>updated[h] ?? ""
)

]);



this.invalidateIndexes(sheetName);



this._stats.update++;



return updated;


},




// ============================================================
// DELETE
// ============================================================


delete(
sheetName,
idField,
id
){


const row=
this.findRow(
sheetName,
idField,
id
);



if(!row)
return false;



this
.getSheet(sheetName)
.deleteRow(row);



this.invalidateIndexes(sheetName);



this._stats.delete++;



return true;


},





// ============================================================
// INDEXES
// ============================================================


getIndex(
sheetName,
field
){


const key=
sheetName+"|"+field;



if(
this._indexCache[key]
){

return this._indexCache[key];

}



const sheet=
this.getSheet(sheetName);



const headers=
this.getHeaders(sheet);



const col=
headers.indexOf(field);



if(col===-1){

throw new Error(
"Index field missing: "+
field
);

}



const values=
sheet
.getDataRange()
.getValues();



const index={};



for(
let i=1;
i<values.length;
i++
){


const val=
values[i][col];



if(
val!=="" &&
val!==null &&
val!==undefined
){

index[String(val)]
=
i+1;


}


}



this._indexCache[key]=index;



return index;


},




invalidateIndexes(sheetName){


Object.keys(
this._indexCache
)
.forEach(
key=>{


if(
key.startsWith(
sheetName+"|"
)
)
delete this._indexCache[key];


});


},




// ============================================================
// TRANSACTION
// ============================================================


transaction(callback){


const lock=
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
// BATCH
// ============================================================


beginBatch(){


this._batchMode=true;

this._batchQueue=[];


},



commit(){


for(
const operation of this._batchQueue
){

operation();

}


this._batchQueue=[];

this._batchMode=false;


},



rollback(){


this._batchQueue=[];

this._batchMode=false;


},





// ============================================================
// CACHE
// ============================================================


clearCache(){


this._spreadsheet=null;

this._sheetCache={};

this._headerCache={};

this._indexCache={};


},





// ============================================================
// UTILITY
// ============================================================


getLastRow(sheet){


const row=
sheet.getLastRow();



return row<2
?
2
:
row+1;


},





// ============================================================
// DIAGNOSTICS
// ============================================================


health(){


const data={


version:this.version,

architecture:this.architecture,

initialized:this.initialized,

stats:this._stats


};



if(
typeof HealthContract!=="undefined"
){

return HealthContract.create(
"SpreadsheetAdapter",
"OK",
data
);


}



return {

module:"SpreadsheetAdapter",

status:"OK",

...data

};


},



diagnostics(){

return this.health();

}



};





globalThis.SpreadsheetAdapter=
SpreadsheetAdapter;



Logger.log(
"SpreadsheetAdapter REGISTERED v"+
SpreadsheetAdapter.version
);