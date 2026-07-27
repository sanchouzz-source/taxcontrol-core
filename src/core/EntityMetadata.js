// ============================================================
// EntityMetadata v3.0.0
// Enterprise Entity Contract Registry
// TaxControl ERP Core
//
// Sprint 1.2 DATA MODEL REFACTOR
//
// Compatible:
// EntityRegistry v2.4+
// SchemaRegistry v4+
// SchemaManager v4+
// EntityValidator v2+
// EntityService v5.2+
// BaseRepository v5.7.3
// ============================================================


console.log("EntityMetadata v3.0.0");



const EntityMetadata = {


version:"3.0.0",

apiVersion:"3.0",


architecture:
"EntityMetadata -> SchemaRegistry -> EntityRegistry -> Repository",


initialized:false,

locked:false,


entities:{},




strictMode:true,





// ============================================================
// CLIENT
// ============================================================


CLIENT:{


entity:"CLIENT",


module:"CRM",


table:"Clients",


repository:"ClientRepository",


idField:"ClientID",


idPrefix:"CLI",


softDelete:true,


timestamps:true,


audit:true,


versioning:true,



permissions:{


create:"CLIENT_CREATE",

read:"CLIENT_READ",

update:"CLIENT_UPDATE",

delete:"CLIENT_DELETE",

restore:"CLIENT_RESTORE"


},




events:{


created:"CLIENT_CREATED",

updated:"CLIENT_UPDATED",

deleted:"CLIENT_DELETED",

restored:"CLIENT_RESTORED"


},





fields:{



ClientID:{


type:"ID",

generated:true

},



OrganizationID:{


type:"REFERENCE",

required:true,

reference:"ORGANIZATION"

},



Name:{


type:"STRING",

required:true

},



INN:{


type:"STRING",

unique:true

},



Phone:{


type:"STRING"

},



Email:{


type:"STRING"

},



ManagerID:{


type:"REFERENCE",

reference:"USER"

},



Rating:{


type:"NUMBER",

default:0

},



Address:{


type:"STRING"

},



Status:{


type:"ENUM",

default:"ACTIVE"

},



CreatedBy:{


type:"REFERENCE"

},



UpdatedBy:{


type:"REFERENCE"

},



CreatedAt:{


type:"DATETIME"

},



UpdatedAt:{


type:"DATETIME"

},



Deleted:{


type:"BOOLEAN",

default:false

}



}



},







// ============================================================
// ORGANIZATION
// ============================================================


ORGANIZATION:{


entity:"ORGANIZATION",

module:"CORE",


table:"Organizations",


repository:"OrganizationRepository",


idField:"OrganizationID",


idPrefix:"ORG",


softDelete:true,


timestamps:true,


audit:true,



fields:{



OrganizationID:{


type:"ID",

generated:true

},



Name:{


type:"STRING",

required:true

},



INN:{


type:"STRING",

unique:true

},



KPP:{


type:"STRING"

},



Type:{


type:"ENUM"

},



TaxSystem:{


type:"ENUM"

},



CreatedAt:{


type:"DATETIME"

},



UpdatedAt:{


type:"DATETIME"

},



Deleted:{


type:"BOOLEAN",

default:false

}



}


},







// ============================================================
// USER
// ============================================================


USER:{


entity:"USER",

module:"CORE",


table:"Users",


repository:"UserRepository",


idField:"UserID",


idPrefix:"USR",


softDelete:true,


timestamps:true,



fields:{



UserID:{


type:"ID",

generated:true

},



OrganizationID:{


type:"REFERENCE",

reference:"ORGANIZATION"

},



Name:{


type:"STRING",

required:true

},



Email:{


type:"STRING",

unique:true

},



Role:{


type:"ENUM",

default:"USER"

},



Status:{


type:"ENUM",

default:"ACTIVE"

},



CreatedAt:{


type:"DATETIME"

},



UpdatedAt:{


type:"DATETIME"

},



Deleted:{


type:"BOOLEAN",

default:false

}



}



},







// ============================================================
// TRIP
// ============================================================


TRIP:{


entity:"TRIP",


module:"LOGISTICS",


table:"Trips",


repository:"TripRepository",


idField:"TripID",


idPrefix:"TRP",


softDelete:true,


timestamps:true,


audit:true,


versioning:true,



events:{


created:"TRIP_CREATED",

updated:"TRIP_UPDATED",

deleted:"TRIP_DELETED",

restored:"TRIP_RESTORED"


},




fields:{



TripID:{


type:"ID",

generated:true

},



OrganizationID:{


type:"REFERENCE",

required:true,

reference:"ORGANIZATION"

},



ClientID:{


type:"REFERENCE",

reference:"CLIENT"

},



VehicleID:{


type:"REFERENCE",

reference:"VEHICLE"

},



DriverID:{


type:"REFERENCE",

reference:"DRIVER"

},



CarrierID:{


type:"REFERENCE",

reference:"CARRIER"

},



RouteID:{


type:"REFERENCE",

reference:"ROUTE"

},



TransportOrderID:{


type:"REFERENCE",

reference:"TRANSPORT_ORDER"

},



ManagerID:{


type:"REFERENCE",

reference:"USER"

},



LogistID:{


type:"REFERENCE",

reference:"USER"

},



// новые поля ERP транспорта


LoadingPoint:{


type:"STRING"

},



UnloadingPoint:{


type:"STRING"

},



Distance:{


type:"NUMBER",

default:0

},



Cargo:{


type:"STRING"

},



Revenue:{


type:"NUMBER",

default:0

},



PlannedCost:{


type:"NUMBER",

default:0

},



ActualCost:{


type:"NUMBER",

default:0

},



Margin:{


type:"NUMBER",

default:0

},



Expedition:{


type:"BOOLEAN",

default:false

},



MailTrack:{


type:"STRING"

},



Status:{


type:"ENUM",

default:"NEW"

},



CreatedAt:{


type:"DATETIME"

},



UpdatedAt:{


type:"DATETIME"

},



Deleted:{


type:"BOOLEAN",

default:false

}



}



}






};
// ============================================================
// EntityMetadata v3.0.0
// PART 2/3
// LOGISTICS DOMAIN
// ============================================================



