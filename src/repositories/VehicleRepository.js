// ============================================================
// VehicleRepository v3.1.0
// Enterprise Repository
// TaxControl ERP Core
//
// Entity:
// VEHICLE
//
// Architecture:
//
// FleetService
//      |
//      v
// VehicleRepository
//      |
//      v
// BaseRepository
//      |
//      v
// Database
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
"VehicleRepository v3.1.0"
);





const VehicleRepository = {


// ============================================================
// META
// ============================================================


version:"3.1.0",

entity:"VEHICLE",

table:"Vehicles",

initialized:false,

base:null,






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
"VehicleRepository: BaseRepository unavailable"
);

}



this.base =
BaseRepository.createRepository(
this.entity
);



this.initialized=true;



Logger.log(
"VehicleRepository INIT READY v"+
this.version
);



return true;


},







// ============================================================
// BASE
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


create(data={},options={}){


const result =
this.getBase()
.create(
data,
options
);


this.emit(
"VEHICLE_CREATED",
result
);


return result;


},







// ============================================================
// READ
// ============================================================


findById(id,options={}){


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




get(id,options={}){


return this.findById(
id,
options
);


},




getById(id,options={}){


return this.findById(
id,
options
);


},







findAll(filters={},options={}){


return this.getBase()
.findAll(
filters,
options
);


},







findWhere(criteria={},options={}){


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







// ============================================================
// VEHICLE SEARCH
// ============================================================



findByPlate(plate){


return this.findWhere({

PlateNumber:plate

});


},






findByVin(vin){


return this.findWhere({

VIN:vin

});


},






findByInternalNumber(number){


return this.findWhere({

InternalNumber:number

});


},






findByType(type){


return this.findWhere({

Type:type

});


},






findByOrganization(orgId){


return this.findWhere({

OrganizationID:orgId

});


},






findByDriver(driverId){


return this.findWhere({

DriverID:driverId

});


},







// ============================================================
// STATUS
// ============================================================


findByStatus(status){


return this.findWhere({

Status:status

});


},







findActive(){


return this.findByStatus(
"ACTIVE"
);


},







findAvailable(){


return this.findWhere({

Status:"ACTIVE",

Available:true

});


},







findRepair(){


return this.findByStatus(
"REPAIR"
);


},







findBlocked(){


return this.findByStatus(
"BLOCKED"
);


},







// ============================================================
// DRIVER MANAGEMENT
// ============================================================


assignDriver(
vehicleId,
driverId
){


this.requireId(
vehicleId,
"assignDriver"
);


this.requireId(
driverId,
"assignDriver"
);



const result =
this.update(

vehicleId,

{

DriverID:driverId

}

);



this.emit(
"VEHICLE_DRIVER_ASSIGNED",
{
vehicleId,
driverId
}
);



return result;


},







removeDriver(
vehicleId
){


this.requireId(
vehicleId,
"removeDriver"
);



return this.update(

vehicleId,

{

DriverID:null

}

);


},







// ============================================================
// MILEAGE
// ============================================================


getMileage(vehicleId){


const vehicle =
this.findById(
vehicleId
);



return Number(

vehicle?.Mileage || 0

);


},







updateMileage(
vehicleId,
mileage
){


this.requireId(
vehicleId,
"updateMileage"
);



if(
Number(mileage)<0
){

throw new Error(
"Vehicle mileage cannot be negative"
);

}



const result =
this.update(

vehicleId,

{

Mileage:Number(mileage),

MileageUpdatedAt:
new Date()

}

);



this.emit(

"VEHICLE_MILEAGE_UPDATED",

{

vehicleId,

mileage

}

);



return result;


},







// ============================================================
// MAINTENANCE
// ============================================================


findMaintenanceDue(days=30){


const vehicles =
this.findAll();



const now =
new Date();



return vehicles.filter(vehicle=>{


if(
!vehicle.NextMaintenanceDate
){

return false;

}



const date =
new Date(
vehicle.NextMaintenanceDate
);



const diff =
(date-now)
/
86400000;



return diff<=days;


});


},







// ============================================================
// STATUS CHANGE
// ============================================================


changeStatus(
vehicleId,
status
){


this.requireId(
vehicleId,
"changeStatus"
);



const result =
this.update(

vehicleId,

{

Status:status

}

);



this.emit(

"VEHICLE_STATUS_CHANGED",

{

vehicleId,

status

}

);



return result;


},







// ============================================================
// UPDATE
// ============================================================


update(id,data={},options={}){


this.requireId(
id,
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

"VEHICLE_UPDATED",

{

id,

data

}

);



return result;


},







// ============================================================
// DELETE
// ============================================================


delete(id,options={}){


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







restore(id,options={}){


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
// COMMON
// ============================================================


exists(id,options={}){


return !!this.findById(
id,
options
);


},







existsBy(field,value,options={}){


return this.getBase()
.existsBy(
field,
value,
options
);


},







count(filters={},options={}){


if(
this.getBase().count
){

return this.getBase()
.count(
filters,
options
);

}



return this.findAll(
filters,
options
).length;


},







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


bulkCreate(items=[],options={}){


if(
!Array.isArray(items)
){

throw new Error(
"VehicleRepository.bulkCreate items must array"
);

}



return this.getBase()
.bulkCreate(
items,
options
);


},







bulkUpdate(ids=[],data={},options={}){


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
"VehicleRepository.transaction callback required"
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
// EVENTS
// ============================================================


emit(type,payload){


try{


if(
typeof EventBus!=="undefined"
&&
EventBus.emit
){


EventBus.emit(

type,

{

entity:this.entity,

payload

}

);


}


}
catch(e){


Logger.warn(
"VehicleRepository event skipped "+
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

idField:"VehicleID"

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

"VehicleRepository."
+
method+
": id required"

);

}


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


module:"VehicleRepository",

version:this.version,


entity:this.entity,


table:
meta?.table ||
this.table,


initialized:
this.initialized,



layers:{


schema:
typeof SchemaRegistry!=="undefined",


metadata:
typeof EntityRegistry!=="undefined",


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
RepositoryFactory.has(this.entity)
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

"VehicleRepository",

status,

data

);

}



return {

module:"VehicleRepository",

status,

...data

};


}



};








// ============================================================
// GLOBAL
// ============================================================


globalThis.VehicleRepository =
VehicleRepository;








// ============================================================
// SAFE BOOT
// ============================================================


try{


VehicleRepository.init();


VehicleRepository.register();


}
catch(e){


Logger.warn(

"VehicleRepository deferred: "+
e.message

);


}







Logger.log(

"VehicleRepository GLOBAL READY v"+
VehicleRepository.version

);