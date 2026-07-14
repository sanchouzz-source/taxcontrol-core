const AuditLog = {


version:"0.4.0",

initialized:false,

sheetName:"AuditLog",



// =======================
// INIT
// =======================

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



const headers=[

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



this.initialized=true;



Logger.log(
"AuditLog READY"
);



},





// =======================
// WRITE
// =======================

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



const row=[


Utilities.getUuid(),


new Date(),


props.getProperty(
"CURRENT_ORG"
)
||
"UNKNOWN",


props.getProperty(
"CURRENT_USER"
)
||
"SYSTEM",


props.getProperty(
"CURRENT_ROLE"
)
||
"SYSTEM",


action,


entity,


entityId
||
"",


JSON.stringify(
before || null
),


JSON.stringify(
after || null
)


];





SpreadsheetApp
.getActive()
.getSheetByName(
this.sheetName
)
.appendRow(
row
);




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
(entityId || "")

);



return {

action,
entity,
entityId

};



},





// =======================
// READ
// =======================

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



const data =
sheet
.getDataRange()
.getValues();



const headers =
data[0];



return data
.slice(1)
.filter(row=>{


return (

row[6]===entity
&&
row[7]===entityId

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





// =======================
// HEALTH
// =======================


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