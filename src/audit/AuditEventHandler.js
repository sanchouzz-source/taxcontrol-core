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
event=>{
    
AuditLog.write(
"UPDATE",
"Client",
event.before,
event.after
);

});


EventBus.subscribe(
"CLIENT_DELETED",
event=>{

AuditLog.write(
"DELETE",
"Client",
data.before,
data.after
);


});



EventBus.subscribe(
"CLIENT_RESTORED",
(data)=>{


AuditLog.write(
"RESTORE",
"Client",
data.before,
data.after
);


});



console.log(
"AuditEventHandler READY"
);


return true;


}



};



globalThis.AuditEventHandler =
AuditEventHandler;