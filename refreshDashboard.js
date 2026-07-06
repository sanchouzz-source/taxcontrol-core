function onOpen() {

    SpreadsheetApp.getUi()
        .createMenu("ERP SYSTEM")
        .addItem("Initialize System", "initSystem")
        .addItem("Refresh Dashboard", "refreshDashboard")
        .addItem("System Health Check", "systemHealthCheck")
        .addItem("Detect Duplicates", "runDuplicateCheck")
        .addItem("Inspect System", "inspectSystem")
        .addToUi();
}