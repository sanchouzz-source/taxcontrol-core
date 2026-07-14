const AuditLog = {


version:"0.5.0",

initialized:false,


init(){


if(this.initialized){
return;
}


this.ensureSheet();


this.initialized=true;


Logger.log(
"AuditLog READY"
);


},



ensureSheet(){


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

}



const headers=[

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

];



if(
sheet.getLastRow()===0
){


sheet
.getRange(
1,
1,
1,
headers.length
)
.setValues(
[headers]
);


}



},





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


AuditID:
Utilities.getUuid(),


OrganizationID:
props.getProperty(
"CURRENT_ORG"
)
||
"UNKNOWN",



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
entityId || "",



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

record.AuditID,

record.OrganizationID,

record.UserID,

record.Role,

record.Action,

record.Entity,

record.EntityID,

record.Before,

record.After,

record.CreatedAt

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



const data =
sheet
.getDataRange()
.getValues();



const headers =
data[0];



return data
.slice(1)
.filter(row=>{


const obj={};


headers.forEach(
(h,i)=>{
obj[h]=row[i];
}
);



return (
obj.Entity===entity
&&
String(obj.EntityID)
===
String(entityId)
);


})
.map(row=>{


const obj={};


headers.forEach(
(h,i)=>{
obj[h]=row[i];
}
);


return obj;


});



},





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


sheet:"AuditLog",


initialized:this.initialized


}


);


}


};



globalThis.AuditLog =
AuditLog;