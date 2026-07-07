function testTripHistoryCheck(){

Logger.log(
"===== TRIP HISTORY CHECK ====="
);


const tripId = "TRP000016";


// Проверяем Versions

const versions =
SpreadsheetApp
.getActive()
.getSheetByName("Versions");


const versionRows =
versions.getDataRange().getValues();


versionRows.forEach(row => {

    if(row[4] === tripId){

        Logger.log(
        "VERSION FOUND:"
        );

        Logger.log(
        JSON.stringify(row)
        );

    }

});


// Проверяем AuditLog

const audit =
SpreadsheetApp
.getActive()
.getSheetByName("AuditLog");


const auditRows =
audit.getDataRange().getValues();


auditRows.forEach(row => {

    if(
        row[5] === "UPDATE"
        &&
        row[6] === "TRIP"
    ){

        Logger.log(
        "AUDIT FOUND:"
        );

        Logger.log(
        JSON.stringify(row)
        );

    }

});


Logger.log(
"===== HISTORY CHECK COMPLETE ====="
);

}