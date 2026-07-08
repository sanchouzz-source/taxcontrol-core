const KPIEngine = {

    initialized:false,


    init(){

        if(this.initialized){
            return;
        }


        EventBus.on(
            "TRIP_PROFIT_CALCULATED",
            this.handleProfit.bind(this)
        );


        this.initialized=true;


        Logger.log(
            "KPIEngine READY"
        );

    },



handleProfit(data){


    Logger.log(
        "KPI EVENT RECEIVED:"
        +
        JSON.stringify(data)
    );


    let trip;
    let profit;



    // новый формат
    if(data.trip){

        trip = data.trip;
        profit = Number(data.profit || 0);

    }


    // защита от старого формата
    else if(data.TripID){

        trip = data;

        profit =
            Number(data.Revenue || 0)
            -
            Number(data.ActualCost || 0);

    }


    else {

        Logger.log(
            "UNKNOWN KPI PAYLOAD"
        );

        return;

    }



    this.createTripKPI(
        trip,
        profit
    );

},



    createTripKPI(trip,profit){


        const revenue =
            Number(trip.Revenue || 0);


        const cost =
            Number(trip.ActualCost || 0);



        const margin =
            revenue === 0
            ? 0
            :
            profit / revenue;



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
                revenue,


            Cost:
                cost,


            Profit:
                profit,


            Margin:
                margin

        };



        KPIService.createTripProfitKPI(
    trip,
    transaction
);



        Logger.log(
            "📊 KPI CREATED: "
            +
            kpi.KPIID
        );


        EventBus.emit(
            "KPI_CREATED",
            kpi
        );


        return kpi;

    }

};


globalThis.KPIEngine = KPIEngine;