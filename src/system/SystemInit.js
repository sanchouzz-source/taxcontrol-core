console.log("SystemInit");


const SystemInit = {


    initialized:false,


    init(){


        if(this.initialized){

            Logger.log(
                "SYSTEM ALREADY INITIALIZED"
            );

            return;

        }



        Logger.log(
            "ERP INIT START"
        );



        // =========================
        // SAFE CORE
        // =========================

        if(
            typeof SafeCore !== "undefined"
        ){

            SafeCore.init();

        }



        // =========================
        // DATABASE SCHEMA
        // =========================

        if(
            typeof SchemaManager !== "undefined"
        ){

            SchemaManager.init();

        }



        // =========================
        // ID REGISTRY
        // =========================

        if(
            typeof Registry !== "undefined"
        ){

            Registry.init();

        }



        // =========================
        // EVENT BUS SUBSCRIPTIONS
        // =========================

        if(
            typeof EventSubscriptions !== "undefined"
        ){

            EventSubscriptions
                .initEventSubscriptions();


            Logger.log(
                "EventSubscriptions READY"
            );

        }
        else{

            Logger.log(
                "EventSubscriptions NOT FOUND"
            );

        }




        // =========================
        // MODULE REGISTRY
        // =========================

        if(
            typeof ModuleRegistry !== "undefined"
        ){


            if(
                typeof TripEventHandler !== "undefined"
            ){

                ModuleRegistry.register(
                    "TripEventHandler",
                    TripEventHandler
                );

            }



            if(
                typeof FinanceEngine !== "undefined"
            ){

                ModuleRegistry.register(
                    "FinanceEngine",
                    FinanceEngine
                );

            }



            if(
                typeof KPIEngine !== "undefined"
            ){

                ModuleRegistry.register(
                    "KPIEngine",
                    KPIEngine
                );

            }



            if(
                typeof DashboardEngine !== "undefined"
            ){

                ModuleRegistry.register(
                    "DashboardEngine",
                    DashboardEngine
                );

            }


        }



        // =========================
        // TRIP EVENTS
        // =========================


        if(
            typeof TripEventHandler !== "undefined"
        ){

            Logger.log(
                "FOUND TripEventHandler"
            );


            TripEventHandler.init();


            Logger.log(
                "TripEventHandler initialized"
            );

        }




        // =========================
        // FINANCE
        // =========================


        if(
            typeof FinanceEngine !== "undefined"
        ){

            FinanceEngine.init();

        }




        // =========================
        // KPI
        // =========================


        if(
            typeof KPIEngine !== "undefined"
        ){

            KPIEngine.init();

        }




        // =========================
        // AUTOMATION
        // =========================


        if(
            typeof AutomationEngine !== "undefined"
        ){

            AutomationEngine.init();

        }




        // =========================
        // DASHBOARD
        // =========================


        if(
            typeof DashboardEngine !== "undefined"
        ){

            DashboardEngine.init();

        }




        // =========================
        // COMPLETE
        // =========================


        this.initialized=true;


        Logger.log(
            "ERP INIT COMPLETE"
        );


    },
       health() {
    return {
        status: "OK" | "ERROR",
        module: "...",
        version: "0.1",
        dependencies: { ... },
        timestamp: new Date()
    };
}


};



globalThis.SystemInit =
SystemInit;