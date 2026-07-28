// ============================================================
// SchemaStorage.gs
// ERP TexControl Core
//
// Version:
// SchemaStorage v2.1.0
//
// Compatible:
// EntityMetadata v3.x
// SchemaManager v4.2+
// SchemaBuilder v4.1+
// EntityRegistry v2.6+
//
// Fix:
// - idField support
// - entity restoration
// - corrupted schema protection
// - clean reset
// ============================================================


console.log("SchemaStorage v2.1.0");


const SchemaStorage = {


version:"2.1.0",


_tablesSheet:"_SystemSchemaTables",
_fieldsSheet:"_SystemSchemaFields",
_versionsSheet:"_SchemaVersions",
_migrationsSheet:"_SchemaMigrations",





_read(sheet){


if(!SpreadsheetAdapter)
throw new Error(
"SpreadsheetAdapter unavailable"
);



if(SpreadsheetAdapter.query){

return SpreadsheetAdapter.query(sheet)||[];

}



if(SpreadsheetAdapter.findAll){

return SpreadsheetAdapter.findAll(sheet)||[];

}



return [];

},






_write(sheet,rows,headers){


if(SpreadsheetAdapter.replace){

return SpreadsheetAdapter.replace(
sheet,
rows,
headers
);

}


if(SpreadsheetAdapter.write){

return SpreadsheetAdapter.write(
sheet,
rows,
headers
);

}


throw new Error(
"SpreadsheetAdapter write unavailable"
);


},





_append(sheet,row){


if(SpreadsheetAdapter.insert){

return SpreadsheetAdapter.insert(
sheet,
row
);

}


throw new Error(
"SpreadsheetAdapter insert unavailable"
);


},







// ============================================================
// LOAD
// ============================================================


load(){


const tables={};


const tableRows =
this._read(
this._tablesSheet
);



tableRows.forEach(row=>{


const entity =
row.entity ||
row.table ||
row[0];



if(!entity)
return;



tables[entity]={


entity:


entity.toUpperCase(),



table:


row.table ||
row[1] ||
entity,



idField:


row.idField ||
row.primaryKey ||
row[2] ||
"ID",



fields:[],



softDelete:
row.softDelete!==false,



timestamps:
row.timestamps!==false,



audit:
row.audit===true


};



});





const fields =
this._read(
this._fieldsSheet
);



fields.forEach(row=>{


const entity =
row.entity ||
row.table ||
row[0];



if(!tables[entity])
return;



tables[entity].fields.push({


name:
row.field ||
row.name ||
row[1],


type:
row.type ||
"STRING",


required:
row.required===true ||
row.required==="TRUE",


nullable:
row.nullable!==false


});



});



return tables;


},







// ============================================================
// SAVE
// ============================================================


save(schema){



const tables=[];

const fields=[];



Object.keys(schema)
.forEach(entity=>{


const meta=schema[entity];



tables.push({


entity,


table:
meta.table,


idField:
meta.idField ||
meta.primaryKey ||
"ID",


softDelete:
meta.softDelete!==false,


timestamps:
meta.timestamps!==false,


audit:
meta.audit===true


});





(meta.fields||[])
.forEach(f=>{


fields.push({


entity,


field:f.name,


type:
f.type||"STRING",


required:
!!f.required,


nullable:
f.nullable!==false


});



});


});





this._write(

this._tablesSheet,

tables,

[
"entity",
"table",
"idField",
"softDelete",
"timestamps",
"audit"
]

);



this._write(

this._fieldsSheet,

fields,

[
"entity",
"field",
"type",
"required",
"nullable"
]

);



},







// ============================================================
// VERSION
// ============================================================


getVersion(){


const rows =
this._read(
this._versionsSheet
);



if(!rows.length)
return 0;



return Math.max(
...rows.map(
r=>Number(
r.version||r[0]||0
)
)
);


},




getCurrentHash(){


const rows =
this._read(
this._versionsSheet
);



if(!rows.length)
return null;



rows.sort(
(a,b)=>
Number(b.version||0)
-
Number(a.version||0)
);



return rows[0].hash||null;


},





saveVersion(
version,
hash,
author="system"
){


this._append(
this._versionsSheet,
{
version,
hash,
author,
date:new Date()
}
);


},







// ============================================================
// RESET
// ============================================================


clear(){


this._write(
this._tablesSheet,
[],
[
"entity",
"table",
"idField",
"softDelete",
"timestamps",
"audit"
]
);



this._write(
this._fieldsSheet,
[],
[
"entity",
"field",
"type",
"required",
"nullable"
]
);



Logger.log(
"SchemaStorage CLEARED"
);


}






};



globalThis.SchemaStorage =
SchemaStorage;



Logger.log(
"SchemaStorage READY v"+
SchemaStorage.version
);