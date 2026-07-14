console.log("AuditEventHandler");


const AuditEventHandler = {


version:"0.5.0",



init(){


EventBus.subscribe(
"CLIENT_CREATED",
(event)=>{


Logger.log(
"AUDIT EVENT CLIENT_CREATED"
);



AuditLog.write(
"CREATE",
"CLIENT",
null,
event.after
);



Logger.log(
"AUDIT CREATE Client "
+
event.after.ClientID
);



}

);





EventBus.subscribe(
"CLIENT_UPDATED",
(event)=>{


AuditLog.write(
"UPDATE",
"CLIENT",
event.before,
event.after
);


Logger.log(
"AUDIT UPDATE Client "
+
event.after.ClientID
);


}

);





EventBus.subscribe(
"CLIENT_DELETED",
(event)=>{


AuditLog.write(
"DELETE",
"CLIENT",
event.before,
event.after
);


Logger.log(
"AUDIT DELETE Client "
+
event.after.ClientID
);


}

);





EventBus.subscribe(
"CLIENT_RESTORED",
(event)=>{


AuditLog.write(
"RESTORE",
"CLIENT",
event.before,
event.after
);



Logger.log(
"AUDIT RESTORE Client "
+
event.after.ClientID
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