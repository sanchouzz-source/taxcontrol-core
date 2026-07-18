console.log("EventBus v2.0");



const EventBus = {



version:"2.0.0",



events:{},



history:[],



ready:false,





/*
====================================
INIT
====================================
*/


init(){


    if(this.ready){

        Logger.log(
            "EventBus ALREADY READY"
        );

        return;

    }


    this.ready=true;


    Logger.log(
        "EventBus READY v"
        +
        this.version
    );


},







/*
====================================
SUBSCRIBE
====================================
*/


subscribe(
    eventName,
    handler
){



    if(!eventName){

        throw new Error(
            "EventBus event required"
        );

    }





    if(
        typeof handler !== "function"
    ){

        throw new Error(
            "EventBus handler must function"
        );

    }






    if(
        !this.events[eventName]
    ){

        this.events[eventName]=[];

    }






    const exists =
        this.events[eventName]
        .some(
            item =>
                item.handler === handler
        );





    if(!exists){



        this.events[eventName]
        .push({

            handler,

            createdAt:
                new Date()
                .toISOString()

        });


    }





    Logger.debug(

        "SUBSCRIBED "
        +
        eventName

    );




    return {

        event:eventName,

        handler

    };


},







/*
====================================
ALIASES
====================================
*/


on(
    eventName,
    handler
){

    return this.subscribe(
        eventName,
        handler
    );

},







/*
====================================
ONCE
====================================
*/


once(
    eventName,
    handler
){


    const wrapper =
    payload=>{


        try{


            handler(payload);


        }
        finally{


            this.off(
                eventName,
                wrapper
            );


        }


    };



    return this.subscribe(
        eventName,
        wrapper
    );



},







/*
====================================
UNSUBSCRIBE
====================================
*/


off(
    eventName,
    handler
){



    if(
        !this.events[eventName]
    ){

        return;

    }






    this.events[eventName] =
        this.events[eventName]
        .filter(
            item =>
                item.handler !== handler
        );





    Logger.debug(

        "UNSUBSCRIBED "
        +
        eventName

    );


},







/*
====================================
PUBLISH
====================================
*/


publish(
    eventName,
    payload={}
){



    if(!eventName){

        throw new Error(
            "Event name required"
        );

    }






    const envelope = {


        event:
            eventName,



        timestamp:
            new Date()
            .toISOString(),




        data:
            payload.data
            ||
            payload,



        entity:
            payload.entity
            ||
            null,



        entityId:
            payload.entityId
            ||
            null,



        before:
            payload.before
            ||
            null,



        after:
            payload.after
            ||
            null,



        metadata:
            payload.metadata
            ||
            {

                source:"ERP"

            }



    };








    this.history.push(

        {

            event:eventName,

            timestamp:
                envelope.timestamp

        }

    );







    const listeners =
        [
            ...(this.events[eventName] || [])
        ];






    Logger.debug(

        "EVENT "
        +
        eventName

    );





    Logger.debug(

        "HANDLERS "
        +
        listeners.length

    );







    listeners.forEach(
        item=>{


            try{


                item.handler(
                    Object.freeze(
                        envelope
                    )
                );


            }
            catch(error){



                Logger.error(

                    "EVENT HANDLER ERROR "
                    +
                    error.message

                );


            }


        }
    );




},







/*
====================================
ALIASES
====================================
*/


emit(
    eventName,
    payload={}
){

    return this.publish(
        eventName,
        payload
    );


},






dispatch(
    eventName,
    payload={}
){

    return this.publish(
        eventName,
        payload
    );


},







/*
====================================
INFO
====================================
*/


list(){


    return Object.keys(
        this.events
    );


},






listeners(eventName){


    return (
        this.events[eventName]
        ||
        []
    )
    .length;


},







clear(){



    this.events={};



    Logger.debug(
        "EVENT BUS CLEARED"
    );


},







clearHistory(){


    this.history=[];


},







/*
====================================
HEALTH
====================================
*/


health(){



return HealthContract.create(


    "EventBus",


    this.ready
    ?
    "OK"
    :
    "WARNING",



    {


        version:
            this.version,



        events:
            this.list(),



        handlers:
            Object.values(
                this.events
            )
            .reduce(
                (
                    total,
                    list
                )=>
                    total+list.length,
                0
            ),



        history:
            this.history.length


    }


);



}



};






globalThis.EventBus =
EventBus;



Logger.log(
"EventBus READY v2.0.0"
);