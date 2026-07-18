console.log("BaseRepository");


const BaseRepository = {


version:"2.4.0",


create(
    entity,
    data={}
){

    const meta =
        this.getMeta(entity);


    this.checkPermission(
        meta,
        "create"
    );



    const idField =
        meta.idField
        ||
        entity+"ID";



    if(!data[idField]){

        data[idField] =
            IdService.generate(entity);

    }



    this.applySystemFields(
        meta,
        data
    );



    const result =
        Database.insert(

            meta.table,

            data

        );



    this.publishEvent(
        entity,
        meta.events?.created,
        AuditConstants.ACTION_CREATE,
        null,
        result
    );


    return result;

},




findById(
    entity,
    id
){

    const meta =
        this.getMeta(entity);



    this.checkPermission(
        meta,
        "read"
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
        this.getMeta(entity);



    this.checkPermission(
        meta,
        "read"
    );


    return Database.query(
        meta.table,
        filters
    );


},





update(
    entity,
    id,
    data={}
){

    const meta =
        this.getMeta(entity);



    this.checkPermission(
        meta,
        "update"
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



    this.applySystemFields(
        meta,
        updated,
        true
    );



    const result =
        Database.update(
            meta.table,
            id,
            updated
        );



    this.publishEvent(
        entity,
        meta.events?.updated,
        AuditConstants.ACTION_UPDATE,
        existing,
        result
    );



    return result;


},





delete(
    entity,
    id
){

    const meta =
        this.getMeta(entity);



    this.checkPermission(
        meta,
        "delete"
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



    if(meta.softDelete !== false){


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




    this.publishEvent(
        entity,
        meta.events?.deleted,
        AuditConstants.ACTION_DELETE,
        existing,
        result
    );



    return result;


},





restore(
    entity,
    id
){

    const meta =
        this.getMeta(entity);



    this.checkPermission(
        meta,
        "restore"
    );



    if(meta.softDelete === false){

        throw new Error(
            entity+
            " restore unavailable"
        );

    }



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




    this.publishEvent(
        entity,
        meta.events?.restored,
        AuditConstants.ACTION_RESTORE,
        existing,
        result
    );



    return result;


},





getMeta(
    entity
){

    const meta =
        EntityRegistry.get(entity);



    if(!meta){

        throw new Error(
            "Entity not registered: "
            +
            entity
        );

    }


    return meta;

},





checkPermission(
    meta,
    action
){

    if(
        typeof SecurityGuard === "undefined"
    ){

        return;

    }



    const permission =
        meta.permissions?.[action];



    if(permission){

        SecurityGuard.check(
            permission
        );

    }


},





applySystemFields(
    meta,
    data,
    update=false
){


    if(meta.timestamps){


        const now =
            new Date()
            .toISOString();



        if(!update){

            data.CreatedAt =
                data.CreatedAt
                ||
                now;

        }


        data.UpdatedAt =
            now;

    }





    if(
        meta.organization !== false
        &&
        typeof OrganizationContext !== "undefined"
    ){

        data.OrganizationID =
            data.OrganizationID
            ||
            OrganizationContext.get();

    }


},





publishEvent(
    entity,
    event,
    action,
    before,
    after
){

    if(
        typeof EventBus==="undefined"
        ||
        !event
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


        source:
            "BaseRepository",



        timestamp:
            new Date()
            .toISOString()


        }


    );


},





extractEntityId(
    entity,
    record
){

    if(!record){

        return "";

    }



    const meta =
        this.getMeta(entity);



    return record[
        meta.idField
        ||
        entity+"ID"
    ]
    ||
    "";

},





exists(
    entity,
    id
){

    const meta =
        this.getMeta(entity);



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

version:this.version,

architecture:
"EntityRegistry v2.1 compatible"

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