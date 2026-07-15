console.log("TripRepository");



const TripRepository = {



version:"0.4.0",



entity:
EntityRegistry.TRIP,





// =========================
// CREATE
// =========================


create(data){



SecurityGuard.require(

PERMISSION_TRIP_CREATE

);




data =
TripValidator.validate(
data
);




if(!data[this.entity.idField]){


data[this.entity.idField] =

IdService.generate(

this.entity.table

);


}




data.OrganizationID =
OrganizationContext.get();





const result =
Database.insert(

this.entity.table,

data

);






EventBus.emit(

this.entity.events.created,

{


entity:this.entity.entity,


action:"CREATE",


actor:
SecurityGuard.getCurrentUser(),


before:null,


after:result


}


);





return result;



},







// =========================
// UPDATE
// =========================



update(tripId,data){



SecurityGuard.require(

PERMISSION_TRIP_UPDATE

);





const existing =

Database.find(

this.entity.table,

tripId

);





if(!existing){


throw new Error(

"Trip not found: "
+
tripId

);


}






Versioning.save(

this.entity.entity,

tripId,

existing

);







const merged={


...existing,


...data


};





let validated =

TripValidator.validate(

merged

);





validated[this.entity.idField]=

tripId;





validated.OrganizationID =

OrganizationContext.get();






const updated =

Database.update(

this.entity.table,

tripId,

validated

);







EventBus.emit(

this.entity.events.updated,

{


entity:this.entity.entity,


action:"UPDATE",


actor:
SecurityGuard.getCurrentUser(),


before:existing,


after:updated


}


);







// =========================
// BUSINESS EVENT
// =========================


if(

updated.Status==="COMPLETED"

){



EventBus.emit(

"TRIP_COMPLETED",

{


entity:"TRIP",


trip:updated,


actor:
SecurityGuard.getCurrentUser()


}

);


}






return updated;



},







// =========================
// GET
// =========================



getById(id){



SecurityGuard.require(

PERMISSION_TRIP_READ

);





return Database.find(

this.entity.table,

id

);



},







// =========================
// LIST
// =========================



list(){



SecurityGuard.require(

PERMISSION_TRIP_READ

);





return Database.query(

this.entity.table,

{

Deleted:false

}

);



},







// =========================
// DELETE
// =========================


delete(tripId){



SecurityGuard.require(

PERMISSION_TRIP_DELETE

);





const existing =

Database.find(

this.entity.table,

tripId

);





if(!existing){


throw new Error(

"Trip not found: "
+
tripId

);


}





Versioning.save(

this.entity.entity,

tripId,

existing

);






const deleted =

Database.update(

this.entity.table,

tripId,

{


Deleted:true,


UpdatedAt:
new Date().toISOString()


}

);







EventBus.emit(

this.entity.events.deleted,

{


entity:this.entity.entity,


action:"DELETE",


actor:
SecurityGuard.getCurrentUser(),


before:existing,


after:deleted


}


);





return deleted;



},







// =========================
// RESTORE
// =========================


restore(tripId){



SecurityGuard.require(

PERMISSION_TRIP_RESTORE

);





const existing =

Database.find(

this.entity.table,

tripId

);





if(!existing){


throw new Error(

"Trip not found: "
+
tripId

);


}






const restored =

Database.update(

this.entity.table,

tripId,

{


Deleted:false,


UpdatedAt:
new Date().toISOString()


}

);






EventBus.emit(

this.entity.events.restored,

{


entity:this.entity.entity,


action:"RESTORE",


actor:
SecurityGuard.getCurrentUser(),


before:existing,


after:restored


}


);





return restored;



},







health(){



return HealthContract.create(


"TripRepository",


"OK",


{


version:this.version,


entity:this.entity.entity,



dependencies:{



Database:!!Database,


EventBus:!!EventBus,


SecurityGuard:!!SecurityGuard,


Versioning:!!Versioning,


EntityRegistry:!!EntityRegistry,


TripValidator:!!TripValidator


}



}


);



}



};




globalThis.TripRepository =
TripRepository;