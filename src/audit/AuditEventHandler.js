console.log("AuditEventHandler");


const AuditEventHandler = {


version:"0.8.0",



registered:{},





init(){


this.registerEntity(
EntityRegistry.CLIENT
);



console.log(
"AuditEventHandler READY"
);



return true;


},







registerEntity(entity){



if(!entity){

Logger.warn(
"AUDIT REGISTER FAILED: ENTITY NOT FOUND"
);

return;

}



if(!entity.audit){

Logger.warn(
"AUDIT SKIPPED ENTITY WITHOUT AUDIT CONFIG: "
+
entity.entity

);

return;

}



if(
this.registered[entity.entity]
){

Logger.log(
"AUDIT ALREADY REGISTERED "
+
entity.entity
);

return;

}




EventBus.subscribe(

entity.events.created,

(event)=>{


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

(event)=>{


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

(event)=>{


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

(event)=>{


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

Logger.warn(
"AUDIT EVENT WITHOUT AFTER DATA "
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


registeredEntities:
Object.keys(
this.registered
),



dependencies:{


EventBus:!!EventBus,


AuditLog:!!AuditLog,


EntityRegistry:!!EntityRegistry


}


}

);


}



};





globalThis.AuditEventHandler =
AuditEventHandler;