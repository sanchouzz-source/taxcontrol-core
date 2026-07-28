// ============================================================
// ERPControlDashboard v1.0.0
// TaxControl ERP Core
//
// Enterprise Runtime Dashboard
//
// Creates:
//
// Sheet:
// ERP_CONTROL_CENTER
//
// Uses:
//
// ERPControlCenter v2+
// ERPDiagnostics
// RepositoryHealthReport
//
// ============================================================


console.log(
"ERPControlDashboard v1.0.0"
);



const ERPControlDashboard = {



version:"1.0.0",


sheetName:
"ERP_CONTROL_CENTER",






// ============================================================
// OPEN SHEET
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



ss.setActiveSheet(
sheet
);



return sheet;


},







// ============================================================
// BUILD DASHBOARD
// ============================================================


build(){


const sheet =
this.open();



sheet.clear();





const report =
this.collect();





let rows=[];



rows.push([
"TaxControl ERP Control Center"
]);



rows.push([
"Version",
report.version
]);



rows.push([
"Дата проверки",
report.timestamp
]);



rows.push([
"Статус ERP",
report.status
]);



rows.push([
"Готовность",
report.readiness+"%"
]);



rows.push([
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
// COLLECT DATA
// ============================================================


collect(){



let center;



if(
typeof ERPControlCenter!=="undefined"
){


center =
ERPControlCenter.run(
{
skipCoreTest:true
}
);


}
else{


throw new Error(
"ERPControlCenter unavailable"
);


}





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
center.bootstrap
);





return {


version:
ERPControlCenter.version,


timestamp:
center.timestamp,


status:
center.status,


readiness:

center.readiness?.percent
||
0,



components


};



},







// ============================================================
// EXTRACT COMPONENTS
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
.setFontSize(
16
);



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



sheet
.autoResizeColumns(
1,
3
);



sheet
.setFrozenRows(
7
);



},







// ============================================================
// REFRESH
// ============================================================


refresh(){


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





Logger.log(
"ERPControlDashboard READY v"+
ERPControlDashboard.version
);