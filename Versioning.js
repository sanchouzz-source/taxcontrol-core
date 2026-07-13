console.log("Versioning");


const Versioning = {


version:"0.1.0",



// =========================
// SAVE VERSION
// =========================

save(entity,id,data){


const sheet =
this.getSheet();



const version = {


id:
Utilities.getUuid(),


timestamp:
new Date(),


organizationId:
PropertiesService
.getScriptProperties()
.getProperty(
"CURRENT_ORG"
)
||
"ORG000001",


entity:entity,


entityId:id,


snapshot:
JSON.stringify(data)



};



sheet.appendRow([


version.id,

version.timestamp,

version.organizationId,

version.entity,

version.entityId,

version.snapshot


]);



Logger.log(
"VERSION SAVED "
+
entity
+
" "
+
id
);



return version;


},





// =========================
// GET HISTORY
// =========================


get(entity,id){


const sheet =
this.getSheet();



const values =
sheet
.getDataRange()
.getValues();



if(values.length<=1){

return [];

}



return values
.slice(1)
.filter(row=>{


return String(row[3])===String(entity)
&&
String(row[4])===String(id);


})
.map(row=>{


return {


id:row[0],


timestamp:row[1],


organizationId:row[2],


entity:row[3],


entityId:row[4],


snapshot:
JSON.parse(row[5])


};


});



},





// =========================
// LAST VERSION
// =========================


last(entity,id){


const history =
this.get(entity,id);



if(history.length===0){

return null;

}



return history[
history.length-1
];


},





// =========================
// SHEET
// =========================


getSheet(){


const ss =
SpreadsheetApp
.getActive();



let sheet =
ss.getSheetByName(
"Versions"
);



if(!sheet){


sheet =
ss.insertSheet(
"Versions"
);



sheet
.getRange(
1,
1,
1,
6
)
.setValues([

[
"VersionID",
"Timestamp",
"OrganizationID",
"Entity",
"EntityID",
"Snapshot"
]

]);


}



return sheet;


},





// =========================
// HEALTH
// =========================


health(){


return HealthContract.create(

"Versioning",

"OK",

{

version:this.version

}

);


}



};



globalThis.Versioning =
Versioning;