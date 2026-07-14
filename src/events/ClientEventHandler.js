const ClientEventHandler = {


init(){

EventBus.subscribe(
"CLIENT_CREATED",
this.onCreated
);


EventBus.subscribe(
"CLIENT_UPDATED",
this.onUpdated
);


EventBus.subscribe(
"CLIENT_DELETED",
this.onDeleted
);


EventBus.subscribe(
"CLIENT_RESTORED",
this.onRestored
);


console.log(
"ClientEventHandler READY"
);


},



onCreated(client){

console.log(
"CLIENT CREATED EVENT:",
client.ClientID
);

},



onUpdated(client){

console.log(
"CLIENT UPDATED EVENT:",
client.ClientID
);

AuditLog.write(
"UPDATE",
"Client",
null,
client
);

},



onDeleted(client){

console.log(
"CLIENT DELETED EVENT:",
client.ClientID
);

AuditLog.write(
"DELETE",
"Client",
client,
null
);

},



onRestored(client){

console.log(
"CLIENT RESTORED EVENT:",
client.ClientID
);

AuditLog.write(
"RESTORE",
"Client",
null,
client
);

}



};


globalThis.ClientEventHandler =
ClientEventHandler;