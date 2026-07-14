console.log("AuditEventHandler");


const AuditEventHandler = {


version:"0.8.1",



registered:{},





init(){


try{


this.registerEntity(
EntityRegistry.CLIENT
);



Logger.log(
"AuditEventHandler READY"
);



return true;


}
catch(e){


Logger.log(
"AuditEventHandler ERROR: "
+
e.message
);


return false;


}


},







registerEntity(entity){



if(!entity){


Logger.log(
"AUDIT REGISTER FAILED: ENTITY NOT FOUND"
);


return false;

}





if(!entity.audit){


Logger.log(

"AUDIT SKIPPED ENTITY WITHOUT AUDIT CONFIG: "
+
entity.entity

);


return false;

}





if(
this.registered[
entity.entity
]
){


Logger.log(

"AUDIT ALREADY REGISTERED "
+
entity.entity

);


return true;

}





if(
!entity.events
){


Logger.log(

"AUDIT FAILED NO EVENTS CONFIG "
+
entity.entity

);


return false;

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



return true;


},







writeAudit(

action,

entity,

before,

after

){



if(!after){


Logger.log(

"AUDIT SKIPPED WITHOUT AFTER DATA "
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
after[
entity.idField
]

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