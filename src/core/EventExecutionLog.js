console.log("EventExecutionLog v1.0");


const EventExecutionLog = {


version:"1.0.0",


write(data){

    const record={

        eventId:data.eventId || "",

        entity:data.entity || "",

        type:data.type || "",

        status:data.status || "UNKNOWN",

        processor:data.processor || "",

        error:data.error || null,

        timestamp:
            data.timestamp ||
            new Date().toISOString()

    };


    Logger.log(
        "EVENT EXECUTION "+
        JSON.stringify(record)
    );


    if(
        typeof Database!=="undefined" &&
        Database.insert
    ){

        Database.insert(
            "EventExecutionLog",
            record
        );

    }


    return record;

},



success(event){

return this.write({

eventId:event.id,

entity:event.entity,

type:event.type,

status:"SUCCESS",

processor:"BusinessEventProcessor"

});


},



failed(event,error){

return this.write({

eventId:event.id,

entity:event.entity,

type:event.type,

status:"FAILED",

processor:"BusinessEventProcessor",

error:error.message

});


},



health(){

return HealthContract.create(
"EventExecutionLog",
"OK",
{
version:this.version
});

}


};


globalThis.EventExecutionLog =
EventExecutionLog;


Logger.log(
"EventExecutionLog READY v1.0.0"
);