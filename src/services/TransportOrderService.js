// ============================================================
// TransportOrderService v1.0.0
// TaxControl ERP
//
// Business layer for transport orders
//
// Architecture:
//
// Controller
//      |
// Service
//      |
// Repository
//      |
// Database
//
// Service responsibilities:
//
// - validation
// - business rules
// - events
// - audit
// - KPI triggers
//
// ============================================================


console.log(
"TransportOrderService v1.0.0"
);



const TransportOrderService = {


version:"1.0.0",


entity:"TRANSPORT_ORDER",


initialized:false,



// ============================================================
// INIT
// ============================================================


init(){


if(this.initialized){

return true;

}



Logger.log(

"TransportOrderService INIT v"+
this.version

);



this.initialized=true;



return true;

},




// ============================================================
// CREATE ORDER
// ============================================================


create(data){


Logger.log(

"TransportOrderService CREATE"

);



this.validateCreate(data);



const repository =

RepositoryFactory.get(
this.entity
);



const order =

repository.create(
data
);




// EVENT

this.publishEvent(
"TRANSPORT_ORDER_CREATED",
order
);



// AUDIT

this.writeAudit(
"CREATE",
order
);



return order;


},




// ============================================================
// ASSIGN VEHICLE
// ============================================================


assignVehicle(
orderId,
vehicleId,
driverId
){



const repository =

RepositoryFactory.get(
this.entity
);



const order =

repository.update(

orderId,

{

VehicleID:
vehicleId,


DriverID:
driverId,


Status:
"ASSIGNED"

}

);




this.publishEvent(

"TRANSPORT_ORDER_ASSIGNED",

order

);



this.writeAudit(

"ASSIGN",

order

);



return order;


},




// ============================================================
// COMPLETE ORDER
// ============================================================


complete(
orderId,
finance
){



const repository =

RepositoryFactory.get(
this.entity
);



const order =

repository.update(

orderId,

{

Status:
"COMPLETED",


Revenue:
finance.revenue || 0,


Cost:
finance.cost || 0,


Margin:

(
finance.revenue || 0
)
-
(
finance.cost || 0
)


}

);




this.publishEvent(

"TRANSPORT_ORDER_COMPLETED",

order

);



this.writeAudit(

"COMPLETE",

order

);



return order;


},





// ============================================================
// VALIDATION
// ============================================================


validateCreate(data){



const required=[

"OrganizationID",

"ClientID"

];



required.forEach(field=>{


if(
!data[field]
){

throw new Error(

"TransportOrder required field: "
+
field

);

}


});



return true;


},





// ============================================================
// EVENTS
// ============================================================


publishEvent(
eventName,
payload
){



if(
typeof EventBus!=="undefined"
&&
EventBus.publish
){


EventBus.publish(

eventName,

payload

);


}


},




// ============================================================
// AUDIT
// ============================================================


writeAudit(
action,
entity
){



if(
typeof AuditRepository==="undefined"
){

return;

}



AuditRepository.create({

Action:
action,


Entity:
this.entity,


EntityID:

entity.TransportOrderID,


After:
entity,


Source:
"TransportOrderService"


});


},





// ============================================================
// HEALTH
// ============================================================


health(){


return {


module:
"TransportOrderService",


version:
this.version,


status:

this.initialized
?
"OK"
:
"NOT_READY"


};


}


};





globalThis.TransportOrderService =
TransportOrderService;



TransportOrderService.init();