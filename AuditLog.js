console.log("AuditLog");


const AuditLog = {


version:"0.1.0",

initialized:false,



// =========================
// INIT
// =========================

init(){


if(this.initialized){

return;

}



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






// =========================
// WRITE
// =========================

write(
action,
entity,
before,
after,
entityId=""
){


this.init();



const props =
PropertiesService
.getScriptProperties();



const log = {


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
before
||
null,



after:
after
||
null



};





const sheet =
SpreadsheetApp
.getActive()
.getSheetByName(
"AuditLog"
);



sheet.appendRow([


log.id,


log.timestamp,


log.organizationId,


log.userId,


log.role,


log.action,


log.entity,


log.entityId,


JSON.stringify(
log.before
),


JSON.stringify(
log.after
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



return log;


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
"AuditLog"
);



const values =
sheet
.getDataRange()
.getValues();



const headers =
values[0];



return values
.slice(1)
.map(row=>{


const obj={};


headers.forEach(
(h,i)=>{

obj[h]=row[i];

});


return obj;


})


.filter(obj=>

obj.Entity===entity
&&
String(obj.EntityID)
===
String(entityId)

);


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


sheet:
"AuditLog"

}


);


}


};


globalThis.AuditLog =
AuditLog;