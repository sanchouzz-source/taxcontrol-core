// ============================================================
// ERPTestDashboard v1.0.0
// TaxControl ERP
//
// Test result visualization
//
// Compatible:
// TestRunner v2.x
// SystemInit v2.6+
// ============================================================


console.log("ERPTestDashboard v1.0.0");



const ERPTestDashboard = {


version:"1.0.0",


sheetName:"ERP_TEST_DASHBOARD",




// ============================================================
// CREATE SHEET
// ============================================================


getSheet(){


const ss =
SpreadsheetApp.getActive();



let sheet =
ss.getSheetByName(
this.sheetName
);



if(!sheet){


sheet =
ss.insertSheet(
this.sheetName
);



this.createHeader(
sheet
);


}



return sheet;


},







// ============================================================
// HEADER
// ============================================================


createHeader(sheet){


sheet.appendRow([


"Дата",

"Время",

"Тест",

"Статус",

"Длительность ms",

"Ошибка",

"ERP Version"


]);



sheet.setFrozenRows(1);


},







// ============================================================
// SAVE RESULT
// ============================================================


save(result){


const sheet =
this.getSheet();



const now =
new Date();



const rows=[];



Object.entries(
result.tests || {}
)
.forEach(([name,test])=>{


rows.push([


Utilities.formatDate(
now,
Session.getScriptTimeZone(),
"yyyy-MM-dd"
),


Utilities.formatDate(
now,
Session.getScriptTimeZone(),
"HH:mm:ss"
),


name,


test.status,


test.duration || 0,


test.error || "",


SystemInit?.version || ""



]);


});





if(rows.length){


sheet
.getRange(

sheet.getLastRow()+1,

1,

rows.length,

7

)
.setValues(rows);


}



this.format(
sheet
);



return rows.length;


},







// ============================================================
// FORMAT
// ============================================================


format(sheet){


const last =
sheet.getLastRow();



if(last<2){
return;
}



sheet.autoResizeColumns(
1,
7
);



},







// ============================================================
// RUN TESTS + SAVE
// ============================================================


run(options={}){


const result =
TestRunner.runAll(
options
);



this.save(
result
);



return result;


},







// ============================================================
// REPORT
// ============================================================


summary(){


const sheet =
this.getSheet();



const data =
sheet.getDataRange()
.getValues();



const result={


tests:0,


passed:0,


failed:0,


lastRun:null


};



for(
let i=1;
i<data.length;
i++
){


result.tests++;



if(
data[i][3]==="PASS"
){

result.passed++;

}



if(
data[i][3]==="FAIL"
){

result.failed++;

}



result.lastRun =
data[i][0]+" "+
data[i][1];


}



result.successRate =
result.tests
?
Math.round(
result.passed /
result.tests *
100
)
:
0;



return result;


},







// ============================================================
// HEALTH
// ============================================================


health(){


return HealthContract.create(

"ERPTestDashboard",

"OK",

{


version:this.version,


sheet:this.sheetName,


summary:this.summary()


}

);


}



};






globalThis.ERPTestDashboard =
ERPTestDashboard;



Logger.log(
"ERPTestDashboard READY v"+
ERPTestDashboard.version
);