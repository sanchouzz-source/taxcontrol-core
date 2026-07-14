console.log("AuditLog");


const AuditLog = {


version:"0.4.0",



init(){


const ss =
SpreadsheetApp.getActive();


let sheet =
ss.getSheetByName(
"AuditLog"
);



if(!sheet){


sheet =
ss.insertSheet(
"AuditLog"
);


sheet.appendRow([

"AuditID",
"OrganizationID",
"UserID",
"Role",
"Action",
"Entity",
"EntityID",
"Before",
"After",
"CreatedAt"

]);


}



console.log(
"AuditLog READY"
);



return HealthContract.create(

"AuditLog",

"OK",

{

version:this.version,

sheet:"AuditLog",

initialized:true

}

);



},





write(
action,
entity,
before,
after
){



const props =
PropertiesService
.getScriptProperties();



const row = {


AuditID:
Utilities.getUuid(),


OrganizationID:
props.getProperty(
"CURRENT_ORG"
)
||
"ORG000001",



UserID:
props.getProperty(
"CURRENT_USER"
)
||
"SYSTEM",



Role:
props.getProperty(
"CURRENT_ROLE"
)
||
"SYSTEM",



Action:
action,



Entity:
entity,



EntityID:
after?.ClientID
||
before?.ClientID
||
"",



Before:
before
?
JSON.stringify(before)
:
"",



After:
after
?
JSON.stringify(after)
:
"",



CreatedAt:
new Date()

};




const sheet =
SpreadsheetApp
.getActive()
.getSheetByName(
"AuditLog"
);



sheet.appendRow([

row.AuditID,

row.OrganizationID,

row.UserID,

row.Role,

row.Action,

row.Entity,

row.EntityID,

row.Before,

row.After,

row.CreatedAt


]);



return row;



}



};



globalThis.AuditLog =
AuditLog;