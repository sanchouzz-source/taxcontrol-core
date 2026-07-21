console.log("SchemaRegistry");


const SchemaRegistry = {


version:"2.0.0",


getIdField(sheet){


const entity =
    Object.values(globalThis.EntityMetadata || {})
    .find(meta =>
        meta.table === sheet
    );

    if(entity){

        return entity.id;

    }


    return null;

},



getTable(entity){


    const meta =
        EntityMetadata.get(entity);


    return meta
        ?
        meta.table
        :
        null;


},



health(){

return HealthContract.create(
    "SchemaRegistry",
    "OK",
    {
        version:this.version
    }
);

}


};



globalThis.SchemaRegistry =
SchemaRegistry;