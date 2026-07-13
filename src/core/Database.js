console.log("Database");


const Database = {


version:"0.5.0",

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


const sheet=this.sheet(name);



if(!sheet){


throw new Error(
"Sheet not found: "+name
);


}


return sheet;


},






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





const row =
headers.map(h=>{


if(h==="CreatedAt")
return new Date();


if(h==="UpdatedAt")
return new Date();



if(h==="Deleted")
return false;



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
.setValues([row]);




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
SchemaRegistry.getIdField(sheetName);



const index =
headers.indexOf(idField);




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



let result={};



headers.forEach((h,j)=>{


result[h]=values[i][j];


});



return result;


}



}



return null;


},








query(sheetName,filters={}){


this.init();


const sheet =
this.getSheetOrThrow(sheetName);



const data =
sheet
.getDataRange()
.getValues();



const headers=data[0];



return data
.slice(1)
.map(row=>{


let obj={};


headers.forEach((h,i)=>{

obj[h]=row[i];

});


return obj;


})
.filter(obj=>{


return Object.keys(filters)
.every(
k=>
obj[k]==filters[k]
);


});



},







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