console.log("AuditLog");



const AuditLog = {



version:"1.1.0",



table:
    "AuditLog",





ready:false,





init(){


    this.ready=true;


    Logger.log(
        "AuditLog READY v"
        +
        this.version
    );


},





write(data){



    if(!data){

        throw new Error(
            "Audit data missing"
        );

    }



    const record = {


        AuditID:
            IdService.generate(
                "AUDIT"
            ),



        Entity:
            data.entity || "",



        EntityID:
            data.entityId || "",



        Action:
            data.action || "SYSTEM",



        UserID:
            data.userId || 
            UserSession?.userId ||
            "SYSTEM",



        OldValue:
            this.serialize(
                data.oldValue
            ),



        NewValue:
            this.serialize(
                data.newValue
            ),



        Event:
            data.event || "",



        Source:
            data.source || "ERP",



        CreatedAt:
            new Date()
            .toISOString(),



        Version:
            data.version || 1


    };





    this.insert(record);



    return record;


},






insert(record){



    try{


        if(
            Database &&
            Database.insert
        ){


            Database.insert(

                this.table,

                record

            );


        }


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

            "AUDIT WRITE ERROR: "
            +
            e.message

        );


    }



},







serialize(value){



    if(
        value === undefined ||
        value === null
    ){

        return "";

    }



    if(
        typeof value === "string"
    ){

        return value;

    }



    return JSON.stringify(
        value
    );



},







findByEntity(entity,id){



    if(!Database?.find){

        return [];

    }



    return Database.find(

        this.table,

        {

            Entity:entity,

            EntityID:id

        }

    );


},







health(){



return HealthContract.create(


    "AuditLog",


    this.ready
        ?"OK"
        :"NOT_READY",


    {


        version:this.version,


        table:this.table


    }


);



}



};





globalThis.AuditLog =
    AuditLog;