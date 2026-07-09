const SystemInit = {

    initialized: false,

    init() {

        if (this.initialized) {

            Logger.log("SYSTEM ALREADY INITIALIZED");
            return;

        }

        Logger.log("ERP INIT START");

        // =========================
        // SAFE CORE
        // =========================

        if (typeof SafeCore !== "undefined") {
            SafeCore.init();
        }

        // =========================
        // DATABASE SCHEMA
        // =========================

        if (typeof SchemaManager !== "undefined") {
            SchemaManager.init();
        }

        // =========================
        // EVENT SUBSCRIPTIONS
        // =========================

        if (typeof EventSubscriptions !== "undefined") {
            EventSubscriptions.initEventSubscriptions();
        }

        // =========================
        // DOMAIN EVENTS
        // =========================

        if (typeof TripEventHandler !== "undefined") {

            Logger.log("FOUND TripEventHandler");

            TripEventHandler.init();

            Logger.log("TripEventHandler initialized");

        }

        // =========================
        // FINANCE
        // =========================

        if (typeof FinanceEngine !== "undefined") {
            FinanceEngine.init();
        }

        // =========================
        // KPI
        // =========================

        if (typeof KPIEngine !== "undefined") {
            KPIEngine.init();
        }

        // =========================
        // AUTOMATION
        // =========================

        if (typeof AutomationEngine !== "undefined") {
            AutomationEngine.init();
        }

        // =========================
        // DASHBOARD
        // =========================

        if (typeof DashboardEngine !== "undefined") {
            DashboardEngine.init();
        }

        this.initialized = true;

        Logger.log("ERP INIT COMPLETE");

    }
// =========================
// MODULE REGISTRY
// =========================

if(typeof ModuleRegistry !== "undefined"){


    ModuleRegistry.register(
        "TripEventHandler",
        TripEventHandler
    );


    ModuleRegistry.register(
        "FinanceEngine",
        FinanceEngine
    );


    ModuleRegistry.register(
        "KPIEngine",
        KPIEngine
    );


    ModuleRegistry.register(
        "DashboardEngine",
        DashboardEngine
    );


    ModuleRegistry.initAll();


}
};


globalThis.SystemInit = SystemInit;