console.log("EventBus v2.1");


const EventBus = {


version:"2.1.0",


events:{},


history:[],


ready:false,



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
    handler,
    options={}
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




    const handlerName =
        options.name
        ||
        handler.name
        ||
        "anonymous";





    const exists =
        this.events[eventName]
        .some(
            item =>

                item.name === handlerName

                ||

                item.handler === handler

        );





    if(exists){


        Logger.debug(

            "SKIP DUPLICATE SUBSCRIPTION "
            +
            eventName
            +
            " "
            +
            handlerName

        );


        return {

            event:eventName,

            duplicate:true

        };


    }





    this.events[eventName]
    .push({

        handler,


        name:
            handlerName,


        createdAt:
            new Date()
            .toISOString()

    });





    Logger.debug(

        "SUBSCRIBED "
        +
        eventName
        +
        " "
        +
        handlerName

    );



    return {

        event:eventName,

        handler,

        name:handlerName

    };


},






on(
eventName,
handler,
options={}
){

return this.subscribe(
    eventName,
    handler,
    options
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




const envelope={


event:eventName,


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




this.history.push({

event:eventName,

timestamp:
envelope.timestamp

});






const listeners =

[
...
(
this.events[eventName]
||
[]
)
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





let executed=0;




listeners.forEach(

item=>{


try{


item.handler(

Object.freeze(
envelope
)

);


executed++;


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




return {

event:eventName,

handlers:listeners.length,

executed

};


},






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

).length;


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

this.ready
?
"OK"
:
"WARNING",

{

version:this.version,


events:this.list(),


handlers:

Object.values(
this.events
)

.reduce(

(total,list)=>

total+list.length,

0

),


history:this.history.length


}

);


}



};





globalThis.EventBus =
EventBus;



Logger.log(
"EventBus READY v2.1.0"
);