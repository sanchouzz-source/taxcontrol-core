console.log("AuditEventHandler");


const AuditEventHandler = {


version:"0.6.0",



init(){


EventBus.subscribe(
EntityEvents.CLIENT.CREATED,
(event)=>{


AuditLog.write(
"CREATE",
"CLIENT",
null,
event.after
);


Logger.log(
"AUDIT CREATE CLIENT "
+
event.after.ClientID
);


}

);





EventBus.subscribe(
EntityEvents.CLIENT.UPDATED,
(event)=>{


AuditLog.write(
"UPDATE",
"CLIENT",
event.before,
event.after
);


Logger.log(
"AUDIT UPDATE CLIENT "
+
event.after.ClientID
);


}

);





EventBus.subscribe(
EntityEvents.CLIENT.DELETED,
(event)=>{


AuditLog.write(
"DELETE",
"CLIENT",
event.before,
event.after
);


Logger.log(
"AUDIT DELETE CLIENT "
+
event.after.ClientID
);


}

);





EventBus.subscribe(
EntityEvents.CLIENT.RESTORED,
(event)=>{


AuditLog.write(
"RESTORE",
"CLIENT",
event.before,
event.after
);


Logger.log(
"AUDIT RESTORE CLIENT "
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