console.log("KPIEngine");


const KPIEngine = {

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
    init(){

        if(this.initialized){
            return;
        }


        EventBus.on(
            "TRIP_PROFIT_CALCULATED",
            (payload)=>{


                Logger.log(
                    "KPI EVENT RECEIVED:"
                    +
                    JSON.stringify(payload)
                );


                if(
                    !payload ||
                    !payload.transaction ||
                    !payload.trip
                ){

                    Logger.log(
                        "Invalid KPI payload"
                    );

                    return;

                }


                KPIService.createProfitKPI(
                    payload.trip,
                    payload.transaction,
                    payload.profit
                );


            }
        );


        this.initialized=true;


        Logger.log(
            "KPIEngine READY"
        );

    }

};


globalThis.KPIEngine = KPIEngine;