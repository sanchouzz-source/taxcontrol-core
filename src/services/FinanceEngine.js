console.log("FinanceEngine");


const FinanceEngine = {


    version:"0.2.0",


    initialized:false,


    health(){


        return HealthContract.create(

            "FinanceEngine",

            this.initialized
            ?
            "OK"
            :
            "WARNING",

            {

                version:this.version,

                initialized:this.initialized,


                dependencies:{

                    EventBus:
                    !!globalThis.EventBus,


                    Database:
                    !!globalThis.Database


                }


            }

        );


    },




    init(){


        if(this.initialized){


            Logger.log(
                "FinanceEngine already initialized"
            );


            return;


        }




        if(!EventBus){


            throw new Error(
                "EventBus missing"
            );


        }





        EventBus.on(

            "TRIP_COMPLETED",

            trip=>{


                this.calculateTripProfit(trip);


            }


        );





        EventBus.on(

            "CLIENT_CREATED",

            client=>{


                this.initClientFinance(client);


            }


        );






        this.initialized=true;



        Logger.log(
            "FinanceEngine READY"
        );


    },







    calculateTripProfit(trip){



        if(!trip){


            Logger.error(
                "EMPTY TRIP"
            );


            return null;


        }





        const revenue =

            Number(
                trip.Revenue || 0
            );




        const cost =

            Number(
                trip.ActualCost || 0
            );





        const profit =

            revenue - cost;






        const transaction={



            TransactionID:

                IdService.generate(
                    "FIN"
                ),



            OrganizationID:

                this.getOrganizationID(),



            Type:

                "TRIP_PROFIT",



            Entity:

                "TRIP",



            EntityID:

                trip.TripID,



            Revenue:

                revenue,



            Cost:

                cost,



            Profit:

                profit,


            CreatedAt:

                new Date()
                .toISOString()



        };






        Database.insert(

            "FinancialTransactions",

            transaction

        );







        EventBus.emit(

            "TRIP_PROFIT_CALCULATED",

            {

                transaction,

                profit


            }


        );







        Logger.log(

            "FINANCE CREATED: "
            +
            transaction.TransactionID

        );



        return transaction;


    },








    getOrganizationID(){



        if(
            globalThis.OrganizationContext
        ){


            return OrganizationContext.get();


        }





        return "DEFAULT";


    },









    initClientFinance(client){



        Logger.log(

            "Finance profile created: "
            +
            client.Name

        );



    }



};




globalThis.FinanceEngine =
FinanceEngine;