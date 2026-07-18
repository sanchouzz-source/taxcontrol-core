console.log("EventBus");


const EventBus = {


version:"1.2.0",


events:{},



subscribe(
    event,
    handler
){


    if(!event){

        throw new Error(
            "Event name required"
        );

    }


    if(
        typeof handler !== "function"
    ){

        throw new Error(
            "Event handler must be function"
        );

    }




    if(
        !this.events[event]
    ){

        this.events[event]=[];

    }





    if(
        this.events[event]
        .indexOf(handler)
        ===
        -1
    ){

        this.events[event]
        .push(handler);

    }



    Logger.debug(
        "SUBSCRIBED: "
        +
        event
    );


},





/*
=================================
BACKWARD COMPATIBILITY
=================================
*/


on(
    event,
    handler
){

    return this.subscribe(
        event,
        handler
    );

},






once(
    event,
    handler
){


    const wrapper =
    (payload)=>{


        try{

            handler(payload);

        }
        finally{

            this.off(
                event,
                wrapper
            );

        }

    };



    return this.subscribe(
        event,
        wrapper
    );


},







off(
    event,
    handler
){


    if(
        !this.events[event]
    ){

        return;

    }



    this.events[event] =
        this.events[event]
        .filter(
            h =>
            h !== handler
        );




    Logger.debug(
        "UNSUBSCRIBED: "
        +
        event
    );


},






publish(
    eventName,
    payload={}
){


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
        [
            ...this.events[eventName]
        ];



    Logger.debug(
        "HANDLERS: "
        +
        handlers.length
    );






    handlers.forEach(
        handler=>{


            try{


                handler(
                    payload
                );


            }
            catch(e){


                Logger.error(
                    "EVENT HANDLER ERROR "
                    +
                    e.message
                );


            }


        }
    );



},






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





clear(){

    this.events={};

    Logger.debug(
        "EVENT BUS CLEARED"
    );

},





health(){


return HealthContract.create(

"EventBus",

"OK",

{

version:this.version,

events:this.list(),

handlers:
Object.values(this.events)
.reduce(
(sum,array)=>
sum+array.length,
0
)

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