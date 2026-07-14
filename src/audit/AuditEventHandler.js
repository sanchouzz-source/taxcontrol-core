console.log("AuditEventHandler");


const AuditEventHandler = {


version:"0.7.0",



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



if(!entity.audit){

return;

}





EventBus.subscribe(

entity.events.created,

(event)=>{


AuditLog.write(

"CREATE",

entity.entity,

null,

event.after

);



Logger.log(

"AUDIT CREATE "
+
entity.entity
+
" "
+
event.after[entity.idField]

);


}

);








EventBus.subscribe(

entity.events.updated,

(event)=>{


AuditLog.write(

"UPDATE",

entity.entity,

event.before,

event.after

);



Logger.log(

"AUDIT UPDATE "
+
entity.entity
+
" "
+
event.after[entity.idField]

);



}

);








EventBus.subscribe(

entity.events.deleted,

(event)=>{


AuditLog.write(

"DELETE",

entity.entity,

event.before,

event.after

);



Logger.log(

"AUDIT DELETE "
+
entity.entity
+
" "
+
event.after[entity.idField]

);



}

);








EventBus.subscribe(

entity.events.restored,

(event)=>{


AuditLog.write(

"RESTORE",

entity.entity,

event.before,

event.after

);



Logger.log(

"AUDIT RESTORE "
+
entity.entity
+
" "
+
event.after[entity.idField]

);



}

);



Logger.log(

"AUDIT REGISTERED ENTITY "
+
entity.entity

);


},








health(){


return HealthContract.create(

"AuditEventHandler",

"OK",

{


version:this.version,


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