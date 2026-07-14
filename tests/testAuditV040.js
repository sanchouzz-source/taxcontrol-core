function testAuditV040(){


AuditLog.init();


const result =
AuditLog.write(

"CREATE",

"Client",

"CLI000021",

null,

{
Name:"Audit Test"
}

);


Logger.log(
JSON.stringify(result)
);



Logger.log(
JSON.stringify(
AuditLog.findByEntity(
"Client",
"CLI000021"
)
)
);



Logger.log(
JSON.stringify(
AuditLog.health()
)
);


}