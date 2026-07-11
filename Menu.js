function onOpen() {

    startERP();

    SpreadsheetApp.getUi()
        .createMenu("ERP SYSTEM")
        .addItem("Initialize System", "initSystem")
        .addSeparator()
        .addItem("Refresh Dashboard", "refreshDashboard")
        .addSeparator()
        .addItem("System Health Check", "systemHealthCheck")
        .addItem("Inspect System", "inspectSystem")
        .addItem("Detect Duplicates", "runDuplicateCheck")
        .addToUi();

}