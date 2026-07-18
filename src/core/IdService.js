console.log("IdService");


const IdService = {


version:"2.0.0",


registered:false,





/*
=================================
GENERATE ID
=================================
*/


generate(entity){



    if(!entity){

        throw new Error(
            "IdService: entity required"
        );

    }





    let meta;



    try{


        meta =
        EntityRegistry.get(
            entity
        );


    }
    catch(e){


        throw new Error(

            "IdService unknown entity: "
            +
            entity

        );


    }





    const prefix =
        meta.idPrefix;





    if(!prefix){


        throw new Error(

            "Entity prefix missing: "
            +
            entity

        );


    }





    const props =
        PropertiesService
        .getScriptProperties();





    const key =
        "ID_COUNTER_"
        +
        entity;





    let counter =
        Number(
            props.getProperty(key)
        )
        ||
        0;





    counter++;





    props.setProperty(
        key,
        String(counter)
    );







    const id =

        prefix
        +
        String(counter)
        .padStart(
            6,
            "0"
        );






    Logger.debug(

        "GENERATED ID "
        +
        entity
        +
        " => "
        +
        id

    );





    return id;



},







/*
=================================
RESET
=================================
*/


reset(entity){


    const key =
        "ID_COUNTER_"
        +
        entity;



    PropertiesService
    .getScriptProperties()
    .deleteProperty(
        key
    );


    Logger.log(

        "ID COUNTER RESET "
        +
        entity

    );


},







/*
=================================
CURRENT
=================================
*/


current(entity){


    const key =
        "ID_COUNTER_"
        +
        entity;



    return Number(

        PropertiesService
        .getScriptProperties()
        .getProperty(key)

    )
    ||
    0;


},







/*
=================================
HEALTH
=================================
*/


health(){


return HealthContract.create(


"IdService",


"OK",


{


version:
this.version,


registered:
this.registered


}


);


}






};






IdService.registered=true;



globalThis.IdService =
IdService;





Logger.log(

"IdService READY v"
+
IdService.version

);