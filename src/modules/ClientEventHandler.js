console.log("ClientEventHandler v0.7");


const ClientEventHandler = {


    version:"0.7.0",

    initialized:false,

    ready:false,


    entityName:"CLIENT",


    subscriptions:[],


    handlers:{},



    /*
    =====================================
    INIT
    =====================================
    */


    init(){


        if(this.initialized){


            Logger.log(
                "ClientEventHandler ALREADY INITIALIZED"
            );


            return true;

        }





        if(typeof EventBus==="undefined"){


            throw new Error(
                "ClientEventHandler: EventBus unavailable"
            );


        }




        this.register(

            EntityEvents.CLIENT.CREATED,
            this.onCreated

        );



        this.register(

            EntityEvents.CLIENT.UPDATED,
            this.onUpdated

        );



        this.register(

            EntityEvents.CLIENT.DELETED,
            this.onDeleted

        );



        this.register(

            EntityEvents.CLIENT.RESTORED,
            this.onRestored

        );






        this.initialized=true;

        this.ready=true;



        Logger.log(
            "ClientEventHandler READY v"+
            this.version
        );


        Logger.log(
            JSON.stringify(
                this.subscriptions
            )
        );



        return true;


    },







    /*
    =====================================
    REGISTER
    =====================================
    */


    register(event,handler){


        if(!event || !handler){


            Logger.warn(
                "CLIENT HANDLER INVALID"
            );


            return false;

        }





        if(
            this.subscriptions.some(
                s=>s.event===event
            )
        ){


            Logger.debug(
                "CLIENT SUB EXISTS "+
                event
            );


            return false;

        }





        const bound =
            handler.bind(this);



        EventBus.subscribe(

            event,

            bound,

            {

                name:
                "ClientEventHandler_"+event

            }

        );





        this.subscriptions.push({


            event:event,


            handler:
            handler.name,


            status:"ACTIVE"


        });





        Logger.log(
            "CLIENT SUBSCRIBED "+
            event
        );


        return true;


    },









    /*
    =====================================
    PAYLOAD
    =====================================
    */


    getId(event){


        if(!event)
            return "";



        if(event.entityId)
            return event.entityId;




        const data =
            event.after ||
            event.data ||
            event;



        return (

            data.ClientID ||

            data.CLIENT_ID ||

            ""

        );


    },







    /*
    =====================================
    EVENTS
    =====================================
    */


    onCreated(event){


        this.write(
            "CREATED",
            event
        );


    },



    onUpdated(event){


        this.write(
            "UPDATED",
            event
        );


    },



    onDeleted(event){


        this.write(
            "DELETED",
            event
        );


    },



    onRestored(event){


        this.write(
            "RESTORED",
            event
        );


    },








    /*
    =====================================
    LOGGER
    =====================================
    */


    write(action,event){


        try{


            Logger.debug(

                "CLIENT "+
                action+
                " EVENT "+
                this.getId(event)

            );



        }

        catch(error){


            Logger.error(

                "ClientEventHandler ERROR "+
                error.message

            );


        }


    },









    /*
    =====================================
    HEALTH
    =====================================
    */


    health(){


        return HealthContract.create(

            "ClientEventHandler",

            this.ready
            ?
            "OK"
            :
            "WARNING",


            {


                version:this.version,


                entity:this.entityName,


                initialized:this.initialized,


                subscriptions:
                this.subscriptions.length,


                events:
                this.subscriptions.map(
                    s=>s.event
                )


            }


        );


    }


};





globalThis.ClientEventHandler =
ClientEventHandler;



Logger.log(
"ClientEventHandler READY v"+
ClientEventHandler.version
);