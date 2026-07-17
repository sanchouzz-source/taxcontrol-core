console.log("AuditEventHandler");


const AuditEventHandler = {


version:"1.2.0",


init(){


if(this.ready){
return;
}


this.subscribe();


this.ready=true;


Logger.log(
"AuditEventHandler READY v"
+
this.version
);


},





subscribe(){


EventBus.subscribe(
EntityEvents.CREATED,
event=>this.handle(
"CREATE",
event
)
);


EventBus.subscribe(
EntityEvents.UPDATED,
event=>this.handle(
"UPDATE",
event
)
);


EventBus.subscribe(
EntityEvents.DELETED,
event=>this.handle(
"DELETE",
event
)
);


EventBus.subscribe(
EntityEvents.RESTORED,
event=>this.handle(
"RESTORE",
event
)
);


},







handle(
action,
event
){


try{


const audit={


AuditID:
IdService.generate(
"AUDIT"
),


Entity:
event.entity
||
event.Entity
||
"UNKNOWN",


EntityID:
event.id
||
event.entityId
||
"",


Action:
action,


UserID:
(
typeof UserSession!=="undefined"
&&
UserSession.current
)
?
UserSession.current.UserID
:
"SYSTEM",


CreatedAt:
new Date().toISOString(),


Before:
event.before
||
null,


After:
event.after
||
event.data
||
null


};




AuditLog.write(
audit
);



Logger.log(

"AUDIT "
+
action
+
" "
+
audit.Entity
+
" "
+
audit.EntityID

);



}
catch(e){


Logger.log(

"AUDIT ERROR: "
+
e.message

);


}



}



};




globalThis.AuditEventHandler =
AuditEventHandler;