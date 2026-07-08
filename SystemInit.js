const SystemInit = {


    init() {


        Logger.log(
            "ERP INIT START"
        );



        // =========================
        // SAFE CORE
        // =========================

        if (
            typeof SafeCore !== "undefined"
        ) {

            SafeCore.init();

        }



        // =========================
        // SCHEMA
        // =========================

        if (
            typeof SchemaManager !== "undefined"
        ) {

            SchemaManager.init();

        }



        // =========================
        // EVENT SUBSCRIPTIONS
        // =========================

        if (
            typeof EventSubscriptions !== "undefined"
        ) {

            EventSubscriptions.initEventSubscriptions();

        }



        // =========================
        // TRIP EVENTS
        // =========================

        if (
            typeof TripEventHandler !== "undefined"
        ) {


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

        if (
            typeof FinanceEngine !== "undefined"
        ) {

            FinanceEngine.init();

        }



        // =========================
        // KPI
        // =========================

        if (
            typeof KPIEngine !== "undefined"
        ) {

            KPIEngine.init();

        }



        // =========================
        // AUTOMATION
        // =========================

        if (
            typeof AutomationEngine !== "undefined"
        ) {

            AutomationEngine.init();

        }



        // =========================
        // DASHBOARD
        // =========================

        if (
            typeof DashboardEngine !== "undefined"
        ) {


            DashboardEngine.init();


            DashboardEngine.render(true);


        }



        Logger.log(
            "ERP INIT COMPLETE"
        );


    }


};


globalThis.SystemInit = SystemInit;