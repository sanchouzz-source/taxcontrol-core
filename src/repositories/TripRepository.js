// ============================================================
// TripRepository v3.2.0
// Enterprise Transport Repository
// TaxControl ERP Core
//
// Entity:
// TRIP
//
// Architecture:
//
// TripService
//      |
//      v
// TripRepository
//      |
//      v
// BaseRepository v5.7+
//      |
//      v
// Database
//
// Prepared:
//
// TransportModule
// FinanceEngine
// KPIEngine
// EventBus
// Mobile API
//
// Compatible:
//
// EntityMetadata v3+
// EntityRegistry v2.5+
// SchemaManager v4.2+
// BaseRepository v5.7+
// RepositoryFactory v3+
// RepositoryRegistry v2+
// ============================================================


console.log(
"TripRepository v3.2.0"
);



const TripRepository = {


// ============================================================
// META
// ============================================================


version:"3.2.0",

entity:"TRIP",

table:"Trips",

initialized:false,

base:null,


architecture:
"Enterprise Transport Repository"

,







// ============================================================
// INIT
// ============================================================


init(){


if(this.initialized){

return true;

}



if(
typeof BaseRepository==="undefined"
){

throw new Error(
"TripRepository: BaseRepository unavailable"
);

}



this.base =
BaseRepository.createRepository(
this.entity
);



this.initialized=true;



Logger.log(
"TripRepository READY v"+
this.version
);



return true;


},







// ============================================================
// BASE ACCESS
// ============================================================


getBase(){


if(!this.initialized){

this.init();

}


return this.base;


},







// ============================================================
// CREATE
// ============================================================


create(
data={},
options={}
){


this.requireObject(
data,
"create"
);



const result =
this.getBase()
.create(
data,
options
);



this.emit(
"TRIP_CREATED",
result
);



return result;


},







// ============================================================
// READ
// ============================================================


findById(
id,
options={}
){


this.requireId(
id,
"findById"
);



return this.getBase()
.findById(
id,
options
);


},







get(
id,
options={}
){


return this.findById(
id,
options
);


},






getById(
id,
options={}
){


return this.findById(
id,
options
);


},







findAll(
filters={},
options={}
){


return this.getBase()
.findAll(
filters,
options
);


},







findWhere(
criteria={},
options={}
){


const base =
this.getBase();



if(
typeof base.findWhere==="function"
){

return base.findWhere(
criteria,
options
);

}



return this.findAll(
criteria,
options
);


},







search(
criteria={}
){


return this.findAll(
criteria
);


},







// ============================================================
// COUNT
// ============================================================


count(
filters={},
options={}
){


const base =
this.getBase();



if(
typeof base.count==="function"
){

return base.count(
filters,
options
);

}



return this.findAll(
filters,
options
)
.length;


},







// ============================================================
// EXISTS
// ============================================================


exists(
id,
options={}
){


this.requireId(
id,
"exists"
);



if(
this.getBase().exists
){

return this.getBase()
.exists(
id,
options
);

}



return !!this.findById(
id,
options
);


},







existsBy(
field,
value,
options={}
){


return this.findAll(

{

[field]:value

},

options

)
.length>0;


},







// ============================================================
// UPDATE
// ============================================================


update(
id,
data={},
options={}
){


this.requireId(
id,
"update"
);



this.requireObject(
data,
"update"
);



const result =
this.getBase()
.update(
id,
data,
options
);



this.emit(
"TRIP_UPDATED",
result
);



return result;


},







delete(
id,
options={}
){


this.requireId(
id,
"delete"
);



return this.getBase()
.delete(
id,
options
);


},







restore(
id,
options={}
){


this.requireId(
id,
"restore"
);



return this.getBase()
.restore(
id,
options
);


},







// ============================================================
// PAGINATION
// ============================================================


paginate(
page=1,
limit=50,
filters={},
options={}
){


return this.getBase()
.paginate(
page,
limit,
filters,
options
);


},







// ============================================================
// BULK
// ============================================================


bulkCreate(
items=[],
options={}
){


if(
!Array.isArray(items)
){

throw new Error(
"TripRepository.bulkCreate items must array"
);

}



return this.getBase()
.bulkCreate(
items,
options
);


},







bulkUpdate(
ids=[],
data={},
options={}
){


if(
!Array.isArray(ids)
){

throw new Error(
"TripRepository.bulkUpdate ids must array"
);

}



return this.getBase()
.bulkUpdate(
ids,
data,
options
);


},







// ============================================================
// TRANSACTION
// ============================================================


transaction(callback){


if(
typeof callback!=="function"
){

throw new Error(
"TripRepository.transaction callback required"
);

}



if(
this.getBase().transaction
){

return this.getBase()
.transaction(
callback
);

}



return callback();


},
// ============================================================
// TRIP BUSINESS METHODS
// ============================================================


// ============================================================
// SEARCH
// ============================================================


// по номеру рейса

findByNumber(number){


return this.findWhere({

TripNumber:number

});


},







// по статусу

findByStatus(status){


return this.findWhere({

Status:status

});


},







// активные рейсы

findActive(){


const statuses=[


"NEW",

"PLANNED",

"ASSIGNED",

"LOADING",

"IN_TRANSIT"


];



return this.findAll()
.filter(
x=>
statuses.includes(
x.Status
)
);


},







findCompleted(){


return this.findByStatus(
"COMPLETED"
);


},







findCancelled(){


return this.findByStatus(
"CANCELLED"
);


},







// ============================================================
// RELATIONS
// ============================================================



findByClient(clientId){


return this.findWhere({

ClientID:clientId

});


},






findByVehicle(vehicleId){


return this.findWhere({

VehicleID:vehicleId

});


},






findByDriver(driverId){


return this.findWhere({

DriverID:driverId

});


},






findByCarrier(carrierId){


return this.findWhere({

CarrierID:carrierId

});


},






findByRoute(routeId){


return this.findWhere({

RouteID:routeId

});


},






findByOrganization(orgId){


return this.findWhere({

OrganizationID:orgId

});


},







// ============================================================
// EXPEDITION
// ============================================================



findExpeditionTrips(){


return this.findWhere({

Expedition:true

});


},







isExpedition(tripId){


const trip =
this.findById(
tripId
);



return !!trip?.Expedition;


},







// ============================================================
// LIFE CYCLE
// ============================================================



changeStatus(
tripId,
status
){


const result =
this.update(

tripId,

{

Status:status

}

);



this.emit(

"TRIP_STATUS_CHANGED",

{

tripId,

status

}

);



return result;


},







startTrip(tripId){


return this.changeStatus(

tripId,

"IN_TRANSIT"

);


},







completeTrip(tripId){


return this.changeStatus(

tripId,

"COMPLETED"

);


},







cancelTrip(tripId,reason=""){


const result =
this.update(

tripId,

{

Status:"CANCELLED",

CancelReason:reason

}

);



this.emit(

"TRIP_CANCELLED",

{

tripId,

reason

}

);



return result;


},







// ============================================================
// ASSIGNMENTS
// ============================================================



assignVehicle(
tripId,
vehicleId
){


const result =
this.update(

tripId,

{

VehicleID:vehicleId

}

);



this.emit(

"TRIP_VEHICLE_ASSIGNED",

{

tripId,

vehicleId

}

);



return result;


},







assignDriver(
tripId,
driverId
){


const result =
this.update(

tripId,

{

DriverID:driverId

}

);



this.emit(

"TRIP_DRIVER_ASSIGNED",

{

tripId,

driverId

}

);



return result;


},







assignCarrier(
tripId,
carrierId
){


return this.update(

tripId,

{

CarrierID:carrierId

}

);


},







// ============================================================
// FINANCE
// ============================================================



getRevenue(tripId){


const trip =
this.findById(
tripId
);



return Number(
trip?.Revenue || 0
);


},







getCost(tripId){


const trip =
this.findById(
tripId
);



return Number(
trip?.Cost || 0
);


},







calculateCost(tripId){


const trip =
this.findById(
tripId
);



return {


fuel:
Number(
trip?.FuelCost || 0
),


driver:
Number(
trip?.DriverCost || 0
),


repair:
Number(
trip?.RepairCost || 0
),


toll:
Number(
trip?.TollCost || 0
),


carrier:
Number(
trip?.CarrierCost || 0
),


total:
Number(
trip?.Cost || 0
)


};


},







getMargin(tripId){


return (

this.getRevenue(tripId)

-

this.getCost(tripId)

);


},







getProfitability(tripId){


const revenue =
this.getRevenue(
tripId
);



const cost =
this.getCost(
tripId
);



const margin =
revenue-cost;



return {


tripId,


revenue,


cost,


margin,


marginPercent:

revenue
?

(
margin/revenue*100
)

.toFixed(2)

:

0


};


},







// ============================================================
// KPI
// ============================================================



getTripKPI(tripId){


const trip =
this.findById(
tripId
);



return {


tripId,


status:
trip?.Status || null,


revenue:
this.getRevenue(
tripId
),


cost:
this.getCost(
tripId
),


margin:
this.getMargin(
tripId
)


};


},







getDriverKPI(driverId){


const trips =
this.findByDriver(
driverId
);



return {


driverId,


total:
trips.length,


completed:

trips.filter(

t=>
t.Status==="COMPLETED"

)

.length


};


},







getVehicleKPI(vehicleId){


const trips =
this.findByVehicle(
vehicleId
);



return {


vehicleId,


total:
trips.length,


completed:

trips.filter(

t=>
t.Status==="COMPLETED"

)

.length


};


},







// ============================================================
// DOCUMENT CONTROL
// ============================================================



checkDocuments(tripId){


const trip =
this.findById(
tripId
);



return {


tripId,


hasAct:
!!trip?.Act,


hasTTN:
!!trip?.TTN,


hasOriginals:
!!trip?.OriginalDocuments,


postalTrack:
trip?.PostalTrack || null


};


},







// ============================================================
// EVENT BUS
// ============================================================



emit(
event,
data
){


try{


if(
typeof EventBus!=="undefined"
&&
typeof EventBus.emit==="function"
){


EventBus.emit(

event,

{

entity:this.entity,

data

}

);


}


}
catch(e){


Logger.warn(

"TripRepository Event skipped "+
e.message

);


}


},







// ============================================================
// META
// ============================================================


getMeta(){


if(
typeof SchemaRegistry!=="undefined"
&&
SchemaRegistry.get
){


const schema =
SchemaRegistry.get(
this.entity
);



if(schema){

return schema;

}

}



if(
typeof EntityRegistry!=="undefined"
&&
EntityRegistry.get
){

return EntityRegistry.get(
this.entity
);

}



return {


entity:this.entity,


table:this.table,


idField:"TripID"


};


},







// ============================================================
// VALIDATION
// ============================================================


requireId(id,method){


if(
id===undefined ||
id===null ||
id===""
){


throw new Error(

"TripRepository."
+
method+
": id required"

);


}



return true;


},







requireObject(data,method){


if(
!data ||
typeof data!=="object" ||
Array.isArray(data)
){


throw new Error(

"TripRepository."
+
method+
": object required"

);


}



return true;


},







// ============================================================
// REGISTER
// ============================================================


register(){


if(
typeof RepositoryFactory==="undefined"
){

return false;

}



RepositoryFactory.register(

this.entity,

this,

{

force:true

}

);




if(
typeof RepositoryRegistry!=="undefined"
&&
RepositoryRegistry.register
){

RepositoryRegistry.register(

this.entity,

this

);

}



return true;


},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){


let meta=null;


try{

meta=this.getMeta();

}
catch(e){}



return {


module:
"TripRepository",


version:
this.version,


entity:
this.entity,


table:
meta?.table ||
this.table,


initialized:
this.initialized,



layers:{


metadata:
typeof EntityRegistry!=="undefined",


schema:
typeof SchemaRegistry!=="undefined",


baseRepository:
typeof BaseRepository!=="undefined",


factory:
typeof RepositoryFactory!=="undefined",


registry:
typeof RepositoryRegistry!=="undefined"


},



registered:

typeof RepositoryFactory!=="undefined"
&&
RepositoryFactory.has
?

RepositoryFactory.has(
this.entity
)

:

false,



timestamp:
new Date()
.toISOString()


};


},







// ============================================================
// HEALTH
// ============================================================


health(){


const data =
this.diagnostics();



const status =

data.layers.baseRepository
&&
data.layers.metadata

?

"OK"

:

"WARNING";




if(
typeof HealthContract!=="undefined"
&&
HealthContract.create
){

return HealthContract.create(

"TripRepository",

status,

data

);

}



return {

module:
"TripRepository",

status,

...data

};


}



};









// ============================================================
// GLOBAL
// ============================================================


globalThis.TripRepository =
TripRepository;









// ============================================================
// SAFE BOOT
// ============================================================


try{


TripRepository.init();


TripRepository.register();


}
catch(e){


Logger.warn(

"TripRepository deferred: "+
e.message

);


}






Logger.log(

"TripRepository GLOBAL READY v"+
TripRepository.version

);