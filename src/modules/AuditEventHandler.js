console.log("AuditEventHandler v3.0");



const AuditEventHandler = {


version:"3.0.0",


ready:false,


subscriptions:new Map(),




/*
====================================
INIT
====================================
*/


init(){


    if(this.ready){


        Logger.log(
            "AuditEventHandler ALREADY READY"
        );


        return;

    }



    this.subscribeAll();



    this.ready=true;



    Logger.log(
        "AuditEventHandler READY v"
        +
        this.version
    );


},





/*
====================================
AUTO SUBSCRIBE ALL ENTITIES
====================================
*/


subscribeAll(){



    if(
        !globalThis.EntityRegistry
    ){


        throw new Error(
            "AuditEventHandler: EntityRegistry missing"
        );


    }



    EntityRegistry
        .list()
        .forEach(entity=>{


            const meta =
                EntityRegistry.get(entity);



            if(
                !meta.events
            ){

                return;

            }




            Object.values(meta.events)
            .forEach(eventName=>{


                if(
                    !eventName
                ){

                    return;

                }



                this.subscribe(
                    eventName
                );


            });



            Logger.log(
                "AUDIT REGISTERED ENTITY "
                +
                entity
            );



        });



},







/*
====================================
SAFE SUBSCRIBE
====================================
*/


subscribe(eventName){


    if(
        this.subscriptions.has(eventName)
    ){

        Logger.debug(
            "AUDIT SKIP DUPLICATE "
            +
            eventName
        );


        return;

    }




    const handler =

        event=>{

            this.handle(
                eventName,
                event
            );

        };





    EventBus.subscribe(

        eventName,

        handler,

        {

            name:
            "AuditEventHandler_"+eventName

        }

    );





    this.subscriptions.set(

        eventName,

        handler

    );





    Logger.log(

        "AUDIT SUBSCRIBED "
        +
        eventName

    );


},







/*
====================================
EVENT HANDLER
====================================
*/


handle(eventName,event){



    try{


        if(!event){


            Logger.log(
                "AUDIT EMPTY EVENT "
                +
                eventName
            );


            return;

        }





        const entity =
            event.entity ||
            event.Entity ||
            "UNKNOWN";





        const entityId =
            event.entityId ||
            event.EntityID ||
            "";






        const auditData={



            entity,


            entityId,



            action:
                this.resolveAction(
                    eventName
                ),



            organizationId:
                event.metadata?.organizationId
                ||
                event.OrganizationID
                ||
                "DEFAULT",



            userId:
                event.metadata?.userId
                ||
                "SYSTEM",




            event:
                eventName,



            source:
                event.metadata?.source
                ||
                "ERP",




            before:
                event.before
                ||
                null,



            after:
                event.after
                ||
                null,



            version:
                event.version
                ||
                1


        };






        AuditLog.write(
            auditData
        );





    }
    catch(error){


        Logger.log(

            "AUDIT EVENT ERROR "
            +
            error.message

        );


    }



},







/*
====================================
ACTION MAP
====================================
*/


resolveAction(event){



    if(
        event.includes("CREATED")
    ){

        return "CREATE";

    }



    if(
        event.includes("UPDATED")
    ){

        return "UPDATE";

    }




    if(
        event.includes("DELETED")
    ){

        return "DELETE";

    }




    if(
        event.includes("RESTORED")
    ){

        return "RESTORE";

    }



    return "SYSTEM";


},







/*
====================================
HEALTH
====================================
*/


health(){



return HealthContract.create(


    "AuditEventHandler",


    this.ready
        ?
        "OK"
        :
        "NOT_READY",



    {


        version:
            this.version,



        subscriptions:
            this.subscriptions.size



    }


);



}



};






globalThis.AuditEventHandler =
AuditEventHandler;



Logger.log(
"AuditEventHandler LOADED v3.1.0"
);