Object.assign(EntityMetadata, {



// ============================================================
// TRANSPORT ORDER
// ============================================================


TRANSPORT_ORDER:{


entity:"TRANSPORT_ORDER",

module:"LOGISTICS",


table:"TransportOrders",


repository:"TransportOrderRepository",


idField:"TransportOrderID",


idPrefix:"TO",


softDelete:true,


timestamps:true,


audit:true,



events:{


created:"TRANSPORT_ORDER_CREATED",

updated:"TRANSPORT_ORDER_UPDATED",

deleted:"TRANSPORT_ORDER_DELETED",

restored:"TRANSPORT_ORDER_RESTORED"


},




fields:{



TransportOrderID:{


type:"ID",

generated:true

},



OrganizationID:{


type:"REFERENCE",

reference:"ORGANIZATION",

required:true

},



ClientID:{


type:"REFERENCE",

reference:"CLIENT",

required:true

},



OrderNumber:{


type:"STRING",

required:true

},



OrderDate:{


type:"DATE"

},



LoadingPoint:{


type:"STRING"

},



UnloadingPoint:{


type:"STRING"

},



Cargo:{


type:"STRING"

},



Weight:{


type:"NUMBER"

},



Volume:{


type:"NUMBER"

},



Distance:{


type:"NUMBER"

},



RequiredVehicleType:{


type:"STRING"

},



Status:{


type:"ENUM",

default:"NEW"

},



ManagerID:{


type:"REFERENCE",

reference:"USER"

},



CreatedAt:{


type:"DATETIME"

},



UpdatedAt:{


type:"DATETIME"

},



Deleted:{


type:"BOOLEAN",

default:false

}



}



},







// ============================================================
// VEHICLE
// ============================================================


VEHICLE:{


entity:"VEHICLE",

module:"LOGISTICS",


table:"Vehicles",


repository:"VehicleRepository",


idField:"VehicleID",


idPrefix:"VEH",


softDelete:true,


timestamps:true,


audit:true,



fields:{



VehicleID:{


type:"ID",

generated:true

},



OrganizationID:{


type:"REFERENCE",

reference:"ORGANIZATION"

},



CarrierID:{


type:"REFERENCE",

reference:"CARRIER"

},



DriverID:{


type:"REFERENCE",

reference:"DRIVER"

},



Number:{


type:"STRING",

required:true

},



Brand:{


type:"STRING"

},



Model:{


type:"STRING"

},



Year:{


type:"NUMBER"

},



VIN:{


type:"STRING"

},



FuelType:{


type:"ENUM"

},



FuelConsumption:{


type:"NUMBER"

},



Mileage:{


type:"NUMBER"

},



Status:{


type:"ENUM",

default:"ACTIVE"

},



CreatedAt:{


type:"DATETIME"

},



UpdatedAt:{


type:"DATETIME"

},



Deleted:{


type:"BOOLEAN",

default:false

}



}



},







// ============================================================
// DRIVER
// ============================================================


DRIVER:{


entity:"DRIVER",

module:"LOGISTICS",


table:"Drivers",


repository:"DriverRepository",


idField:"DriverID",


idPrefix:"DRV",


softDelete:true,


timestamps:true,


audit:true,



fields:{



DriverID:{


type:"ID",

generated:true

},



OrganizationID:{


type:"REFERENCE",

reference:"ORGANIZATION"

},



FullName:{


type:"STRING",

required:true

},



Phone:{


type:"STRING"

},



Passport:{


type:"STRING"

},



LicenseNumber:{


type:"STRING"

},



LicenseCategory:{


type:"STRING"

},



Experience:{


type:"NUMBER"

},



Status:{


type:"ENUM",

default:"ACTIVE"

},



CreatedAt:{


type:"DATETIME"

},



UpdatedAt:{


type:"DATETIME"

},



Deleted:{


type:"BOOLEAN",

default:false

}



}



},







// ============================================================
// CARRIER
// ============================================================


CARRIER:{


entity:"CARRIER",

module:"LOGISTICS",


table:"Carriers",


repository:"CarrierRepository",


idField:"CarrierID",


idPrefix:"CAR",


softDelete:true,


timestamps:true,


audit:true,



fields:{



CarrierID:{


type:"ID",

generated:true

},



OrganizationID:{


type:"REFERENCE",

reference:"ORGANIZATION"

},



Name:{


type:"STRING",

required:true

},



INN:{


type:"STRING"

},



Phone:{


type:"STRING"

},



Email:{


type:"STRING"

},



ContractNumber:{


type:"STRING"

},



Rating:{


type:"NUMBER",

default:0

},



Status:{


type:"ENUM",

default:"ACTIVE"

},



CreatedAt:{


type:"DATETIME"

},



UpdatedAt:{


type:"DATETIME"

},



Deleted:{


type:"BOOLEAN",

default:false

}



}



},







// ============================================================
// ROUTE
// ============================================================


ROUTE:{


entity:"ROUTE",

module:"LOGISTICS",


table:"Routes",


repository:"RouteRepository",


idField:"RouteID",


idPrefix:"RTE",


softDelete:true,


timestamps:true,


audit:true,



fields:{



RouteID:{


type:"ID",

generated:true

},



OrganizationID:{


type:"REFERENCE",

reference:"ORGANIZATION"

},



Name:{


type:"STRING"

},



StartPoint:{


type:"STRING"

},



EndPoint:{


type:"STRING"

},



Distance:{


type:"NUMBER"

},



RoadType:{


type:"STRING"

},



TollRoad:{


type:"BOOLEAN",

default:false

},



CreatedAt:{


type:"DATETIME"

},



UpdatedAt:{


type:"DATETIME"

},



Deleted:{


type:"BOOLEAN",

default:false

}



}



},







// ============================================================
// CARGO
// ============================================================


CARGO:{


entity:"CARGO",

module:"LOGISTICS",


table:"Cargoes",


repository:"CargoRepository",


idField:"CargoID",


idPrefix:"CRG",


softDelete:true,


timestamps:true,


audit:true,



fields:{



CargoID:{


type:"ID",

generated:true

},



OrganizationID:{


type:"REFERENCE",

reference:"ORGANIZATION"

},



Name:{


type:"STRING",

required:true

},



Type:{


type:"STRING"

},



Weight:{


type:"NUMBER"

},



Volume:{


type:"NUMBER"

},



TemperatureMode:{


type:"STRING"

},



Dangerous:{


type:"BOOLEAN",

default:false

},



CreatedAt:{


type:"DATETIME"

},



UpdatedAt:{


type:"DATETIME"

},



Deleted:{


type:"BOOLEAN",

default:false

}



}



}



});
// ============================================================
// EntityMetadata v3.0.0
// PART 3/3
// FINANCE + ANALYTICS + SYSTEM + API
// ============================================================



