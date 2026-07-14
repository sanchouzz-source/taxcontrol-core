function testAuditMigration(){

const sheet =
SpreadsheetApp
.getActive()
.getSheetByName(
"AuditLog"
);


sheet.clear();


AuditLog.init();


const client =
{
ClientID:"CLI000021",
Name:"Audit Test"
};


AuditLog.write(
"CREATE",
"Client",
"CLI000021",
null,
client
);



Logger.log(
JSON.stringify(
AuditLog.findByEntity(
"Client",
"CLI000021"
)
)
);


}