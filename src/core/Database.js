console.log("Database");
const Database = {


    sheet(name) {

        return SpreadsheetApp
            .getActiveSpreadsheet()
            .getSheetByName(name);

    },


    getSheetOrThrow(name) {

        const sheet = this.sheet(name);


        if (!sheet) {

            throw new Error(
                "Sheet not found: " + name
            );

        }


        return sheet;

    },

    // =========================
    // INSERT
    // =========================
    insert(sheetName, data) {

    SchemaManager.init();

    const sheet = this.getSheetOrThrow(sheetName);

    const headers = sheet.getDataRange().getValues()[0];


    const idField = SchemaRegistry.getIdField(sheetName);

    const idIndex = headers.indexOf(idField);


    if (idIndex !== -1 && data[idField]) {

        const existing =
            sheet.getDataRange().getValues();


        for (let i = 1; i < existing.length; i++) {

            if (String(existing[i][idIndex]).trim()
===
String(data[idField]).trim()) {

                throw new Error(
                    "Duplicate ID detected: "
                    + data[idField]
                );

            }

        }

    }


    const row = headers.map(h => {

        if (h === "CreatedAt") return new Date();

        if (h === "UpdatedAt") return new Date();

        if (h === "Deleted") return false;

        return data[h] ?? "";

    });


    const nextRow = sheet.getLastRow() + 1;

sheet
    .getRange(
        nextRow,
        1,
        1,
        row.length
    )
    .setValues([row]);

    return data;
},

    // =========================
    // UPDATE
    // =========================
    update(sheetName, id, data) {

        SchemaManager.init();
        const sheet = this.getSheetOrThrow(sheetName);    
        //const sheet = this.sheet(sheetName);
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
//
const row = headers.map(h => {

    if (h === "UpdatedAt") {
        return new Date();
    }


    if (h === "Deleted") {
        return false;
    }


    return data[h] !== undefined
        ? data[h]
        : values[i][headers.indexOf(h)];

});
//
                sheet
    .getRange(
        i + 1,
        1,
        1,
        row.length
    )
    .setNumberFormat("@")
    .setValues([row]);

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
        const sheet = this.getSheetOrThrow(sheetName);
        //const sheet = this.sheet(sheetName);
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
    },
        // =========================
    // FIND BY ID
    // =========================
        find(sheetName, id) {

        SchemaManager.init();

        const sheet = this.getSheetOrThrow(sheetName);

        const values =
            sheet.getDataRange().getValues();

        const headers = values[0];


        const idField =
            SchemaRegistry.getIdField(sheetName);


        const idIndex =
            headers.indexOf(idField);


        if (idIndex === -1) {

            throw new Error(
                "ID field not found: " + idField
            );

        }


        for (let i = 1; i < values.length; i++) {


            if (values[i][idIndex] === id) {


                const row = {};


                headers.forEach((h,index)=>{

                    row[h] =
                        values[i][index];

                });


                return row;

            }

        }


        return null;

    },


    // =========================
    // HEALTH CHECK
    // =========================

    health(){


        try{


            const ss =
                SpreadsheetApp
                .getActiveSpreadsheet();



            return {


                status:
                    ss
                    ?
                    "OK"
                    :
                    "ERROR",


                module:
                    "Database",


                spreadsheet:
                    ss.getName(),


                timestamp:
                    new Date()


            };


        }
        catch(e){


            return {


                status:"ERROR",

                module:"Database",

                message:
                    e.message,


                timestamp:
                    new Date()


            };


        }


    }


};


globalThis.Database = Database;