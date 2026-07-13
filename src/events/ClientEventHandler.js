console.log("ClientEventHandler");


const ClientEventHandler = {


version:"0.1.0",


init(){


EventBus.subscribe(
"CLIENT_CREATED",
this.onCreated
);


EventBus.subscribe(
"CLIENT_UPDATED",
this.onUpdated
);



Logger.log(
"ClientEventHandler READY"
);


},




onCreated(client){


Logger.log(
"CLIENT CREATED EVENT:"
+
client.ClientID
);



AuditLog.write(
"EVENT",
"CLIENT_CREATED",
null,
client
);



},





onUpdated(client){


Logger.log(
"CLIENT UPDATED EVENT:"
+
client.ClientID
);



AuditLog.write(
"EVENT",
"CLIENT_UPDATED",
null,
client
);



}



};



globalThis.ClientEventHandler =
ClientEventHandler;