Object.assign(EntityMetadata,{



// ============================================================
// CLIENT FINANCE PROFILE
// ============================================================


CLIENT_FINANCE_PROFILE:{


entity:"CLIENT_FINANCE_PROFILE",

module:"FINANCE",


table:"ClientFinanceProfiles",


repository:"ClientFinanceProfileRepository",


idField:"FinanceProfileID",


idPrefix:"CFP",


softDelete:true,


timestamps:true,


audit:true,



fields:{



FinanceProfileID:{


type:"ID",

generated:true

},



ClientID:{


type:"REFERENCE",

reference:"CLIENT",

required:true

},



CreditLimit:{


type:"NUMBER",

default:0

},



PaymentTermDays:{


type:"NUMBER",

default:0

},



Debt:{


type:"NUMBER",

default:0

},



Rating:{


type:"NUMBER",

default:0

},



Status:{


type:"ENUM",

default:"ACTIVE"

},



CreatedAt:{


type:"DATETIME"

},



UpdatedAt:{


type:"DATETIME"

},



Deleted:{


type:"BOOLEAN",

default:false

}



}



},







// ============================================================
// FINANCIAL TRANSACTION
// ============================================================


FINANCIAL_TRANSACTION:{


entity:"FINANCIAL_TRANSACTION",

module:"FINANCE",


table:"FinancialTransactions",


repository:"FinancialTransactionRepository",


idField:"TransactionID",


idPrefix:"FIN",


softDelete:false,


timestamps:true,


audit:true,



fields:{



TransactionID:{


type:"ID",

generated:true

},



OrganizationID:{


type:"REFERENCE",

reference:"ORGANIZATION",

required:true

},



ClientID:{


type:"REFERENCE",

reference:"CLIENT"

},



TripID:{


type:"REFERENCE",

reference:"TRIP"

},



Type:{


type:"ENUM",

required:true

},



Category:{


type:"STRING"

},



Amount:{


type:"NUMBER",

required:true

},



Currency:{


type:"STRING",

default:"RUB"

},



Direction:{


type:"ENUM"

},



PaymentDate:{


type:"DATE"

},



Comment:{


type:"STRING"

},



CreatedAt:{


type:"DATETIME"

},



UpdatedAt:{


type:"DATETIME"

}



}



},







// ============================================================
// KPI
// ============================================================


KPI:{


entity:"KPI",

module:"ANALYTICS",


table:"KPIMetrics",


repository:"KPIRepository",


idField:"KPIID",


idPrefix:"KPI",


softDelete:true,


timestamps:true,


audit:false,



fields:{



KPIID:{


type:"ID",

generated:true

},



OrganizationID:{


type:"REFERENCE",

reference:"ORGANIZATION"

},



Name:{


type:"STRING",

required:true

},



Value:{


type:"NUMBER",

default:0

},



Period:{


type:"STRING"

},



MetricType:{


type:"ENUM"

},



Source:{


type:"STRING"

},



CreatedAt:{


type:"DATETIME"

},



UpdatedAt:{


type:"DATETIME"

},



Deleted:{


type:"BOOLEAN",

default:false

}



}



},







// ============================================================
// AUDIT
// ============================================================


AUDIT:{


entity:"AUDIT",

module:"SYSTEM",


table:"AuditLog",


repository:"AuditRepository",


idField:"AuditID",


idPrefix:"AUD",


softDelete:false,


timestamps:true,


audit:false,



fields:{



AuditID:{


type:"ID",

generated:true

},



UserID:{


type:"REFERENCE",

reference:"USER"

},



Action:{


type:"STRING",

required:true

},



Entity:{


type:"STRING"

},



EntityID:{


type:"STRING"

},



Before:{


type:"JSON"

},



After:{


type:"JSON"

},



CreatedAt:{


type:"DATETIME"

}



}



},







// ============================================================
// VERSION
// ============================================================


VERSION:{


entity:"VERSION",

module:"SYSTEM",


table:"Versions",


repository:"VersionRepository",


idField:"VersionID",


idPrefix:"VER",


softDelete:false,


timestamps:true,



fields:{



VersionID:{


type:"ID",

generated:true

},



Entity:{


type:"STRING"

},



EntityID:{


type:"STRING"

},



VersionNumber:{


type:"NUMBER"

},



Snapshot:{


type:"JSON"

},



CreatedAt:{


type:"DATETIME"

}



}



},







// ============================================================
// TEST ENTITIES
// ============================================================


__TEST_DATABASE:{


entity:"__TEST_DATABASE",

module:"SYSTEM",

system:true,


table:"__TEST_DATABASE",


repository:"BaseRepository",


idField:"id",


idPrefix:"TESTDB",


fields:{


id:{


type:"ID",

generated:true

}


}


},





__TEST_EVENTS:{


entity:"__TEST_EVENTS",

module:"SYSTEM",

system:true,


table:"__TEST_EVENTS",


repository:"BaseRepository",


idField:"id",


idPrefix:"TESTEV",


fields:{


id:{


type:"ID",

generated:true

}


}


},





__TEST_REPOSITORY:{


entity:"__TEST_REPOSITORY",

module:"SYSTEM",

system:true,


table:"__TEST_REPOSITORY",


repository:"BaseRepository",


idField:"id",


idPrefix:"TESTRP",


fields:{


id:{


type:"ID",

generated:true

}


}


}



});








