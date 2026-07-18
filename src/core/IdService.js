console.log("IdService");


const IdService = {


version:"2.1.0",



generate(entity){


    if(!entity){

        throw new Error(
            "IdService entity missing"
        );

    }



    let config = null;



    /*
        ENTITY NAME
    */

    if(
        EntityRegistry.has(entity)
    ){

        config =
            EntityRegistry.get(entity);

    }



    /*
        PREFIX INPUT
        CLI
        TRIP
        FP
    */


    if(!config){


        const found =
            EntityRegistry
            .list()
            .find(
                key => {

                    const item =
                        EntityRegistry[key];

                    return (
                        item.idPrefix === entity
                    );

                }
            );



        if(found){

            config =
                EntityRegistry.get(found);

        }

    }





    if(!config){

        throw new Error(
            "IdService unknown entity: "
            +
            entity
        );

    }




    const prefix =
        config.idPrefix;




    const props =
        PropertiesService
        .getScriptProperties();



    const key =
        "ID_COUNTER_"+prefix;



    let counter =
        Number(
            props.getProperty(key)
        )
        ||
        0;



    counter++;



    props.setProperty(
        key,
        counter
    );




    return (

        prefix
        +
        String(counter)
        .padStart(6,"0")

    );


},





health(){


return HealthContract.create(

"IdService",

"OK",

{

version:this.version

}

);


}



};




globalThis.IdService =
IdService;


Logger.log(
"IdService READY v"
+
IdService.version
);