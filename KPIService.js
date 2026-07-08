const KPIService = {


    createProfitKPI(trip, transaction, profit) {


        const margin =
            transaction.Revenue > 0
            ? profit / transaction.Revenue
            : 0;


        const kpi = {


            KPIID:
                IdService.generate("KPI"),


            OrganizationID:
                OrganizationContext.get(),


            MetricType:
                "TRIP_PROFIT",


            Entity:
                "TRIP",


            EntityID:
                trip.TripID,


            Period:
                Utilities.formatDate(
                    new Date(),
                    Session.getScriptTimeZone(),
                    "yyyy-MM"
                ),


            Revenue:
                transaction.Revenue,


            Cost:
                transaction.Cost,


            Profit:
                profit,


            Margin:
                margin

        };


        const result =
            KPIRepository.create(kpi);


        Logger.log(
            "📊 KPI CREATED: "
            + result.KPIID
        );


        EventBus.emit(
            "KPI_CREATED",
            result
        );


        return result;

    }

};


globalThis.KPIService = KPIService;