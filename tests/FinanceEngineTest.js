function testFinanceEngine(){


    SystemInit.init();



    const trip={


        TripID:"TRIP001",

        Revenue:100000,

        ActualCost:70000


    };



    const result =

        FinanceEngine
        .calculateTripProfit(trip);



    Logger.log(

        JSON.stringify(
            result,
            null,
            2
        )

    );


}