// ============================================================
// API
// ============================================================



EntityMetadata.list=function(){


return Object.keys(this.entities)

.length
?
Object.keys(this.entities)

:

Object.keys(this)

.filter(k=>{


const x=this[k];


return x &&
typeof x==="object" &&
x.entity;


});


};









EntityMetadata.get=function(entity){


if(
this[entity]
&&
this[entity].entity
){

return this[entity];

}



if(
EntityRegistry &&
EntityRegistry.resolve
){

return this[
EntityRegistry.resolve(entity)
];

}



return null;


};









EntityMetadata.getFields=function(entity){


const meta=this.get(entity);


if(!meta){

throw new Error(
"Metadata missing "+entity
);

}



return meta.fields || {};

};









EntityMetadata.hasField=function(entity,field){


return !!this.getFields(entity)[field];


};









EntityMetadata.validate=function(){



const errors=[];



this.list()
.forEach(entity=>{


const meta=this[entity];



if(!meta.fields){

errors.push(
entity+
" fields missing"
);

}



if(!meta.idField){

errors.push(
entity+
" idField missing"
);

}



if(!meta.table){

errors.push(
entity+
" table missing"
);

}



});



return errors;


};









EntityMetadata.health=function(){



const errors =
this.validate();



return HealthContract.create(

"EntityMetadata",

errors.length
?
"WARNING"
:
"OK",

{


version:this.version,


entities:this.list(),


count:this.list().length,


errors


}

);


};








