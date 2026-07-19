console.log("BaseRepository");


const BaseRepository = {


version:"3.0.0",



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


    this.beforeCreate(
        entity,
        data,
        meta
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



    this.afterCreate(
        entity,
        result,
        meta
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





count(
    entity,
    filters={}
){

    const records =
        this.findAll(
            entity,
            filters
        );


    return records
        ? records.length
        : 0;

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



    this.beforeUpdate(
        entity,
        existing,
        data,
        meta
    );



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



    this.afterUpdate(
        entity,
        existing,
        result,
        meta
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


getSoftDeleteFields(meta){

    return {

        deleted:
            meta.deleteField
            ||
            "Deleted",

        deletedAt:
            meta.deleteDateField
            ||
            "DeletedAt",

        deletedBy:
            meta.deleteUserField
            ||
            "DeletedBy"

    };

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



    this.beforeDelete(
        entity,
        existing,
        meta
    );



    let result;



    if(meta.softDelete !== false){



        result =
            Database.update(

                meta.table,

                id,

 const fields =
    this.getSoftDeleteFields(meta);


const deleted = {

    ...existing,

    [fields.deleted]:true,

    [fields.deletedAt]:
        new Date()
        .toISOString(),

    [fields.deletedBy]:
        this.getCurrentUser()

};


result =
Database.update(
    meta.table,
    id,
    deleted
);

            );



    }
    else{


        result =
            Database.delete(
                meta.table,
                id
            );


    }



    this.afterDelete(
        entity,
        existing,
        result,
        meta
    );



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



const fields =
    this.getSoftDeleteFields(meta);



const restored = {

    ...existing,


    [fields.deleted]:false,


    [fields.deletedAt]:null,


    [fields.deletedBy]:null,


    UpdatedAt:
        new Date()
        .toISOString()

};



    const result =
        Database.update(
            meta.table,
            id,
            restored
        );



    this.publishEvent(
        entity,
        meta.events?.restored,
        AuditConstants.ACTION_RESTORE,
        existing,
        result
    );



    return result || restored;

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





existsBy(
    entity,
    field,
    value
){

    const rows =
        this.findAll(
            entity,
            {
                [field]:value
            }
        );


    return rows.length>0;

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


    const entityId =
        this.extractEntityId(
            entity,
            after
        );


    EventBus.emit(

        event,

        {

            entity,

            entityId,

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





getCurrentUser(){

    if(
        typeof UserSession !== "undefined"
        &&
        UserSession.getCurrent
    ){

        return UserSession.getCurrent();

    }


    return "SYSTEM";

},





beforeCreate(
    entity,
    data,
    meta
){},



afterCreate(
    entity,
    result,
    meta
){},



beforeUpdate(
    entity,
    oldData,
    newData,
    meta
){},



afterUpdate(
    entity,
    oldData,
    result,
    meta
){},



beforeDelete(
    entity,
    data,
    meta
){},



afterDelete(
    entity,
    oldData,
    result,
    meta
){},





health(){

return HealthContract.create(

"BaseRepository",

"OK",

{

version:this.version,

architecture:
"EntityRegistry v2.1 compatible",

features:[

"CRUD",

"SoftDelete",

"Restore",

"LifecycleHooks",

"EventBus",

"Versioning"

]

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