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
        "KPI EVENT RECEIVED"
    );


    if(!data || !data.trip){

        Logger.log(
            "Invalid KPI payload"
        );

        return;
    }


    const trip = data.trip;

    const profit = Number(
        data.profit || 0
    );


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



        Database.insert(
            "KPIMetrics",
            kpi
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