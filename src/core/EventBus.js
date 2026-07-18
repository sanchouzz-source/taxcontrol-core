console.log("EventBus");


const EventBus = {


version:"1.1.0",


events:{},



subscribe(event, handler){


    if(!event)
        throw new Error(
            "Event name required"
        );



    if(
        !this.events[event]
    ){

        this.events[event]=[];

    }



    this.events[event]
        .push(handler);



    Logger.debug(
        "SUBSCRIBED: "
        +
        event
    );

},





publish(eventName, payload={}){


    if(
        !this.events[eventName]
    ){

        Logger.debug(
            "NO HANDLERS FOR "
            +
            eventName
        );

        return;

    }




    Logger.debug(
        "EVENT: "
        +
        eventName
    );



    const handlers =
        this.events[eventName];



    Logger.debug(
        "HANDLERS: "
        +
        handlers.length
    );





    handlers.forEach(handler=>{


        try{


            handler(payload);


        }
        catch(e){


            Logger.error(
                "EVENT HANDLER ERROR "
                +
                e.message
            );


        }


    });



},





// совместимость

emit(
    eventName,
    payload
){

    return this.publish(
        eventName,
        payload
    );

},





dispatch(
    eventName,
    payload
){

    return this.publish(
        eventName,
        payload
    );

},





list(){


    return Object.keys(
        this.events
    );


},





health(){


return HealthContract.create(

"EventBus",

"OK",

{

version:this.version,

events:this.list()

}

);


}



};



globalThis.EventBus =
EventBus;



Logger.log(
"EventBus READY v"
+
EventBus.version
);