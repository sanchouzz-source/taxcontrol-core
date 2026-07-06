function initSystem() {

    try {

        SchemaManager.init();

        EventSubscriptions.initEventSubscriptions();

        DashboardEngine.render(true);

        Logger.log("ERP SYSTEM READY");

    } catch (e) {
        Logger.log("BOOTSTRAP ERROR: " + e.message);
    }
}