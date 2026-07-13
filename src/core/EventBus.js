console.log("EventBus");


const EventBus = {


    version:"0.2.0",

    handlers:{},


    // =====================
    // SUBSCRIBE
    // =====================

    on(event, handler){


        if(!this.handlers[event]){

            this.handlers[event]=[];

        }


        if(
            this.handlers[event]
            .includes(handler)
        ){

            Logger.log(
                "Duplicate handler ignored: "
                + event
            );

            return false;

        }


        this.handlers[event]
        .push(handler);


        Logger.log(
            "SUBSCRIBED: "
            + event
        );


        return true;

    },



    // =====================
    // COMPATIBILITY ALIAS
    // =====================

    subscribe(event,handler){

        return this.on(
            event,
            handler
        );

    },



    // =====================
    // EMIT
    // =====================

    emit(event,payload){


        Logger.log(
            "EVENT: "
            + event
        );



        const list =
            this.handlers[event];



        if(
            !list ||
            list.length===0
        ){

            Logger.log(
                "No handlers for: "
                + event
            );

            return;

        }



        Logger.log(
            "HANDLERS: "
            + list.length
        );



        list.forEach(fn=>{


            try{

                fn(payload);

            }

            catch(e){


                Logger.log(
                    "EventBus error: "
                    + e.message
                );


            }


        });



    },



    // =====================
    // CLEAR
    // =====================

    clear(){

        this.handlers={};

    },



    // =====================
    // HEALTH
    // =====================

    health(){


        return {


            status:"OK",

            module:"EventBus",

            version:this.version,


            events:
            Object.keys(
                this.handlers
            ),


            handlersCount:

            Object.values(
                this.handlers
            )
            .reduce(
                (sum,list)=>
                sum+list.length,
                0
            ),


            timestamp:
            new Date()


        };


    }


};



globalThis.EventBus =
EventBus;