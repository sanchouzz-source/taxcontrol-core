console.log("BaseRepository");


const BaseRepository = {


version:"2.2.0",



/*
=================================
CREATE
=================================
*/


create(
    entity,
    data
){


    const meta =
        EntityRegistry.get(entity);



    SecurityGuard.check(
        meta.permissions.create
    );




    const idField =
        meta.idField;




    if(!data[idField]){


        data[idField] =
            IdService.generate(entity);


    }





    if(meta.timestamps){


        const now =
            new Date()
            .toISOString();


        data.CreatedAt =
            data.CreatedAt
            ??
            now;


        data.UpdatedAt =
            now;


    }





    if(
        meta.organization !== false
        &&
        typeof OrganizationContext !== "undefined"
    ){


        data.OrganizationID =
            OrganizationContext.get();


    }






    const result =
        Database.insert(

            meta.table,

            data

        );






    this.emitEvent(

        entity,

        meta.events.created,

        AuditConstants.ACTION_CREATE,

        null,

        result

    );





    return result;


},






/*
=================================
READ
=================================
*/


findById(
    entity,
    id
){


    const meta =
        EntityRegistry.get(entity);



    SecurityGuard.check(
        meta.permissions.read
    );



    return Database.find(

        meta.table,

        id

    );


},







findAll(
    entity,
    filters={}
){


    const meta =
        EntityRegistry.get(entity);



    SecurityGuard.check(
        meta.permissions.read
    );



    return Database.query(

        meta.table,

        filters

    );


},







/*
=================================
UPDATE
=================================
*/


update(
    entity,
    id,
    data
){


    const meta =
        EntityRegistry.get(entity);



    SecurityGuard.check(
        meta.permissions.update
    );




    const existing =
        Database.find(

            meta.table,

            id

        );



    if(!existing){


        throw new Error(

            entity+
            " not found"

        );


    }





    if(
        typeof Versioning !== "undefined"
    ){


        Versioning.save(

            entity,

            id,

            existing

        );


    }






    const updated = {


        ...existing,


        ...data



    };





    if(meta.timestamps){


        updated.UpdatedAt =
            new Date()
            .toISOString();


    }






    const result =
        Database.update(

            meta.table,

            id,

            updated

        );





    this.emitEvent(

        entity,

        meta.events.updated,

        AuditConstants.ACTION_UPDATE,

        existing,

        result

    );





    return result;



},







/*
=================================
DELETE
=================================
*/


delete(
    entity,
    id
){


    const meta =
        EntityRegistry.get(entity);



    SecurityGuard.check(
        meta.permissions.delete
    );





    const existing =
        Database.find(

            meta.table,

            id

        );



    if(!existing){


        throw new Error(

            entity+
            " not found"

        );


    }






    let result;






    if(meta.softDelete){



        result =
            Database.update(

                meta.table,

                id,

                {


                ...existing,


                Deleted:true,


                UpdatedAt:
                    new Date()
                    .toISOString()


                }


            );


    }

    else{


        result =
            Database.delete(

                meta.table,

                id

            );


    }






    this.emitEvent(

        entity,

        meta.events.deleted,

        AuditConstants.ACTION_DELETE,

        existing,

        result

    );




    return result;



},








/*
=================================
RESTORE
=================================
*/


restore(
    entity,
    id
){


    const meta =
        EntityRegistry.get(entity);



    SecurityGuard.check(
        meta.permissions.restore
    );




    const existing =
        Database.find(

            meta.table,

            id

        );



    if(!existing){


        throw new Error(

            entity+
            " not found"

        );


    }






    const result =
        Database.update(

            meta.table,

            id,

            {


            ...existing,


            Deleted:false,


            UpdatedAt:
                new Date()
                .toISOString()



            }


        );






    this.emitEvent(

        entity,

        meta.events.restored,

        AuditConstants.ACTION_RESTORE,

        existing,

        result

    );





    return result;



},







/*
=================================
EVENT
=================================
*/


emitEvent(
    entity,
    event,
    action,
    before,
    after
){



    if(
        typeof EventBus==="undefined"
    ){

        return;

    }






    EventBus.emit(

        event,


        {


        entity,


        entityId:
            this.extractEntityId(
                entity,
                after
            ),



        action,


        before,


        after,



        userId:

        (
            typeof UserSession!=="undefined"
            &&
            UserSession.current
        )

        ?

        UserSession.current.UserID

        :

        "SYSTEM",




        timestamp:
            new Date()
            .toISOString()



        }


    );


},







/*
=================================
ENTITY ID
=================================
*/


extractEntityId(
    entity,
    record
){


    if(!record){

        return "";

    }




    const meta =
        EntityRegistry.get(entity);



    return record[
        meta.idField
    ]
    ||
    "";

},






exists(
    entity,
    id
){


    const meta =
        EntityRegistry.get(entity);



    return !!Database.find(

        meta.table,

        id

    );


},







health(){


return HealthContract.create(


"BaseRepository",


"OK",


{


version:
this.version


}


);


}



};





globalThis.BaseRepository =
BaseRepository;



Logger.log(

"BaseRepository READY v"
+
BaseRepository.version

);