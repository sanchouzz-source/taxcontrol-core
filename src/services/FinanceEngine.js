console.log("FinanceEngine");
const FinanceEngine = {

    initialized:false,
   health() {
    return {
        status: "OK" | "ERROR",
        module: "...",
        version: "0.1",
        dependencies: {},
        timestamp: new Date()
    };
},

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



        try {

    Database.insert(
        "FinancialTransactions",
        transaction
    );



}
catch(e){

    Logger.log(
        "FINANCE ERROR: "
        + e.message
    );

};



EventBus.emit(
    "TRIP_PROFIT_CALCULATED",
    {
        trip: trip,
        transaction: transaction,
        profit: profit
    }
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