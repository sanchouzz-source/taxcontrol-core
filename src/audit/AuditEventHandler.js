console.log("AuditEventHandler");


const AuditEventHandler = {


name:"AuditEventHandler",


initialized:false,



// ======================
// INIT
// ======================

init(){


if(this.initialized){

return;

}



EventBus.on(
"CLIENT_CREATED",
payload=>{


AuditLog.write(

"CREATE",

"CLIENT",

null,

payload,

payload.ClientID

);


});




EventBus.on(
"CLIENT_UPDATED",
payload=>{


AuditLog.write(

"UPDATE",

"CLIENT",

payload.before,

payload.after,

payload.ClientID

);


});





EventBus.on(
"CLIENT_DELETED",
payload=>{


AuditLog.write(

"DELETE",

"CLIENT",

payload.before,

payload.after,

payload.ClientID

);


});





EventBus.on(
"CLIENT_RESTORED",
payload=>{


AuditLog.write(

"RESTORE",

"CLIENT",

payload.before,

payload.after,

payload.ClientID

);


});




this.initialized=true;



Logger.log(
"AuditEventHandler READY"
);


},





health(){


return HealthContract.create(

"AuditEventHandler",

this.initialized
?
"OK"
:
"WARNING",

{

version:"0.1.0"

}

);


}



};



globalThis.AuditEventHandler =
AuditEventHandler;