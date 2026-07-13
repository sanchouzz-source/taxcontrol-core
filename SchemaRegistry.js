console.log("SchemaRegistry");


const SchemaRegistry = {


getIdField(sheet){


const map={


EventLog:"EventID",

AuditLog:"AuditID",

Organizations:"OrganizationID",

Clients:"ClientID",

Vehicles:"VehicleID",

Trips:"TripID",

Payments:"PaymentID",

FinancialTransactions:"TransactionID",

KPIMetrics:"KPIID"


};


return map[sheet];


}



};



globalThis.SchemaRegistry =
SchemaRegistry;