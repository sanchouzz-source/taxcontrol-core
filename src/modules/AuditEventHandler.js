console.log("AuditEventHandler v3.3");


const AuditEventHandler = {

version:"3.3.0",

ready:false,

processing:false,

subscriptions:[],


init(){

    if(this.ready){
        Logger.log(
        "AuditEventHandler ALREADY READY");
        return;
    }


    if(typeof EventBus==="undefined"){
        throw new Error(
        "AuditEventHandler: EventBus unavailable");
    }


    this.registerEntityEvents();


    this.ready=true;


    Logger.log(
    "AuditEventHandler READY v"+
    this.version+
    " SUBS="+
    this.subscriptions.length);

},



registerEntityEvents(){

    const entities =
    Object.keys(EntityEvents);


    entities.forEach(entity=>{


        const events =
        EntityEvents[entity];


        Object.keys(events)
        .forEach(action=>{


            const eventName =
            events[action];


            const handler =
            this.onEvent.bind(this);


            EventBus.subscribe(
                eventName,
                handler,
                {
                    name:
                    "Audit_"+eventName
                }
            );


            this.subscriptions.push(
            eventName);

        });


    });

},




onEvent(event){


    if(this.processing)
        return;


    this.processing=true;


    try{


        if(!event)
            return;


        const entity =
        event.entity ||
        this.resolveEntity(event.event);



        if(!entity)
            return;



        if(
        entity==="AUDIT" ||
        entity==="VERSION")
            return;



        this.createAudit(event);



    }
    catch(e){

        Logger.error(
        "AUDIT ERROR "+
        e.message);

    }
    finally{

        this.processing=false;

    }

},




resolveEntity(eventName){


    for(
    const entity in EntityEvents)
    {


        const events =
        EntityEvents[entity];


        for(
        const key in events)
        {


            if(
            events[key]===eventName)
                return entity;


        }

    }


    return null;

},




createAudit(event){


const data={


entity:
event.entity ||
this.resolveEntity(event.event),


entityId:
event.entityId || "",


action:
this.resolveAction(event.event),


event:
event.event,


timestamp:
event.timestamp ||
new Date().toISOString(),


before:
event.before || null,


after:
event.after || null,


source:
"ERP"


};



if(
typeof AuditLog!=="undefined" &&
AuditLog.write)
{

AuditLog.write(data);

}

},




resolveAction(name){


if(name.includes("CREATED"))
return "CREATE";


if(name.includes("UPDATED"))
return "UPDATE";


if(name.includes("DELETED"))
return "DELETE";


if(name.includes("RESTORED"))
return "RESTORE";


return "SYSTEM";

},




health(){

return HealthContract.create(
"AuditEventHandler",
this.ready?"OK":"WARNING",
{

version:this.version,

subscriptions:
this.subscriptions.length

});

}


};



globalThis.AuditEventHandler =
AuditEventHandler;


Logger.log(
"AuditEventHandler LOADED v3.3.0");