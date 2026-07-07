const DashboardEngine = {

    sheetName: "Dashboard",

    // =========================
    // MAIN ENTRY
    // =========================
    render() {

        const ss = SpreadsheetApp.getActiveSpreadsheet();

        let sheet = ss.getSheetByName(this.sheetName);

        if (!sheet) {
            sheet = ss.insertSheet(this.sheetName);
        }

        sheet.clear();

        this._writeHeader(sheet);
        this._writeClientsKPI(sheet);
        this._writeTripsKPI(sheet);
        this._writeManagerKPI(sheet);
    },

    // =========================
    // HEADER
    // =========================
    _writeHeader(sheet) {

        sheet.getRange(1, 1).setValue("ERP DASHBOARD");
        sheet.getRange(1, 1, 1, 4)
            .setFontSize(16)
            .setFontWeight("bold");
    },

    // =========================
    // CLIENT KPI
    // =========================
    _writeClientsKPI(sheet) {

        const kpi = ReportEngine.clientsKPI();

        sheet.getRange(3, 1).setValue("Clients KPI");
        sheet.getRange(4, 1).setValue("Total");
        sheet.getRange(4, 2).setValue(kpi.total);

        sheet.getRange(5, 1).setValue("Active");
        sheet.getRange(5, 2).setValue(kpi.active);

        sheet.getRange(6, 1).setValue("Deleted");
        sheet.getRange(6, 2).setValue(kpi.deleted);
    },

    // =========================
    // TRIPS KPI
    // =========================
    _writeTripsKPI(sheet) {

        const kpi = ReportEngine.tripsKPI();

        sheet.getRange(8, 1).setValue("Trips KPI");

        sheet.getRange(9, 1).setValue("Total Trips");
        sheet.getRange(9, 2).setValue(kpi.totalTrips);

        sheet.getRange(10, 1).setValue("Revenue");
        sheet.getRange(10, 2).setValue(kpi.revenue);

        sheet.getRange(11, 1).setValue("Cost");
        sheet.getRange(11, 2).setValue(kpi.cost);

        sheet.getRange(12, 1).setValue("Margin");
        sheet.getRange(12, 2).setValue(kpi.margin);
    },

    // =========================
    // MANAGER KPI
    // =========================
    _writeManagerKPI(sheet) {

        const data = ReportEngine.managerKPI();

        sheet.getRange(14, 1).setValue("Manager KPI");

        const headers = ["ManagerID", "Trips", "Revenue", "Cost", "Margin"];

        sheet.getRange(15, 1, 1, headers.length)
            .setValues([headers])
            .setFontWeight("bold");

        const rows = data.map(m => [
            m.ManagerID,
            m.Trips,
            m.Revenue,
            m.Cost,
            m.Margin
        ]);

        if (rows.length > 0) {
            sheet.getRange(16, 1, rows.length, headers.length)
                .setValues(rows);
        }
    }
};
globalThis.DashboardEngine = DashboardEngine;