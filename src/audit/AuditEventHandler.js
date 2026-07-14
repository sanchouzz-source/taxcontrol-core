console.log("AuditEventHandler");


const AuditEventHandler = {


version:"0.4.0",


init(){


EventBus.subscribe(
"CLIENT_CREATED",
(data)=>{

Logger.log(
"AUDIT EVENT CLIENT_CREATED"
);


AuditLog.write(
"CREATE",
"Client",
null,
data
);


Logger.log(
"AUDIT CREATE Client "
+
data.ClientID
);


}
);



EventBus.subscribe(
"CLIENT_UPDATED",
(data)=>{


AuditLog.write(
"UPDATE",
"Client",
null,
data
);


Logger.log(
"AUDIT UPDATE Client "
+
data.ClientID
);


}
);



EventBus.subscribe(
"CLIENT_DELETED",
(data)=>{


AuditLog.write(
"DELETE",
"Client",
null,
data
);


}
);



EventBus.subscribe(
"CLIENT_RESTORED",
(data)=>{


AuditLog.write(
"RESTORE",
"Client",
null,
data
);


}
);



console.log(
"AuditEventHandler READY"
);


return true;


}



};



globalThis.AuditEventHandler =
AuditEventHandler;