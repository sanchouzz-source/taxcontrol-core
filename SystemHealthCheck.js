function systemHealthCheck() {

    const report = {
        EventBus: typeof EventBus !== "undefined",
        Database: typeof Database !== "undefined",
        IdService: typeof IdService !== "undefined",
        SchemaManager: typeof SchemaManager !== "undefined",
        EventStore: typeof EventStore !== "undefined",
        DashboardEngine: typeof DashboardEngine !== "undefined"
    };

    Logger.log("===== ERP SYSTEM HEALTH CHECK =====");

    for (const key in report) {

        if (report[key]) {
            Logger.log("OK  - " + key);
        } else {
            Logger.log("FAIL - " + key + " (MISSING)");
        }
    }

    Logger.log("===================================");
}