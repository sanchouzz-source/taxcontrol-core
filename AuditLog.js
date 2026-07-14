const AuditLog = {


version:"0.3.0",

initialized:false,

sheetName:"AuditLog",



// ===============================
// INIT
// ===============================

init(){


if(this.initialized){
    return;
}



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

}



if(sheet.getLastRow()===0){


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


}



this.initialized=true;


Logger.log(
"AuditLog READY"
);


},




// ===============================
// WRITE
// ===============================


write(
action,
entity,
entityId,
before,
after
){


this.init();



try{


const props =
PropertiesService
.getScriptProperties();



const log={


ID:
Utilities.getUuid(),


Timestamp:
new Date(),



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
entityId
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
""



};





const sheet =
SpreadsheetApp
.getActive()
.getSheetByName(
this.sheetName
);




sheet.appendRow([

log.ID,

log.Timestamp,

log.OrganizationID,

log.UserID,

log.Role,

log.Action,

log.Entity,

log.EntityID,

log.Before,

log.After

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




return log;



}
catch(e){


Logger.log(
"AUDIT ERROR "
+
e.message
);


return null;


}


},






// ===============================
// HEALTH
// ===============================


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