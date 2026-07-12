console.log("EventSubscriptions");



const EventSubscriptions = {



    initialized:false,


    subscriptions:[],



    version:"0.1.1",







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







        /*
        =============================
        CLIENT EVENTS
        =============================
        */



        this.subscribe(

            "CLIENT_CREATED",

            ()=>{


                this.refreshDashboard();



            }


        );





        this.subscribe(

            "CLIENT_UPDATED",

            ()=>{


                this.refreshDashboard();



            }


        );







        /*
        =============================
        TRIP EVENTS
        =============================
        */



        this.subscribe(

            "TRIP_CREATED",

            ()=>{


                this.refreshDashboard();


            }


        );





        this.subscribe(

            "TRIP_UPDATED",

            ()=>{


                this.refreshDashboard();



            }


        );





        this.subscribe(

            "TRIP_COMPLETED",

            ()=>{


                this.refreshDashboard();



            }


        );







        this.initialized=true;





        Logger.log(

            "EVENT SUBSCRIPTIONS READY"

        );



        Logger.log(

            JSON.stringify(
                this.subscriptions
            )

        );




    },









    subscribe(event,handler){



        if(!event || !handler){


            Logger.log(

                "INVALID EVENT SUBSCRIPTION"

            );


            return false;


        }







        /*
        защита от дублей
        */



        const exists =

        this.subscriptions
        .some(item=>{


            return item.event===event;


        });






        if(exists){



            Logger.log(

                "SUBSCRIPTION EXISTS: "
                +
                event

            );


            return false;


        }







        if(
            typeof EventBus==="undefined"
        ){



            Logger.log(

                "EventBus NOT FOUND"

            );


            return false;


        }






        EventBus.on(

            event,

            handler

        );








        this.subscriptions.push({


            event:event,


            status:"ACTIVE"



        });







        Logger.log(

            "SUBSCRIBED: "
            +
            event

        );





        return true;


    },









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



            Logger.log(

                "DASHBOARD REFRESH ERROR: "
                +
                error.message

            );



        }



    },









    health(){



        return HealthContract.create(



            "EventSubscriptions",



            this.initialized

            ?

            "OK"

            :

            "WARNING",






            {


                version:
                this.version,



                initialized:
                this.initialized,



                subscriptions:
                this.subscriptions



            }



        );



    }



};






globalThis.EventSubscriptions =
EventSubscriptions;