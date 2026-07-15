console.log("EntityConstants");



const EntityConstants = {



version:"0.5.0",




CLIENT:"CLIENT",

TRIP:"TRIP",

PAYMENT:"PAYMENT",

VEHICLE:"VEHICLE",

DRIVER:"DRIVER",

EMPLOYEE:"EMPLOYEE",



TABLES:{


CLIENT:"Clients",

TRIP:"Trips",

PAYMENT:"Payments",

VEHICLE:"Vehicles",

DRIVER:"Drivers",

EMPLOYEE:"Employees"


},




IDS:{


CLIENT:"ClientID",

TRIP:"TripID",

PAYMENT:"PaymentID",

VEHICLE:"VehicleID",

DRIVER:"DriverID",

EMPLOYEE:"EmployeeID"


}



};




globalThis.EntityConstants =
EntityConstants;



console.log(
"EntityConstants READY v"
+
EntityConstants.version
);