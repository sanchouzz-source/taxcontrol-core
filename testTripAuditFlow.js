function testTripAuditFlow(){


Logger.log(
"===== TRIP AUDIT FLOW ====="
);


const trip =
TripRepository.create({

    ClientID:"CLI000014",

    Cargo:"Audit Test",

    Revenue:50000,

    ActualCost:30000

});


Logger.log(
"CREATED:"
);

Logger.log(
trip.TripID
);



TripRepository.update(

    trip.TripID,

    {

        ActualCost:35000,

        Status:"COMPLETED"

    }

);


Logger.log(
"UPDATED:"
);



const versions =
SpreadsheetApp
.getActive()
.getSheetByName("Versions")
.getDataRange()
.getValues();


versions.forEach(row=>{

    if(row[4] === trip.TripID){

        Logger.log(
        "VERSION FOUND:"
        );

        Logger.log(
        JSON.stringify(row)
        );

    }

});


const audit =
SpreadsheetApp
.getActive()
.getSheetByName("AuditLog")
.getDataRange()
.getValues();


audit.forEach(row=>{

    if(row[5]==="UPDATE"
       &&
       row[6]==="TRIP"){

        Logger.log(
        "AUDIT FOUND:"
        );

        Logger.log(
        JSON.stringify(row)
        );

    }

});


Logger.log(
"===== AUDIT COMPLETE ====="
);

}