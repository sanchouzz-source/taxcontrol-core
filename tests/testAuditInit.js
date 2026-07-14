function testAuditInit(){

AuditLog.init();

Logger.log(
JSON.stringify(
AuditLog.health()
)
);

}