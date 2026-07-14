console.log("AuditLog");


const AuditLog = {


version:"0.5.0",



init(){

    const sheet =
    SpreadsheetApp.getActive()
    .getSheetByName("AuditLog")
    ||
    SpreadsheetApp.getActive()
    .insertSheet("AuditLog");


    if(sheet.getLastRow() === 0){

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



const record = {


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
action.toUpperCase(),



Entity:
entity.toUpperCase(),



EntityID:
(
after &&
(after.ClientID ||
after.TripID ||
after.PaymentID ||
after.VehicleID)
)
||
(
before &&
(before.ClientID ||
before.TripID ||
before.PaymentID ||
before.VehicleID)
)
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
new Date().toISOString()


};




const sheet =
SpreadsheetApp
.getActive()
.getSheetByName("AuditLog");



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



return record;


},




test(entityId){


return this.write(

"TEST",

"CLIENT",

null,

{

ClientID:entityId,

Test:true

}

);


},




health(){


return HealthContract.create(

"AuditLog",

"OK",

{

version:this.version,

sheet:"AuditLog",

initialized:true

}

);


}



};



globalThis.AuditLog =
AuditLog;