const AuditEventHandler = {


version:"0.2.0",


init(){


EventBus.subscribe(
"CLIENT_CREATED",
this.clientCreated.bind(this)
);


EventBus.subscribe(
"CLIENT_UPDATED",
this.clientUpdated.bind(this)
);


EventBus.subscribe(
"CLIENT_DELETED",
this.clientDeleted.bind(this)
);


EventBus.subscribe(
"CLIENT_RESTORED",
this.clientRestored.bind(this)
);



Logger.log(
"AuditEventHandler READY"
);


},



clientCreated(payload){


AuditLog.write(

"CREATE",

"Client",

payload.ClientID,

null,

payload

);


},




clientUpdated(payload){


AuditLog.write(

"UPDATE",

"Client",

payload.id,

payload.before,

payload.after

);


},




clientDeleted(payload){


AuditLog.write(

"DELETE",

"Client",

payload.ClientID,

payload.before,

payload.after

);


},




clientRestored(payload){


AuditLog.write(

"RESTORE",

"Client",

payload.ClientID,

payload.before,

payload.after

);


}



};


globalThis.AuditEventHandler =
AuditEventHandler;