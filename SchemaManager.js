const SchemaManager = {

    schemaVersion: "0.1",
    initialized: false,

    init() {

        const schema = this.getSchema();

        this.createSheets(schema);
        this.syncSheets(schema);

        this.initialized = true;
    },

    getSchema() {
        return {
            EventLog: [
    "EventID",
    "EventType",
    "Payload",
    "CreatedAt",
    "OrganizationID"
],
            Organizations: [
                "OrganizationID",
                "ShortName",
                "FullName",
                "INN",
                "KPP",
                "OGRN",
                "TaxSystem",
                "Status",
                "CreatedAt",
                "UpdatedAt",
                "Deleted"
            ],

            Clients: [
                "ClientID",
                "OrganizationID",
                "Name",
                "INN",
                "Phone",
                "Email",
                "Address",
                "ManagerID",
                "Rating",
                "Status",
                "CreatedAt",
                "UpdatedAt",
                "Deleted"
            ],

            Vehicles: [
                "VehicleID",
                "OrganizationID",
                "PlateNumber",
                "Brand",
                "Model",
                "VIN",
                "DriverID",
                "Status",
                "CreatedAt",
                "UpdatedAt",
                "Deleted"
            ],

            Trips: [
                "TripID",
                "OrganizationID",
                "ClientID",
                "VehicleID",
                "DriverID",
                "ManagerID",
                "LoadingPoint",
                "UnloadingPoint",
                "Distance",
                "Cargo",
                "Revenue",
                "PlannedCost",
                "ActualCost",
                "Margin",
                "Expedition",
                "CarrierID",
                "MailTrack",
                "Status",
                "CreatedAt",
                "UpdatedAt",
                "Deleted"
            ],

            Payments: [
                "PaymentID",
                "OrganizationID",
                "InvoiceID",
                "TripID",
                "Amount",
                "PaymentDate",
                "PaymentMethod",
                "Type",
                "CreatedAt",
                "UpdatedAt",
                "Deleted"
            ]
        };
    },

    createSheets(schema) {

        const ss = SpreadsheetApp.getActiveSpreadsheet();

        Object.keys(schema).forEach(sheetName => {

            let sheet = ss.getSheetByName(sheetName);

            if (!sheet) {

                sheet = ss.insertSheet(sheetName);

                sheet.getRange(1, 1, 1, schema[sheetName].length)
                    .setValues([schema[sheetName]]);

                Logger.log("Created sheet: " + sheetName);
            }
        });
    },

    syncSheets(schema) {

        const ss = SpreadsheetApp.getActiveSpreadsheet();

        Object.keys(schema).forEach(sheetName => {

            const sheet = ss.getSheetByName(sheetName);
            if (!sheet) return;

            const headers = sheet
                .getRange(1, 1, 1, sheet.getLastColumn())
                .getValues()[0];

            const required = schema[sheetName];

            required.forEach(col => {

                if (headers.indexOf(col) === -1) {
                    sheet.getRange(1, headers.length + 1).setValue(col);
                    headers.push(col);
                }
            });
        });
    }
};
globalThis.SchemaManager = SchemaManager;