console.log("IdService");


const IdService = {


version:"1.1.0",


generate(entity){


    let prefix =
        EntityConstants.getPrefix(
            entity
        );



    if(!prefix){


        prefix =
        String(entity)
        .substring(0,3)
        .toUpperCase();


    }



    const sheet =
        SpreadsheetApp
        .getActive();



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