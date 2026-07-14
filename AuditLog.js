console.log("AuditLog");


const AuditLog = {


version:"0.2.0",

initialized:false,

sheetName:"AuditLog",



// =========================
// INIT
// =========================

init(){


if(this.initialized){

return;

}


let sheet =
SpreadsheetApp
.getActive()
.getSheetByName(
this.sheetName
);



if(!sheet){


sheet =
SpreadsheetApp
.getActive()
.insertSheet(
this.sheetName
);


sheet.appendRow([

"ID",
"Timestamp",
"OrganizationID",
"UserID",
"Role",
"Action",
"Entity",
"EntityID",
"Before",
"After"

]);


Logger.log(
"AuditLog SHEET CREATED"
);


}



this.initialized=true;


Logger.log(
"AuditLog READY"
);


},




// =========================
// WRITE
// =========================


write(
action,
entity,
entityId,
before,
after
){


this.init();



const props =
PropertiesService
.getScriptProperties();



const record={


id:
Utilities.getUuid(),


timestamp:
new Date(),


organizationId:
props.getProperty(
"CURRENT_ORG"
)
||
"UNKNOWN",


userId:
props.getProperty(
"CURRENT_USER"
)
||
"SYSTEM",


role:
props.getProperty(
"CURRENT_ROLE"
)
||
"SYSTEM",


action,


entity,


entityId,


before:
before || null,


after:
after || null


};




const sheet =
SpreadsheetApp
.getActive()
.getSheetByName(
this.sheetName
);



sheet.appendRow([


record.id,

record.timestamp,

record.organizationId,

record.userId,

record.role,

record.action,

record.entity,

record.entityId,

JSON.stringify(
record.before
),

JSON.stringify(
record.after
)


]);



Logger.log(

"AUDIT "
+
action
+
" "
+
entity
+
" "
+
entityId

);



return record;


},




// =========================
// QUERY
// =========================


findByEntity(
entity,
entityId
){


this.init();


const sheet =
SpreadsheetApp
.getActive()
.getSheetByName(
this.sheetName
);



const values =
sheet
.getDataRange()
.getValues();



const headers =
values[0];



return values
.slice(1)
.filter(row=>{


return (

row[
headers.indexOf(
"Entity"
)
]
===
entity

&&

row[
headers.indexOf(
"EntityID"
)
]
===
entityId

);


})
.map(row=>{


const obj={};


headers.forEach(
(h,i)=>{


obj[h]=row[i];


});


return obj;


});


},




// =========================
// HEALTH
// =========================


health(){



return HealthContract.create(

"AuditLog",

this.initialized
?
"OK"
:
"WARNING",

{

version:this.version,

sheet:this.sheetName,

initialized:this.initialized


}

);


}



};



globalThis.AuditLog =
AuditLog;