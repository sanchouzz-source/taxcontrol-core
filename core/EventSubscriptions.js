console.log("EventSubscriptions");


const EventSubscriptions = {


    version:"0.3.0",

    initialized:false,

    subscriptions:[],



    /*
    =====================================
    INIT
    =====================================
    */


    initEventSubscriptions(){


        if(this.initialized){


            Logger.log(
                "EventSubscriptions ALREADY INITIALIZED"
            );


            return;


        }




        Logger.log(
            "EVENT SUBSCRIPTIONS INIT START"
        );





        this.registerDashboardEvents([


            /*
            CLIENT
            */

            EntityEvents?.CLIENT?.CREATED,

            EntityEvents?.CLIENT?.UPDATED,

            EntityEvents?.CLIENT?.DELETED,

            EntityEvents?.CLIENT?.RESTORED,



            /*
            TRIP
            */

            EntityEvents?.TRIP?.CREATED,

            EntityEvents?.TRIP?.UPDATED,

            EntityEvents?.TRIP?.DELETED,

            EntityEvents?.TRIP?.RESTORED,




            /*
            TRANSPORT ORDER
            */


            EntityEvents?.TRANSPORT_ORDER?.CREATED,

            EntityEvents?.TRANSPORT_ORDER?.UPDATED,

            EntityEvents?.TRANSPORT_ORDER?.DELETED,

            EntityEvents?.TRANSPORT_ORDER?.RESTORED,




            /*
            CARRIER
            */


            EntityEvents?.CARRIER?.CREATED,

            EntityEvents?.CARRIER?.UPDATED,

            EntityEvents?.CARRIER?.DELETED,





            /*
            DRIVER
            */


            EntityEvents?.DRIVER?.CREATED,

            EntityEvents?.DRIVER?.UPDATED,





            /*
            VEHICLE
            */


            EntityEvents?.VEHICLE?.CREATED,

            EntityEvents?.VEHICLE?.UPDATED,





            /*
            ROUTE
            */


            EntityEvents?.ROUTE?.CREATED,

            EntityEvents?.ROUTE?.UPDATED,





            /*
            CARGO
            */


            EntityEvents?.CARGO?.CREATED,

            EntityEvents?.CARGO?.UPDATED




        ]);





        this.initialized=true;



        Logger.log(
            "EVENT SUBSCRIPTIONS READY v"+
            this.version
        );



        Logger.log(
            JSON.stringify(
                this.subscriptions
            )
        );


    },









    /*
    =====================================
    REGISTER DASHBOARD EVENTS
    =====================================
    */


    registerDashboardEvents(events){



        events.forEach(event=>{


            if(!event){


                Logger.warn(
                    "SKIP EMPTY EVENT"
                );


                return;


            }




            this.subscribe(


                event,


                (payload)=>{


                    this.dashboardRefreshHandler(payload);


                },


                {


                    name:
                    "Dashboard_"+event


                }


            );



        });


    },









    /*
    =====================================
    SUBSCRIBE
    =====================================
    */


    subscribe(event,handler,options={}){



        if(!event || !handler){


            Logger.error(
                "INVALID EVENT SUBSCRIPTION"
            );


            return false;


        }






        const exists =

        this.subscriptions.some(

            item=>

            item.event===event

        );





        if(exists){



            Logger.debug(

                "SUBSCRIPTION EXISTS: "+
                event

            );


            return false;


        }






        if(
            typeof EventBus==="undefined"
        ){


            Logger.error(
                "EventBus NOT FOUND"
            );


            return false;


        }






        EventBus.subscribe(

            event,

            handler,

            {


                name:

                options.name ||

                "EventSubscriptions_"+event


            }


        );






        this.subscriptions.push({


            event:event,


            handler:

            options.name ||

            handler.name ||

            "anonymous",



            status:"ACTIVE",



            createdAt:

            new Date().toISOString()


        });






        Logger.log(

            "SUBSCRIBED: "+
            event

        );



        return true;


    },









    /*
    =====================================
    DASHBOARD HANDLER
    =====================================
    */


    dashboardRefreshHandler(payload){



        Logger.debug(

            "DASHBOARD EVENT "+

            payload.event+

            " ENTITY "+

            payload.entityId

        );





        this.refreshDashboard();



    },









    /*
    =====================================
    DASHBOARD
    =====================================
    */


    refreshDashboard(){


        try{


            if(

                typeof DashboardEngine!=="undefined"

                &&

                typeof DashboardEngine.render==="function"

            ){


                DashboardEngine.render(true);


            }



        }

        catch(error){


            Logger.error(

                "DASHBOARD REFRESH ERROR: "+

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


            "EventSubscriptions",


            this.initialized

            ?

            "OK"

            :

            "WARNING",




            {


                version:this.version,


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





globalThis.EventSubscriptions =
EventSubscriptions;




Logger.log(

"EventSubscriptions READY v"+
EventSubscriptions.version

);