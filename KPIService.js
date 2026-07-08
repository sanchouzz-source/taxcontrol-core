console.log("KPIService");
const KPIService = {


    createTripProfitKPI(
        trip,
        transaction
    ) {


        const kpi = {


            MetricType:
                "TRIP_PROFIT",


            Entity:
                "TRIP",


            EntityID:
                trip.TripID,


            Period:
                new Date(),


            Revenue:
                transaction.Revenue,


            Cost:
                transaction.Cost,


            Profit:
                transaction.Profit,


            Margin:
                transaction.Profit /
                transaction.Revenue

        };


        return KPIRepository.create(
            kpi
        );

    }

};


globalThis.KPIService = KPIService;