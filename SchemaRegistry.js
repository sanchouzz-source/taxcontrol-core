console.log("SchemaRegistry");


const SchemaRegistry = {


getIdField(sheet){


    if(typeof EntityMetadata === "undefined"){
        throw new Error(
          "EntityMetadata not loaded"
        );
    }


    const entities =
        EntityMetadata.list();


    for(const entity of entities){


        const meta =
            EntityMetadata.get(entity);


        if(meta.table === sheet){

            return meta.id;

        }

    }


    return null;

},


getEntityByTable(sheet){


    const entities =
        EntityMetadata.list();


    for(const entity of entities){

        const meta =
            EntityMetadata.get(entity);


        if(meta.table===sheet){

            return entity;

        }

    }


    return null;

}



};



globalThis.SchemaRegistry =
SchemaRegistry;


Logger.log(
"SchemaRegistry READY v2.0.0"
);