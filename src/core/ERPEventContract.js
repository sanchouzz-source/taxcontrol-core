console.log("ERPEventContract v1.1");


const ERPEventContract = {


version:"1.1.0",

sequence:0,


init(){

    Logger.log(
    "ERPEventContract READY v"+
    this.version);

},



// --------------------------------
// Генерация ID события
// --------------------------------

generateId(){

    this.sequence++;

    const time =
    new Date()
    .getTime()
    .toString()
    .slice(-8);


    return (
        "EVT" +
        time +
        this.sequence
        .toString()
        .padStart(3,"0")
    );

},




// --------------------------------
// Создание ERP Event
// --------------------------------

create(params){


    if(!params){
        throw new Error(
        "ERPEventContract: params required");
    }



    const event={


        id:
        params.id ||
        this.generateId(),



        entity:
        params.entity || "",



        type:
        params.type || "UNKNOWN",



        entityId:
        params.entityId || "",



        before:
        params.before || null,



        after:
        params.after || null,



        source:
        params.source || "ERP",



        user:
        params.user || null,



        timestamp:
        params.timestamp ||
        new Date()
        .toISOString()


    };



    const check =
    this.validate(event);



    if(!check.valid){

        throw new Error(
        "INVALID ERP EVENT: "+
        check.error
        );

    }


    return event;

},




// --------------------------------
// Валидация
// --------------------------------

validate(event){


    const required=[

        "id",
        "entity",
        "type",
        "timestamp"

    ];



    for(
    const field of required
    ){

        if(
        !event[field]
        ){

            return {

                valid:false,

                error:
                "Missing "+field

            };

        }

    }



    return {

        valid:true

    };


},




// --------------------------------
// Health
// --------------------------------

health(){

return HealthContract.create(

"ERPEventContract",

"OK",

{

version:this.version,

sequence:this.sequence

}

);

}



};



globalThis.ERPEventContract =
ERPEventContract;


ERPEventContract.init();