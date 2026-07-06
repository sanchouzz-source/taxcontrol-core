const Registry = {

    prefixes: {
        Organization: "ORG",
        Client: "CLI",
        Employee: "EMP",
        Vehicle: "VEH",
        Driver: "DRV",
        Trip: "TRP",
        Payment: "PAY",
        Document: "DOC"
    },

    countersSheet: "_IDRegistry",

    init() {
        this.ensureSheet();
    },

    ensureSheet() {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        let sheet = ss.getSheetByName(this.countersSheet);

        if (!sheet) {
            sheet = ss.insertSheet(this.countersSheet);
            sheet.appendRow(["Entity", "LastNumber"]);
        }
    }
};
//генерация ID
Registry.generate = function(entity) {

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(this.countersSheet);

    const data = sheet.getDataRange().getValues();

    let rowIndex = -1;
    let lastNumber = 0;

    for (let i = 1; i < data.length; i++) {

        if (data[i][0] === entity) {
            rowIndex = i;
            lastNumber = data[i][1];
            break;
        }
    }

    lastNumber = Number(lastNumber) + 1;

    const prefix = this.prefixes[entity];
    const id = prefix + String(lastNumber).padStart(6, "0");

    if (rowIndex === -1) {
        sheet.appendRow([entity, lastNumber]);
    } else {
        sheet.getRange(rowIndex + 1, 2).setValue(lastNumber);
    }

    return id;
};