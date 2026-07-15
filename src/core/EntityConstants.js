console.log("EntityConstants");



const EntityConstants = {



version:"0.5.0",




CLIENT:"CLIENT",

TRIP:"TRIP",

PAYMENT:"PAYMENT",

VEHICLE:"VEHICLE",

DRIVER:"DRIVER",

EMPLOYEE:"EMPLOYEE",

CLIENT_FINANCE_PROFILE:
"CLIENT_FINANCE_PROFILE",

TABLES:{


CLIENT:"Clients",

TRIP:"Trips",

PAYMENT:"Payments",

VEHICLE:"Vehicles",

DRIVER:"Drivers",

EMPLOYEE:"Employees",

CLIENT_FINANCE_PROFILE:
"CLIENT_FINANCE_PROFILE"
},




IDS:{


CLIENT:"ClientID",

TRIP:"TripID",

PAYMENT:"PaymentID",

VEHICLE:"VehicleID",

DRIVER:"DriverID",

EMPLOYEE:"EmployeeID",
CLIENT_FINANCE_PROFILE:
"CLIENT_FINANCE_PROFILE"


}



};




globalThis.EntityConstants =
EntityConstants;



console.log(
"EntityConstants READY v"
+
EntityConstants.version
);