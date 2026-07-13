console.log("Database");


const Database = {


version:"0.5.1",

initialized:false,





init(){


if(this.initialized){

return;

}


SchemaManager.init();


this.initialized=true;


Logger.log(
"Database READY"
);


},






sheet(name){


return SpreadsheetApp
.getActiveSpreadsheet()
.getSheetByName(name);


},






getSheetOrThrow(name){


const sheet =
this.sheet(name);



if(!sheet){


throw new Error(
"Sheet not found: " + name
);


}


return sheet;


},







// =========================
// INSERT
// =========================


insert(sheetName,data){


this.init();



const sheet =
this.getSheetOrThrow(sheetName);



const headers =
sheet
.getRange(
1,
1,
1,
sheet.getLastColumn()
)
.getValues()[0];



const idField =
SchemaRegistry.getIdField(sheetName);



const row =
headers.map(h=>{



if(h==="CreatedAt"){

return new Date();

}



if(h==="UpdatedAt"){

return new Date();

}



if(h==="Deleted"){

return false;

}




if(
h===idField &&
!data[h]
){


data[h] =
IdService.generate(
sheetName
);


}




return data[h] ?? "";



});





const nextRow =
sheet.getLastRow()+1;




sheet
.getRange(
nextRow,
1,
1,
row.length
)
.setValues(
[row]
);





Logger.log(

"INSERT "
+
sheetName
+
" ROW "
+
nextRow

);




return data;


},







// =========================
// FIND
// =========================


find(sheetName,id){


this.init();



const sheet =
this.getSheetOrThrow(sheetName);



const values =
sheet
.getDataRange()
.getValues();



const headers =
values[0];



const idField =
SchemaRegistry
.getIdField(sheetName);



const index =
headers.indexOf(idField);





if(index===-1){

throw new Error(
"ID FIELD NOT FOUND "
+
idField
);

}




for(
let i=1;
i<values.length;
i++
){



if(
String(values[i][index])
===
String(id)
){



const obj={};



headers.forEach(
(h,j)=>{

obj[h]=values[i][j];

}
);



return obj;


}


}




return null;


},







// =========================
// QUERY
// =========================


query(sheetName,filters={}){


this.init();



const sheet =
this.getSheetOrThrow(sheetName);



const values =
sheet
.getDataRange()
.getValues();



const headers =
values[0];



const currentOrg =
PropertiesService
.getScriptProperties()
.getProperty(
"CURRENT_ORG"
);




return values
.slice(1)
.map(row=>{


const obj={};



headers.forEach(
(h,i)=>{

obj[h]=row[i];

}
);



return obj;


})

.filter(obj=>{



if(
obj.OrganizationID &&
currentOrg &&
obj.OrganizationID!==currentOrg
){

return false;

}




return Object.keys(filters)
.every(
k=>
String(obj[k])
===
String(filters[k])
);



});



},







// =========================
// HEALTH
// =========================


health(){



return HealthContract.create(


"Database",


this.initialized
?
"OK"
:
"WARNING",


{


version:this.version,


spreadsheet:
SpreadsheetApp
.getActiveSpreadsheet()
.getName()


}


);



}




};





globalThis.Database =
Database;