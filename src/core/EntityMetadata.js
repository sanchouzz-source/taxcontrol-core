// ============================================================
// EntityMetadata v2.1.0
// TaxControl ERP Core
//
// Enterprise Entity Contract Registry
//
// Compatible:
// EntityRegistry v2.3+
// SchemaRegistry v4+
// EntityValidator v1+
// EntityService v5+
// BaseRepository v5.6+
// RepositoryFactory v2.7+
//
// Changes:
// - AUTO ID generation support
// - Repository binding
// - EntityService lifecycle compatible
// - Validation fixes
// - Extended client model
// ============================================================


console.log("EntityMetadata v2.1.0");



const EntityMetadata = {


version:"2.1.0",

apiVersion:"2.0",


architecture:
"EntityMetadata -> EntityRegistry -> SchemaRegistry -> Repository",


initialized:false,

locked:false,


strictMode:true,


allowTestEntityRegistration:true,





// ============================================================
// CLIENT
// ============================================================


CLIENT:{


entity:"CLIENT",


table:"Clients",


repository:"ClientRepository",


repositoryContract:
"BaseRepositoryV5",


idField:"ClientID",


idPrefix:"CLI",


idGeneration:{


strategy:"AUTO",


service:"IdService"


},



module:"crm",


version:2,


softDelete:true,


timestamps:true,


audit:true,


versioning:true,



fields:[



{
name:"ClientID",
type:"ID",
required:false,
generated:true
},



{
name:"OrganizationID",
type:"REFERENCE",
required:true
},



{
name:"Name",
type:"STRING",
required:true
},



{
name:"INN",
type:"STRING",
unique:true
},



{
name:"Phone",
type:"STRING"
},



{
name:"Email",
type:"STRING"
},



// добавлено для KPI/CRM

{
name:"ManagerID",
type:"REFERENCE"
},



{
name:"Rating",
type:"NUMBER",
default:0
},



{
name:"Address",
type:"STRING"
},



{
name:"Status",
type:"ENUM",
default:"ACTIVE"
},



{
name:"CreatedBy",
type:"REFERENCE"
},



{
name:"UpdatedBy",
type:"REFERENCE"
},



{
name:"CreatedAt",
type:"DATETIME"
},



{
name:"UpdatedAt",
type:"DATETIME"
},



{
name:"Deleted",
type:"BOOLEAN",
default:false
}



],



relations:{



OrganizationID:{

entity:"ORGANIZATION",

type:"MANY_TO_ONE"

},



ManagerID:{

entity:"USER",

type:"MANY_TO_ONE"

}



},



permissions:{


create:"CLIENT_CREATE",

read:"CLIENT_READ",

update:"CLIENT_UPDATE",

delete:"CLIENT_DELETE"


},



events:{


created:"CLIENT_CREATED",

updated:"CLIENT_UPDATED",

deleted:"CLIENT_DELETED",

restored:"CLIENT_RESTORED"


}



},




// ============================================================
// TRIP
// ============================================================


TRIP:{


entity:"TRIP",


table:"Trips",


repository:"TripRepository",


repositoryContract:
"BaseRepositoryV5",


idField:"TripID",


idPrefix:"TRP",


idGeneration:{


strategy:"AUTO",


service:"IdService"


},


module:"transport",


version:2,


softDelete:true,


timestamps:true,


audit:true,


versioning:true,



fields:[


{
name:"TripID",
type:"ID",
required:false,
generated:true
},


{
name:"OrganizationID",
type:"REFERENCE",
required:true
},


{
name:"ClientID",
type:"REFERENCE"
},


{
name:"VehicleID",
type:"REFERENCE"
},


{
name:"DriverID",
type:"REFERENCE"
},


{
name:"RouteID",
type:"REFERENCE"
},


{
name:"CarrierID",
type:"REFERENCE"
},


{
name:"TransportOrderID",
type:"REFERENCE"
},


{
name:"ManagerID",
type:"REFERENCE"
},


{
name:"LogistID",
type:"REFERENCE"
},


{
name:"Revenue",
type:"NUMBER",
default:0
},


{
name:"PlannedCost",
type:"NUMBER",
default:0
},


{
name:"ActualCost",
type:"NUMBER",
default:0
},


{
name:"Status",
type:"ENUM",
default:"NEW"
},


{
name:"CreatedAt",
type:"DATETIME"
},


{
name:"UpdatedAt",
type:"DATETIME"
},


{
name:"Deleted",
type:"BOOLEAN",
default:false
}


],



relations:{


ClientID:{
entity:"CLIENT",
type:"MANY_TO_ONE"
},


OrganizationID:{
entity:"ORGANIZATION",
type:"MANY_TO_ONE"
}


},



events:{


created:"TRIP_CREATED",

updated:"TRIP_UPDATED",

deleted:"TRIP_DELETED",

completed:"TRIP_COMPLETED"


}



},


// ============================================================
// ORGANIZATION
// ============================================================


ORGANIZATION:{


entity:"ORGANIZATION",

table:"Organizations",

repository:"OrganizationRepository",

repositoryContract:
"BaseRepositoryV5",


idField:"OrganizationID",

idPrefix:"ORG",


idGeneration:{

strategy:"AUTO",

service:"IdService"

},


module:"core",


version:2,


fields:[


{
name:"OrganizationID",
type:"ID",
required:false,
generated:true
},


{
name:"Name",
type:"STRING",
required:true
},


{
name:"INN",
type:"STRING",
unique:true
},


{
name:"KPP",
type:"STRING"
},


{
name:"Type",
type:"ENUM"
},


{
name:"TaxSystem",
type:"ENUM"
},


{
name:"CreatedAt",
type:"DATETIME"
},


{
name:"UpdatedAt",
type:"DATETIME"
},


{
name:"Deleted",
type:"BOOLEAN",
default:false
}


],



permissions:{


create:"ORGANIZATION_CREATE",

read:"ORGANIZATION_READ",

update:"ORGANIZATION_UPDATE",

delete:"ORGANIZATION_DELETE"


},


events:{


created:"ORGANIZATION_CREATED",

updated:"ORGANIZATION_UPDATED",

deleted:"ORGANIZATION_DELETED"


}



},







// ============================================================
// TRANSPORT ORDER
// ============================================================


TRANSPORT_ORDER:{


entity:"TRANSPORT_ORDER",


table:"TransportOrders",


repository:"TransportOrderRepository",


repositoryContract:
"BaseRepositoryV5",



idField:"TransportOrderID",


idPrefix:"ORD",



idGeneration:{

strategy:"AUTO",

service:"IdService"

},



module:"transport",


version:2,


softDelete:true,



fields:[


{
name:"TransportOrderID",
type:"ID",
required:false,
generated:true
},


{
name:"OrganizationID",
type:"REFERENCE",
required:true
},


{
name:"ClientID",
type:"REFERENCE",
required:true
},


{
name:"CarrierID",
type:"REFERENCE"
},


{
name:"RouteID",
type:"REFERENCE"
},


{
name:"CargoID",
type:"REFERENCE"
},


{
name:"Status",
type:"ENUM",
default:"NEW"
},


{
name:"OrderDate",
type:"DATE"
},


{
name:"Price",
type:"NUMBER",
default:0
},


{
name:"Comment",
type:"STRING"
},


{
name:"CreatedAt",
type:"DATETIME"
},


{
name:"UpdatedAt",
type:"DATETIME"
},


{
name:"Deleted",
type:"BOOLEAN",
default:false
}



],



relations:{


ClientID:{

entity:"CLIENT",

type:"MANY_TO_ONE"

},


CarrierID:{

entity:"CARRIER",

type:"MANY_TO_ONE"

}


},



events:{


created:
"TRANSPORT_ORDER_CREATED",


updated:
"TRANSPORT_ORDER_UPDATED",


deleted:
"TRANSPORT_ORDER_DELETED",


restored:
"TRANSPORT_ORDER_RESTORED"


}



},







// ============================================================
// VEHICLE
// ============================================================


VEHICLE:{


entity:"VEHICLE",


table:"Vehicles",


repository:"VehicleRepository",


repositoryContract:
"BaseRepositoryV5",



idField:"VehicleID",

idPrefix:"CAR",


idGeneration:{

strategy:"AUTO",

service:"IdService"

},



module:"transport",



fields:[


{
name:"VehicleID",
type:"ID",
required:false,
generated:true
},


{
name:"OrganizationID",
type:"REFERENCE"
},


{
name:"Number",
type:"STRING",
required:true
},


{
name:"Brand",
type:"STRING"
},


{
name:"Model",
type:"STRING"
},


{
name:"VIN",
type:"STRING"
},


{
name:"Year",
type:"NUMBER"
},


{
name:"Mileage",
type:"NUMBER",
default:0
},


{
name:"Status",
type:"ENUM",
default:"ACTIVE"
},


{
name:"CreatedAt",
type:"DATETIME"
},


{
name:"UpdatedAt",
type:"DATETIME"
},


{
name:"Deleted",
type:"BOOLEAN",
default:false
}


],



events:{


created:"VEHICLE_CREATED",

updated:"VEHICLE_UPDATED",

deleted:"VEHICLE_DELETED"


}



},







// ============================================================
// DRIVER
// ============================================================


DRIVER:{


entity:"DRIVER",

table:"Drivers",


repository:"DriverRepository",


repositoryContract:
"BaseRepositoryV5",



idField:"DriverID",

idPrefix:"DRV",


idGeneration:{

strategy:"AUTO",

service:"IdService"

},



module:"transport",



fields:[


{
name:"DriverID",
type:"ID",
required:false,
generated:true
},


{
name:"OrganizationID",
type:"REFERENCE"
},


{
name:"FullName",
type:"STRING",
required:true
},


{
name:"Phone",
type:"STRING"
},


{
name:"LicenseNumber",
type:"STRING"
},


{
name:"Status",
type:"ENUM",
default:"ACTIVE"
},


{
name:"CreatedAt",
type:"DATETIME"
},


{
name:"UpdatedAt",
type:"DATETIME"
},


{
name:"Deleted",
type:"BOOLEAN",
default:false
}


],



events:{


created:"DRIVER_CREATED",

updated:"DRIVER_UPDATED",

deleted:"DRIVER_DELETED"


}



},


// ============================================================
// CARRIER
// ============================================================


CARRIER:{


entity:"CARRIER",

table:"Carriers",

repository:"CarrierRepository",

repositoryContract:
"BaseRepositoryV5",


idField:"CarrierID",

idPrefix:"CARIER",


idGeneration:{
strategy:"AUTO",
service:"IdService"
},


module:"transport",

version:2,


fields:[


{
name:"CarrierID",
type:"ID",
required:false,
generated:true
},


{
name:"OrganizationID",
type:"REFERENCE",
required:true
},


{
name:"Name",
type:"STRING",
required:true
},


{
name:"INN",
type:"STRING"
},


{
name:"Phone",
type:"STRING"
},


{
name:"Email",
type:"STRING"
},


{
name:"Status",
type:"ENUM",
default:"ACTIVE"
},


{
name:"CreatedAt",
type:"DATETIME"
},


{
name:"UpdatedAt",
type:"DATETIME"
},


{
name:"Deleted",
type:"BOOLEAN",
default:false
}


],


events:{


created:"CARRIER_CREATED",

updated:"CARRIER_UPDATED",

deleted:"CARRIER_DELETED",

restored:"CARRIER_RESTORED"


}



},







// ============================================================
// CARGO
// ============================================================


CARGO:{


entity:"CARGO",

table:"Cargo",

repository:"CargoRepository",

repositoryContract:
"BaseRepositoryV5",


idField:"CargoID",

idPrefix:"CRG",


idGeneration:{
strategy:"AUTO",
service:"IdService"
},


module:"transport",


fields:[


{
name:"CargoID",
type:"ID",
generated:true
},


{
name:"OrganizationID",
type:"REFERENCE"
},


{
name:"Name",
type:"STRING",
required:true
},


{
name:"Description",
type:"STRING"
},


{
name:"Weight",
type:"NUMBER",
default:0
},


{
name:"Volume",
type:"NUMBER",
default:0
},


{
name:"Unit",
type:"STRING"
},


{
name:"CreatedAt",
type:"DATETIME"
},


{
name:"UpdatedAt",
type:"DATETIME"
},


{
name:"Deleted",
type:"BOOLEAN",
default:false
}


],



events:{


created:"CARGO_CREATED",

updated:"CARGO_UPDATED",

deleted:"CARGO_DELETED"


}



},







// ============================================================
// ROUTE
// ============================================================


ROUTE:{


entity:"ROUTE",

table:"Routes",


repository:"RouteRepository",


repositoryContract:
"BaseRepositoryV5",



idField:"RouteID",

idPrefix:"RTE",


idGeneration:{
strategy:"AUTO",
service:"IdService"
},



module:"transport",



fields:[


{
name:"RouteID",
type:"ID",
generated:true
},


{
name:"OrganizationID",
type:"REFERENCE"
},


{
name:"Name",
type:"STRING",
required:true
},


{
name:"From",
type:"STRING"
},


{
name:"To",
type:"STRING"
},


{
name:"Distance",
type:"NUMBER"
},


{
name:"Duration",
type:"NUMBER"
},


{
name:"CreatedAt",
type:"DATETIME"
},


{
name:"UpdatedAt",
type:"DATETIME"
},


{
name:"Deleted",
type:"BOOLEAN",
default:false
}


],



events:{


created:"ROUTE_CREATED",

updated:"ROUTE_UPDATED",

deleted:"ROUTE_DELETED"


}



},







// ============================================================
// FINANCIAL TRANSACTION
// ============================================================


FINANCIAL_TRANSACTION:{


entity:"FINANCIAL_TRANSACTION",


table:"FinancialTransactions",


repository:"FinancialTransactionRepository",


repositoryContract:
"BaseRepositoryV5",



idField:"TransactionID",


idPrefix:"FIN",



idGeneration:{
strategy:"AUTO",
service:"IdService"
},



module:"finance",


version:2,



fields:[


{
name:"TransactionID",
type:"ID",
generated:true
},


{
name:"OrganizationID",
type:"REFERENCE",
required:true
},


{
name:"ClientID",
type:"REFERENCE"
},


{
name:"TripID",
type:"REFERENCE"
},


{
name:"Type",
type:"ENUM",
required:true
},


{
name:"Amount",
type:"NUMBER",
required:true,
default:0
},


{
name:"Direction",
type:"ENUM"
},


{
name:"Date",
type:"DATE"
},


{
name:"Comment",
type:"STRING"
},


{
name:"CreatedAt",
type:"DATETIME"
},


{
name:"UpdatedAt",
type:"DATETIME"
}


],



events:{


created:
"FINANCIAL_TRANSACTION_CREATED",


updated:
"FINANCIAL_TRANSACTION_UPDATED"


}



},







// ============================================================
// CLIENT FINANCE PROFILE
// ============================================================


CLIENT_FINANCE_PROFILE:{


entity:"CLIENT_FINANCE_PROFILE",


table:"ClientFinanceProfiles",


repository:
"ClientFinanceProfileRepository",


repositoryContract:
"BaseRepositoryV5",



idField:"ProfileID",


idPrefix:"CFP",



module:"finance",



fields:[


{
name:"ProfileID",
type:"ID",
generated:true
},


{
name:"ClientID",
type:"REFERENCE",
required:true
},


{
name:"CreditLimit",
type:"NUMBER",
default:0
},


{
name:"Debt",
type:"NUMBER",
default:0
},


{
name:"PaymentTerms",
type:"NUMBER"
},


{
name:"Status",
type:"ENUM",
default:"ACTIVE"
},


{
name:"CreatedAt",
type:"DATETIME"
},


{
name:"UpdatedAt",
type:"DATETIME"
}


],



events:{


created:
"CLIENT_FINANCE_PROFILE_CREATED",


updated:
"CLIENT_FINANCE_PROFILE_UPDATED"


}



},







// ============================================================
// KPI
// ============================================================


KPI:{


entity:"KPI",


table:"KPI",


repository:"KPIRepository",


repositoryContract:
"BaseRepositoryV5",



idField:"KPIID",


idPrefix:"KPI",



module:"analytics",



fields:[


{
name:"KPIID",
type:"ID",
generated:true
},


{
name:"OrganizationID",
type:"REFERENCE"
},


{
name:"Name",
type:"STRING",
required:true
},


{
name:"Value",
type:"NUMBER",
default:0
},


{
name:"Period",
type:"STRING"
},


{
name:"Category",
type:"STRING"
},


{
name:"CreatedAt",
type:"DATETIME"
}


],



events:{


created:"KPI_CREATED",

updated:"KPI_UPDATED"


}



},


// ============================================================
// AUDIT
// ============================================================


AUDIT:{


entity:"AUDIT",

table:"AuditLog",

repository:"AuditRepository",

repositoryContract:
"BaseRepositoryV5",


idField:"AuditID",

idPrefix:"AUD",


module:"system",



fields:[


{
name:"AuditID",
type:"ID",
generated:true
},


{
name:"OrganizationID",
type:"REFERENCE"
},


{
name:"Entity",
type:"STRING",
required:true
},


{
name:"EntityID",
type:"STRING",
required:true
},


{
name:"Action",
type:"ENUM",
required:true
},


{
name:"Before",
type:"OBJECT"
},


{
name:"After",
type:"OBJECT"
},


{
name:"UserID",
type:"STRING"
},


{
name:"CreatedAt",
type:"DATETIME"
}


],



events:{


created:"AUDIT_CREATED"


}



},







// ============================================================
// VERSION
// ============================================================


VERSION:{


entity:"VERSION",

table:"EntityVersions",

repository:"VersionRepository",

repositoryContract:
"BaseRepositoryV5",



idField:"VersionID",

idPrefix:"VER",



module:"system",



fields:[


{
name:"VersionID",
type:"ID",
generated:true
},


{
name:"Entity",
type:"STRING",
required:true
},


{
name:"EntityID",
type:"STRING",
required:true
},


{
name:"Version",
type:"NUMBER",
default:1
},


{
name:"Snapshot",
type:"OBJECT"
},


{
name:"CreatedAt",
type:"DATETIME"
}


],



events:{


created:"VERSION_CREATED"


}



}
