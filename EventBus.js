const EventBus = {


    handlers:{},


    on(event, handler){


        if(!this.handlers[event]){

            this.handlers[event]=[];

        }


        // защита от дублей
        if(
            this.handlers[event]
            .includes(handler)
        ){

            Logger.log(
                "Duplicate handler ignored: "
                + event
            );

            return;

        }


        this.handlers[event].push(handler);


    },


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


    clear(){

        this.handlers={};

    }


};


globalThis.EventBus=EventBus;