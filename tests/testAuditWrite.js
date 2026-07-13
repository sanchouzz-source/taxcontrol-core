function testAuditWrite(){


AuditLog.write(

"TEST",

"CLIENT",

{
Name:"Old Client"
},

{
Name:"New Client"
},

"CLI000021"

);


}