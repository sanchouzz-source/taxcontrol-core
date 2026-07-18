console.log("AuditLog");



const AuditLog = {



version:"2.0.0",


table:"AuditLog",


entity:"AUDIT",


ready:false,






/*
====================================
INIT
====================================
*/


init(){



    if(this.ready){


        Logger.log(
            "AuditLog ALREADY READY"
        );


        return;


    }





    if(
        !EntityRegistry.has(
            this.entity
        )
    ){


        throw new Error(

            "AuditLog entity not registered: "
            +
            this.entity

        );


    }







    this.ready=true;



    Logger.log(

        "AuditLog READY v"
        +
        this.version

    );



},







/*
====================================
WRITE
ЕДИНАЯ ТОЧКА АУДИТА
====================================
*/


write(data){



    if(!data){


        throw new Error(

            "Audit data missing"

        );


    }







    const meta =

        EntityRegistry.get(
            this.entity
        );







    const record = {



        /*
        ID через EntityRegistry
        */


        AuditID:

            IdService.generate(
                this.entity
            ),







        OrganizationID:

            this.getOrganizationID(),







        Entity:

            data.entity
            ||
            "",







        EntityID:

            data.entityId
            ||
            "",







        Action:

            data.action
            ||
            "SYSTEM",








        UserID:

            this.getUserID(),







        EventID:

            data.eventId
            ||
            "",







        Before:

            this.serialize(
                data.before
            ),







        After:

            this.serialize(
                data.after
            ),







        Source:

            data.source
            ||
            "ERP",







        Version:

            Number(
                data.version
                ||
                1
            ),








        EntityVersion:

            Number(
                data.entityVersion
                ||
                1
            ),







        CreatedAt:

            new Date()
            .toISOString()



    };







    this.insert(record);





    return record;



},







/*
====================================
DATABASE INSERT
====================================
*/


insert(record){



    try{





        if(
            !Database
            ||
            !Database.insert
        ){


            throw new Error(

                "Database unavailable"

            );


        }







        Database.insert(

            this.table,

            record

        );







        Logger.log(

            "AUDIT "
            +
            record.Action
            +
            " "
            +
            record.Entity
            +
            " "
            +
            record.EntityID

        );





    }
    catch(e){



        Logger.log(

            "AUDIT WRITE ERROR "
            +
            e.message

        );



        throw e;


    }



},







/*
====================================
SEARCH
====================================
*/


findByEntity(entity,id){



    if(
        !Database?.find
    ){


        return [];


    }






    return Database.find(

        this.table,

        {


            Entity:
                entity,


            EntityID:
                id


        }

    );



},







findByEvent(eventId){



    if(
        !Database?.find
    ){


        return [];


    }







    return Database.find(

        this.table,

        {

            EventID:eventId

        }

    );



},







/*
====================================
SERIALIZE
====================================
*/


serialize(value){



    if(
        value===undefined
        ||
        value===null
    ){


        return "";


    }






    if(
        typeof value==="string"
    ){


        return value;


    }






    return JSON.stringify(
        value
    );


},







/*
====================================
CONTEXT
====================================
*/


getOrganizationID(){



    if(
        globalThis.OrganizationContext
    ){


        return OrganizationContext.get();


    }




    return "DEFAULT";



},







getUserID(){



    if(
        globalThis.UserSession
    ){



        if(
            UserSession.current
        ){


            return (
                UserSession.current.UserID
                ||
                "SYSTEM"
            );


        }




        if(
            UserSession.userId
        ){


            return UserSession.userId;


        }



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

    "AuditLog",


    this.ready
    ?
    "OK"
    :
    "WARNING",



    {


        version:
            this.version,


        table:
            this.table,


        entity:
            this.entity


    }


);



}



};







globalThis.AuditLog =
AuditLog;







Logger.log(

    "AuditLog READY v"
    +
    AuditLog.version

);