// ============================================================
// INIT
// ============================================================


EntityMetadata.init=function(){



if(this.initialized){

return true;

}



this.initialized=true;



Logger.log(

"EntityMetadata READY v"+
this.version+
" definitions="+
this.list().length

);



return true;


};




// ============================================================
// FIELD NORMALIZER v3.0.1
// Compatibility Layer
//
// Object fields -> Array fields
// ============================================================


EntityMetadata.getFieldArray = function(entity){


    const meta=this.get(entity);


    if(!meta){
        throw new Error(
            "Metadata missing "+entity
        );
    }


    const fields=meta.fields || {};


    // уже массив
    if(Array.isArray(fields)){
        return fields;
    }


    // объект -> массив
    return Object.keys(fields)
    .map(name=>{


        return Object.assign(
            {
                name:name
            },
            fields[name]
        );


    });


};



// ============================================================
// PATCH METADATA
// ============================================================

EntityMetadata.normalize=function(){


    this.list()
    .forEach(entity=>{


        const meta=this[entity];


        if(
            meta.fields &&
            !Array.isArray(meta.fields)
        ){


            meta.fieldsArray =
                this.getFieldArray(entity);


        }


    });



    Logger.log(
        "EntityMetadata normalized"
    );


    return true;

};




globalThis.EntityMetadata =
EntityMetadata;



EntityMetadata.init();



Logger.log(
"EntityMetadata GLOBAL READY v"+
EntityMetadata.version
);