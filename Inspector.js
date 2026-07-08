const Inspector = {

    inspect() {

const modules = [

    "SchemaManager",
    "Database",
    "IdService",
    "EventBus",
    "EventStore",

    "AuditLog",
    "Versioning",

    "DashboardEngine",
    "ReportEngine",

    "ClientRepository",
    "TripRepository",
    "TripValidator",
    "ClientValidator",

    "SystemInit",
    "KPIRepository",
    "KPIService"

];

        Logger.log("========== ERP INSPECTOR ==========");

        modules.forEach(name => {

            if (typeof globalThis[name] === "undefined") {

                Logger.log("❌ " + name + " NOT FOUND");

            } else {

                Logger.log("✅ " + name + " OK");

            }

        });

        Logger.log("===================================");
    }

};
function inspectSystem() {
    Inspector.inspect();
}