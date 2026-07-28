// ============================================================
// ERPControlDashboard v2.0.0
// TaxControl ERP Core
//
// Enterprise Runtime Dashboard
//
// Sheet:
//
// ERP_CONTROL_CENTER
//
// Compatible:
//
// ERPControlCenter v2+
// ERPDiagnostics v5+
// RepositoryHealthReport v2+
// RepositoryRegistry v2+
//
// ============================================================


console.log(
"ERPControlDashboard v2.0.0"
);



const ERPControlDashboard = {


// ============================================================
// META
// ============================================================


version:"2.0.0",

sheetName:
"ERP_CONTROL_CENTER",







// ============================================================
// OPEN
// ============================================================


open(){


const ss =
SpreadsheetApp
.getActiveSpreadsheet();



let sheet =
ss.getSheetByName(
this.sheetName
);



if(!sheet){


sheet =
ss.insertSheet(
this.sheetName
);


}



return sheet;


},







// ============================================================
// BUILD
// ============================================================


build(){


const sheet =
this.open();



sheet.clear();




const report =
this.collect();




let rows=[];



// ВСЕ СТРОКИ 3 КОЛОНКИ !!!

rows.push([
"TaxControl ERP Control Center",
"",
""
]);



rows.push([
"Версия ERP",
report.version,
""
]);



rows.push([
"Дата проверки",
report.timestamp,
""
]);



rows.push([
"Статус",
report.status,
""
]);



rows.push([
"Готовность",
report.readiness+"%",
""
]);



rows.push([
"",
"",
""
]);





rows.push([
"Компонент",
"Статус",
"Версия"
]);





Object.keys(
report.components
)
.forEach(name=>{


const item =
report.components[name];



rows.push([

name,

item.status || "-",

item.version || "-"

]);


});







// нормализация массива

rows =
rows.map(row=>{


while(row.length<3){

row.push("");

}


return row.slice(0,3);


});







sheet
.getRange(
1,
1,
rows.length,
3
)
.setValues(
rows
);






this.format(
sheet,
rows.length
);





return sheet;


},







// ============================================================
// COLLECT
// ============================================================


collect(){


if(
typeof ERPControlCenter==="undefined"
){

throw new Error(
"ERPControlCenter unavailable"
);

}



const center =
ERPControlCenter.run();





const components={};





this.extract(
components,
center.runtime
);



this.extract(
components,
center.system
);




this.extract(
components,
center.repositories
);



if(
typeof ERPDiagnostics!=="undefined"
){

components.ERPDiagnostics={


status:"AVAILABLE",


version:
ERPDiagnostics.version


};


}






return {


version:
ERPControlCenter.version,


timestamp:
center.timestamp,


status:
center.status || "UNKNOWN",


readiness:

center.readiness?.percent
||
0,



components


};



},







// ============================================================
// EXTRACT
// ============================================================


extract(target,obj){


if(!obj){

return;

}



Object.keys(obj)
.forEach(key=>{


const value =
obj[key];



if(
value &&
typeof value==="object"
){


target[key]={


status:
value.status ||
"UNKNOWN",



version:
value.version ||
"-"



};


}



});


},







// ============================================================
// FORMAT
// ============================================================


format(sheet,lastRow){



// Заголовок

sheet
.getRange(
1,
1,
1,
3
)
.merge();



sheet
.getRange(
1,
1
)
.setFontSize(16)
.setFontWeight("bold");





// Заголовок таблицы

sheet
.getRange(
7,
1,
1,
3
)
.setFontWeight(
"bold"
);




// Автоширина

sheet
.autoResizeColumns(
1,
3
);




// Закрепление

sheet
.setFrozenRows(
7
);




// Фильтр

if(lastRow>7){


sheet
.getRange(
7,
1,
lastRow-6,
3
)
.createFilter();


}



},







// ============================================================
// REFRESH
// ============================================================


refresh(){


return this.build();


},







// ============================================================
// MENU COMMAND
// ============================================================


openDashboard(){


return this.build();


},







// ============================================================
// HEALTH
// ============================================================


health(){


return HealthContract.create(

"ERPControlDashboard",

"OK",

{


version:this.version,

sheet:this.sheetName


}

);


}



};









// ============================================================
// GLOBAL
// ============================================================


globalThis.ERPControlDashboard =
ERPControlDashboard;







// ============================================================
// COMMAND
// ============================================================


function openERPControlDashboard(){


return ERPControlDashboard.build();


}







Logger.log(

"ERPControlDashboard READY v"+
ERPControlDashboard.version

);