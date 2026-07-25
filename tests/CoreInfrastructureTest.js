// ============================================================
// CoreInfrastructureTest.gs v1.0.0
//
// TaxControl ERP Core
//
// Infrastructure validation
//
// Tests:
// SpreadsheetAdapter
// Database
// BaseRepository
// ============================================================


console.log("CoreInfrastructureTest v1.0.0");



const CoreInfrastructureTest = {


version:"1.0.0",


TEST_SHEET:"__TEST_DATABASE",



// ============================================================
// RUN ALL
// ============================================================


run(){


Logger.log(
"========== CORE TEST START =========="
);



const result={};



try{


result.health =
this.testHealth();



result.sheet =
this.testSheet();



result.insert =
this.testInsert();



result.find =
this.testFind();



result.update =
this.testUpdate();



result.query =
this.testQuery();



result.bulk =
this.testBulk();



result.transaction =
this.testTransaction();



result.delete =
this.testDelete();



result.status="PASSED";



}

catch(e){


result.status="FAILED";

result.error=e.message;


Logger.error(
"CORE TEST FAILED "+
e.message
);


}




Logger.log(
JSON.stringify(
result,
null,
2
)
);



return result;


},





// ============================================================
// HEALTH
// ============================================================


testHealth(){


Logger.log(
"TEST HEALTH"
);



return {


SpreadsheetAdapter:
SpreadsheetAdapter.health(),


Database:
typeof Database!=="undefined"
?
Database.health()
:
"NOT FOUND",



BaseRepository:
typeof BaseRepository!=="undefined"
?
BaseRepository.health()
:
"NOT FOUND"



};


},





// ============================================================
// CREATE TEST SHEET
// ============================================================


testSheet(){


Logger.log(
"TEST SHEET"
);



const sheet =
SpreadsheetAdapter
.getOrCreateSheet(

this.TEST_SHEET,

[

"TestID",

"Name",

"Value",

"CreatedAt"

]

);



SpreadsheetAdapter.clearCache();



return {

name:
sheet.getName(),

headers:
SpreadsheetAdapter.getHeaders(sheet)

};


},





// ============================================================
// INSERT
// ============================================================


testInsert(){


Logger.log(
"TEST INSERT"
);



const data={


TestID:
"TEST-001",


Name:
"First record",


Value:
100,


CreatedAt:
new Date()

};



SpreadsheetAdapter.insert(

this.TEST_SHEET,

data

);



const rows=
SpreadsheetAdapter.readObjects(
this.TEST_SHEET
);



if(rows.length!==1){

throw new Error(
"Insert failed"
);

}



return rows[0];


},





// ============================================================
// FIND
// ============================================================


testFind(){


Logger.log(
"TEST FIND"
);



const row =
SpreadsheetAdapter.find(

this.TEST_SHEET,

"TestID",

"TEST-001"

);



if(!row){

throw new Error(
"Find failed"
);

}



return row;


},





// ============================================================
// UPDATE
// ============================================================


testUpdate(){


Logger.log(
"TEST UPDATE"
);



const result=
SpreadsheetAdapter.update(

this.TEST_SHEET,

"TestID",

"TEST-001",

{

Value:500

}

);



if(
result.Value!=500
){

throw new Error(
"Update failed"
);

}



return result;


},





// ============================================================
// QUERY
// ============================================================


testQuery(){


Logger.log(
"TEST QUERY"
);



const rows =
SpreadsheetAdapter.query(

this.TEST_SHEET,

{

Value:500

}

);



if(
rows.length!==1
){

throw new Error(
"Query failed"
);

}



return rows;


},





// ============================================================
// BULK
// ============================================================


testBulk(){


Logger.log(
"TEST BULK INSERT"
);



const items=[


{

TestID:"TEST-002",

Name:"Second",

Value:200,

CreatedAt:new Date()

},


{

TestID:"TEST-003",

Name:"Third",

Value:300,

CreatedAt:new Date()

}


];



SpreadsheetAdapter.bulkInsert(

this.TEST_SHEET,

items

);



const rows =
SpreadsheetAdapter.readObjects(
this.TEST_SHEET
);



if(
rows.length!==3
){

throw new Error(
"Bulk insert failed"
);

}



return rows.length;


},





// ============================================================
// TRANSACTION
// ============================================================


testTransaction(){


Logger.log(
"TEST TRANSACTION"
);



let executed=false;



SpreadsheetAdapter.transaction(

()=>{


executed=true;


}

);



if(!executed){

throw new Error(
"Transaction failed"
);

}



return "OK";


},





// ============================================================
// DELETE
// ============================================================


testDelete(){


Logger.log(
"TEST DELETE"
);



SpreadsheetAdapter.delete(

this.TEST_SHEET,

"TestID",

"TEST-003"

);



const row=
SpreadsheetAdapter.find(

this.TEST_SHEET,

"TestID",

"TEST-003"

);



if(row){

throw new Error(
"Delete failed"
);

}



return "DELETED";


},





// ============================================================
// CLEAN
// ============================================================


cleanup(){


Logger.log(
"CLEAN TEST DATA"
);



const sheet =
SpreadsheetAdapter
.getSheet(
this.TEST_SHEET
);



if(sheet){


SpreadsheetAdapter
.getSpreadsheet()
.deleteSheet(sheet);


}



SpreadsheetAdapter.clearCache();



return "CLEANED";


}



};




globalThis.CoreInfrastructureTest =
CoreInfrastructureTest;



Logger.log(
"CoreInfrastructureTest READY"
);