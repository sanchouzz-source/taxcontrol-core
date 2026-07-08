const FinanceEngine = {

    initialized:false,


    init() {


        if(this.initialized){
            return;
        }


        EventBus.on("TRIP_COMPLETED", (trip)=>{

            this.calculateTripProfit(trip);

        });


        EventBus.on("CLIENT_CREATED", (client)=>{

            this.initClientFinance(client);

        });


        this.initialized=true;


        Logger.log(
            "FinanceEngine READY"
        );

    }

};
//расчет прибыли рейса
FinanceEngine.calculateTripProfit = function(trip) {


    const revenue =
        Number(trip.Revenue || 0);


    const cost =
        Number(trip.ActualCost || 0);


    const profit =
        revenue - cost;



    Logger.log(
        "💰 Trip Profit: " + profit
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



    Logger.log(
        "💰 Finance transaction created: "
        + transaction.TransactionID
    );


};

    // сюда позже добавим:
    // - запись в Finance table
    // - обновление KPI
    // - бонусы менеджерам
};
//клиентская инансовая карточка
FinanceEngine.initClientFinance = function(client) {

    Logger.log("📊 Finance profile created for: " + client.Name);

    // будущая логика:
    // - кредитный лимит
    // - оборот
    // - риск-скоринг
};