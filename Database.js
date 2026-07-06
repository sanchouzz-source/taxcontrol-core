const Database = {

    sheet(name) {
        return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
    },

    // =========================
    // INSERT
    // =========================
    insert(sheetName, data) {

        SchemaManager.init();

        const sheet = this.sheet(sheetName);
        const headers = sheet.getDataRange().getValues()[0];

        const row = headers.map(h => {

            if (h === "CreatedAt") return new Date();
            if (h === "UpdatedAt") return new Date();
            if (h === "Deleted") return false;

            return data[h] ?? "";
        });

        sheet.appendRow(row);

        return data;
    },

    // =========================
    // UPDATE
    // =========================
    update(sheetName, id, data) {

        SchemaManager.init();

        const sheet = this.sheet(sheetName);
        const values = sheet.getDataRange().getValues();
        const headers = values[0];

        const idField = SchemaRegistry.getIdField(sheetName);
        const idIndex = headers.indexOf(idField);

        if (idIndex === -1) {
            throw new Error("ID field not found: " + idField);
        }

        for (let i = 1; i < values.length; i++) {

            if (values[i][idIndex] === id) {

                data.UpdatedAt = new Date();

                const row = headers.map(h =>
                    data[h] !== undefined
                        ? data[h]
                        : values[i][headers.indexOf(h)]
                );

                sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);

                return data;
            }
        }

        throw new Error("Record not found: " + id);
    },

    // =========================
    // QUERY
    // =========================
    query(sheetName, filters = {}) {

        SchemaManager.init();

        const sheet = this.sheet(sheetName);
        const values = sheet.getDataRange().getValues();
        const headers = values[0];

        const org =
            PropertiesService.getScriptProperties().getProperty("CURRENT_ORG");

        const results = [];

        for (let i = 1; i < values.length; i++) {

            const row = {};

            headers.forEach((h, idx) => {
                row[h] = values[i][idx];
            });

            if (row.OrganizationID && row.OrganizationID !== org) {
                continue;
            }

            let ok = true;

            for (const k in filters) {
                if (row[k] != filters[k]) {
                    ok = false;
                    break;
                }
            }

            if (ok) results.push(row);
        }

        return results;
    }
};