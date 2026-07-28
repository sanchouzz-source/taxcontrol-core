// ============================================================
// TripRepository v3.1.0
// Enterprise Repository
// TaxControl ERP Core
//
// Entity:
// TRIP
//
// Architecture:
//
// EntityService
//      |
//      v
// RepositoryFactory v3
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
// Compatible:
//
// EntityMetadata v3+
// EntityRegistry v2.5+
// SchemaManager v4.2+
// SchemaRegistry v4+
// BaseRepository v5.7+
// RepositoryFactory v3+
// RepositoryRegistry v1.1+
//
// Prepared:
//
// EventBus
// AuditLog
// FinanceEngine
// KPIEngine
// ============================================================


console.log(
"TripRepository v3.1.0"
);



const TripRepository = {



// ============================================================
// META
// ============================================================


version:"3.1.0",

entity:"TRIP",

table:"Trips",

initialized:false,

base:null,

architecture:
"BaseRepository v5.7+ Enterprise",





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
"TripRepository INIT READY v"+
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







// ============================================================
// SEARCH
// ============================================================


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
).length;


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



const base =
this.getBase();



if(
typeof base.exists==="function"
){

return base.exists(
id,
options
);

}



return !!this.findById(
id,
options
);


},







// ============================================================
// EXISTS BY
// ============================================================


existsBy(
field,
value,
options={}
){


const rows =
this.findAll(
{
[field]:value
},
options
);



return rows.length>0;


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







// ============================================================
// DELETE
// ============================================================


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







// ============================================================
// RESTORE
// ============================================================


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


const base =
this.getBase();



if(
typeof base.paginate==="function"
){

return base.paginate(
page,
limit,
filters,
options
);

}



return {

page,

limit,

data:
this.findAll(
filters,
options
)

};


},







// ============================================================
// BULK CREATE
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







// ============================================================
// BULK UPDATE
// ============================================================


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



const base =
this.getBase();



if(
typeof base.transaction==="function"
){

return base.transaction(
callback
);

}



return callback();


},







// ============================================================
// TRIP BUSINESS METHODS
// ============================================================


// поиск по номеру рейса

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


return this.findWhere({

Status:[
"NEW",
"PLANNED",
"LOADING",
"IN_TRANSIT"

]

});


},







// завершенные

findCompleted(){


return this.findWhere({

Status:
"COMPLETED"

});


},







// отмененные

findCancelled(){


return this.findWhere({

Status:
"CANCELLED"

});


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
// FINANCE PREPARED API
// ============================================================


getRevenue(tripId){


const trip =
this.findById(tripId);



return Number(
trip?.Revenue || 0
);


},





getCost(tripId){


const trip =
this.findById(tripId);



return Number(
trip?.Cost || 0
);


},





getMargin(tripId){


return (

this.getRevenue(tripId)

-

this.getCost(tripId)

);


},
// ============================================================
// KPI PREPARED API
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
Number(trip?.Revenue || 0),


cost:
Number(trip?.Cost || 0),


margin:
this.getMargin(tripId)

};


},







getDriverKPI(driverId){


const trips =
this.findByDriver(
driverId
);



return {


driverId,


trips:
trips.length,


completed:
trips.filter(
t=>t.Status==="COMPLETED"
).length


};


},







getVehicleKPI(vehicleId){


const trips =
this.findByVehicle(
vehicleId
);



return {


vehicleId,


trips:
trips.length,


completed:
trips.filter(
t=>t.Status==="COMPLETED"
).length


};


},







// ============================================================
// METADATA
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

data:data

}

);


}



}
catch(e){


Logger.warn(

"TripRepository EventBus skipped: "+
e.message

);


}


},







// ============================================================
// AUDIT
// ============================================================


audit(
action,
data={}
){


try{


if(
typeof AuditLog!=="undefined"
&&
typeof AuditLog.write==="function"
){


AuditLog.write(

{

entity:this.entity,

action,

data

}

);


}



}
catch(e){


Logger.warn(

"TripRepository Audit skipped: "+
e.message

);


}


},







// ============================================================
// VALIDATION
// ============================================================


requireId(
id,
method
){


if(
id===undefined ||
id===null ||
id===""
){


throw new Error(

"TripRepository."+
method+
": id required"

);


}



return true;


},






requireObject(
data,
method
){


if(
!data ||
typeof data!=="object" ||
Array.isArray(data)
){


throw new Error(

"TripRepository."+
method+
": data must object"

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


Logger.warn(
"TripRepository RepositoryFactory unavailable"
);


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



idField:
meta?.idField ||
"TripID",



initialized:
this.initialized,



layers:{


metadata:
!!meta,


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