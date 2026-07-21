console.log("EventSubscriptions");


const EventSubscriptions = {

    version: "0.2.0",

    initialized: false,

    subscriptions: [],



    /*
    =====================================
    INIT
    =====================================
    */

    initEventSubscriptions() {


        if (this.initialized) {


            Logger.log(
                "EventSubscriptions ALREADY INITIALIZED"
            );


            return;

        }



        Logger.log(
            "EVENT SUBSCRIPTIONS INIT START"
        );



        /*
        =============================
        DASHBOARD EVENTS
        =============================
        */


        this.registerDashboardEvents([


            // CLIENT

            EntityEvents.CLIENT.CREATED,

            EntityEvents.CLIENT.UPDATED,

            EntityEvents.CLIENT.DELETED,

            EntityEvents.CLIENT.RESTORED,



            // TRIP

            EntityEvents.TRIP.CREATED,

            EntityEvents.TRIP.UPDATED,

            EntityEvents.TRIP.DELETED,

            EntityEvents.TRIP.RESTORED,



            // TRANSPORT ORDER

            EntityEvents.TRANSPORT_ORDER.CREATED,

            EntityEvents.TRANSPORT_ORDER.UPDATED,

            EntityEvents.TRANSPORT_ORDER.DELETED,

            EntityEvents.TRANSPORT_ORDER.RESTORED



        ]);





        this.initialized = true;



        Logger.log(
            "EVENT SUBSCRIPTIONS READY"
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


    registerDashboardEvents(events) {


        events.forEach(event => {


            if (!event) {


                Logger.warn(
                    "SKIP EMPTY EVENT"
                );


                return;

            }



            this.subscribe(

                event,

                this.dashboardRefreshHandler,

                {
                    name:
                    "Dashboard_"+event
                }

            );


        });


    },








    /*
    =====================================
    GENERIC SUBSCRIBE
    =====================================
    */


    subscribe(event, handler, options={}) {



        if (!event || !handler) {


            Logger.error(
                "INVALID EVENT SUBSCRIPTION"
            );


            return false;

        }





        /*
        защита дублей
        */


        const exists =
            this.subscriptions.some(item =>
                item.event === event
            );



        if (exists) {


            Logger.debug(
                "SUBSCRIPTION EXISTS: "+
                event
            );


            return false;

        }






        if (
            typeof EventBus === "undefined"
        ) {


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
            options.name || handler.name || "anonymous",


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
    HANDLERS
    =====================================
    */


    dashboardRefreshHandler(event) {



        Logger.debug(

            "DASHBOARD EVENT "+
            event.event+
            " ENTITY "+
            event.entityId

        );



        this.refreshDashboard();


    },








    /*
    =====================================
    DASHBOARD
    =====================================
    */


    refreshDashboard() {


        try {


            if (

                typeof DashboardEngine !== "undefined"

                &&

                typeof DashboardEngine.render === "function"

            ) {



                DashboardEngine.render(true);



            }


        }

        catch(error) {


            Logger.error(

                "DASHBOARD REFRESH ERROR: "
                +
                error.message

            );


        }


    },









    /*
    =====================================
    HEALTH
    =====================================
    */


    health() {



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


                subscriptions:this.subscriptions.length,


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