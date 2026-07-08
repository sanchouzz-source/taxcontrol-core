const FinanceEngine = {

    initialized:false,


    init() {

        if(this.initialized){
            return;
        }


        EventBus.on(
            "TRIP_COMPLETED",
            (trip)=>{

                this.calculateTripProfit(trip);

            }
        );


        EventBus.on(
            "CLIENT_CREATED",
            (client)=>{

                this.initClientFinance(client);

            }
        );


        this.initialized=true;


        Logger.log(
            "FinanceEngine READY"
        );

    },


    calculateTripProfit(trip) {


        const revenue =
            Number(trip.Revenue || 0);


        const cost =
            Number(trip.ActualCost || 0);


        const profit =
            revenue - cost;



        Logger.log(
            "💰 Trip Profit: "
            + profit
        );



        const transaction = {


            TransactionID:
                IdService.generate("FIN"),


            OrganizationID:
                OrganizationContext.get(),


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
                profit

        };



        Database.insert(
            "FinancialTransactions",
            transaction
        );



        EventBus.emit(
            "TRIP_PROFIT_CALCULATED",
            transaction
        );



        Logger.log(
            "Finance transaction created: "
            + transaction.TransactionID
        );


        return transaction;

    },


    initClientFinance(client){


        Logger.log(
            "📊 Finance profile created: "
            + client.Name
        );


    }

};


globalThis.FinanceEngine = FinanceEngine;