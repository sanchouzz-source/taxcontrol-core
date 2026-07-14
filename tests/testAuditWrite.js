function testAuditWrite(){


AuditLog.write(

"CREATE",

"Client",

"CLI000021",

null,

{
Name:"Test Client",
INN:"1111111111"
}

);


}