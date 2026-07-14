console.log("AuditEventHandler");


const AuditEventHandler = {


version:"0.9.0",



registered:{},



initialized:false,





init(){



if(this.initialized){

Logger.log(
"AuditEventHandler ALREADY READY"
);

return true;

}



this.registerEntity(
EntityRegistry.CLIENT
);



this.initialized=true;



Logger.log(
"AuditEventHandler READY v"
+
this.version
);



return true;


},







registerEntity(entity){


if(!entity){

Logger.log(
"AUDIT ENTITY NOT FOUND"
);

return;

}



if(!entity.audit){

Logger.log(
"AUDIT SKIP "
+
entity.entity
);

return;

}




if(this.registered[entity.entity]){

Logger.log(
"AUDIT ALREADY REGISTERED "
+
entity.entity
);

return;

}






EventBus.subscribe(

entity.events.created,

event=>{

this.writeAudit(
ACTION_CREATE,
entity,
null,
event.after
);

}

);





EventBus.subscribe(

entity.events.updated,

event=>{

this.writeAudit(
ACTION_UPDATE,
entity,
event.before,
event.after
);

}

);





EventBus.subscribe(

entity.events.deleted,

event=>{

this.writeAudit(
ACTION_DELETE,
entity,
event.before,
event.after
);

}

);





EventBus.subscribe(

entity.events.restored,

event=>{

this.writeAudit(
ACTION_RESTORE,
entity,
event.before,
event.after
);

}

);






this.registered[
entity.entity
]=true;




Logger.log(

"AUDIT REGISTERED ENTITY "
+
entity.entity

);



},







writeAudit(

action,
entity,
before,
after

){


if(!after){

Logger.log(
"AUDIT WITHOUT AFTER "
+
entity.entity
);

return;

}




AuditLog.write(

action,

entity.entity,

before,

after

);





Logger.log(

"AUDIT "
+
action
+
" "
+
entity.entity
+
" "
+
after[entity.idField]

);



},








health(){


return HealthContract.create(

"AuditEventHandler",

"OK",

{


version:this.version,


registered:
Object.keys(
this.registered
)



}

);


}



};





globalThis.AuditEventHandler =
AuditEventHandler;