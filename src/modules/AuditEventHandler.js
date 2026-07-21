console.log("AuditEventHandler v3.2");



const AuditEventHandler = {



version:"3.2.0",

ready:false,

processing:false,

subscriptions:[],





/*
=====================================
INIT
=====================================
*/


init(){


if(this.ready){


Logger.log(
"AuditEventHandler ALREADY READY"
);


return;


}





if(typeof EventBus==="undefined"){


throw new Error(
"AuditEventHandler: EventBus unavailable"
);


}





if(typeof EntityEvents==="undefined"){


throw new Error(
"AuditEventHandler: EntityEvents unavailable"
);


}







Logger.log(
"AUDIT EVENT HANDLER INIT START"
);







/*
Подписка на все ERP события
*/


EntityEvents.all()
.forEach(event=>{


const result =
EventBus.subscribe(


event,


this.onEvent.bind(this),


{

name:
"Audit_"+event

}


);




this.subscriptions.push({

event:event,

status:"ACTIVE"


});



});









this.ready=true;



Logger.log(
"AuditEventHandler READY v"+
this.version
);


Logger.log(
JSON.stringify(
this.subscriptions
)
);


},







/*
=====================================
EVENT HANDLER
=====================================
*/


onEvent(envelope){



if(this.processing){



Logger.debug(
"AUDIT SKIP REENTRY"
);



return;


}



this.processing=true;



try{



const entity =
envelope.entity;



if(!entity){



Logger.debug(
"AUDIT SKIP NO ENTITY"
);



return;


}






if(!this.shouldAudit(entity)){


return;


}






this.createAudit(envelope);





}



catch(error){



Logger.error(
"AUDIT ERROR "+
error.message
);



}



finally{


this.processing=false;


}




},







/*
=====================================
FILTER
=====================================
*/


shouldAudit(entity){


const ignored=[

"AUDIT",

"VERSION"

];


return !ignored.includes(entity);


},







/*
=====================================
WRITE AUDIT
=====================================
*/


createAudit(envelope){



const audit={


entity:
envelope.entity,


entityId:
envelope.entityId || "",


action:
this.resolveAction(
envelope.event
),



event:
envelope.event,



organizationId:
envelope.metadata?.organizationId
||
envelope.OrganizationID
||
"DEFAULT",



userId:
envelope.metadata?.userId
||
"SYSTEM",



source:
envelope.metadata?.source
||
"ERP",



before:
envelope.before || null,



after:
envelope.after || null,



timestamp:
envelope.timestamp
||
new Date().toISOString()


};







if(
typeof AuditLog!=="undefined"
&&
typeof AuditLog.write==="function"

){



AuditLog.write(audit);



Logger.debug(
"AUDIT SAVED "+
envelope.event
);



}

else{


Logger.warn(
"AuditLog unavailable"
);


}





},







/*
=====================================
ACTION
=====================================
*/


resolveAction(event){


if(event.includes("CREATED"))
return "CREATE";


if(event.includes("UPDATED"))
return "UPDATE";


if(event.includes("DELETED"))
return "DELETE";


if(event.includes("RESTORED"))
return "RESTORE";


return "SYSTEM";


},







/*
=====================================
HEALTH
=====================================
*/


health(){


return HealthContract.create(


"AuditEventHandler",


this.ready
?
"OK"
:
"WARNING",



{


version:this.version,


subscriptions:
this.subscriptions.length,


processing:
this.processing


}



);



}



};







globalThis.AuditEventHandler =
AuditEventHandler;



Logger.log(
"AuditEventHandler LOADED v3.2.0"
);