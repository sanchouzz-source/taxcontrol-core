console.log("BaseRepository");



const BaseRepository = {



version:"0.5.0",





// =========================
// CREATE
// =========================


create(entityConfig,data){



SecurityGuard.require(

entityConfig.permissions.create

);





if(
entityConfig.validator
){

if(
entityConfig.validator &&
typeof entityConfig.validator.validate==="function"
){

data =
entityConfig.validator.validate(data);

}
else{

Logger.warn(
"VALIDATOR NOT FOUND FOR "
+
entityConfig.entity
);

}

}






if(
!data[entityConfig.idField]
){


data[entityConfig.idField] =

IdService.generate(

entityConfig.table

);


}






data.OrganizationID =

OrganizationContext.get();






const result =

Database.insert(

entityConfig.table,

data

);






EventBus.emit(

entityConfig.events.created,

{


entity:
entityConfig.entity,


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



update(entityConfig,id,data){



SecurityGuard.require(

entityConfig.permissions.update

);





const existing =

Database.find(

entityConfig.table,

id

);





if(!existing){


throw new Error(

"Entity not found: "
+
id

);


}






Versioning.save(

entityConfig.entity,

id,

existing

);






const merged={


...existing,


...data


};





let validated = merged;





if(
entityConfig.validator
){

validated =

entityConfig.validator.validate(

merged

);

}






validated[
entityConfig.idField
]=id;




validated.OrganizationID =

OrganizationContext.get();






const updated =

Database.update(

entityConfig.table,

id,

validated

);







EventBus.emit(

entityConfig.events.updated,

{


entity:
entityConfig.entity,


action:"UPDATE",


actor:
SecurityGuard.getCurrentUser(),


before:existing,


after:updated


}


);





return updated;



},







// =========================
// DELETE
// =========================



delete(entityConfig,id){



SecurityGuard.require(

entityConfig.permissions.delete

);





const existing =

Database.find(

entityConfig.table,

id

);





if(!existing){


throw new Error(

"Entity not found: "
+
id

);


}





Versioning.save(

entityConfig.entity,

id,

existing

);







const deleted =

Database.update(

entityConfig.table,

id,

{


Deleted:true,


UpdatedAt:
new Date().toISOString()


}

);






EventBus.emit(

entityConfig.events.deleted,

{


entity:
entityConfig.entity,


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



restore(entityConfig,id){



SecurityGuard.require(

entityConfig.permissions.restore

);





const existing =

Database.find(

entityConfig.table,

id

);





if(!existing){


throw new Error(

"Entity not found: "
+
id

);


}







Versioning.save(

entityConfig.entity,

id,

existing

);






const restored =

Database.update(

entityConfig.table,

id,

{


Deleted:false,


UpdatedAt:
new Date().toISOString()


}

);







EventBus.emit(

entityConfig.events.restored,

{


entity:
entityConfig.entity,


action:"RESTORE",


actor:
SecurityGuard.getCurrentUser(),


before:existing,


after:restored


}


);





return restored;



},







// =========================
// GET
// =========================



getById(entityConfig,id){



SecurityGuard.require(

entityConfig.permissions.read

);





return Database.find(

entityConfig.table,

id

);



},







// =========================
// LIST
// =========================



list(entityConfig){



SecurityGuard.require(

entityConfig.permissions.read

);





return Database.query(

entityConfig.table,

{


Deleted:false


}

);



},







// =========================
// HEALTH
// =========================



health(){



return HealthContract.create(

"BaseRepository",


"OK",


{


version:this.version,



dependencies:{


Database:!!Database,


EventBus:!!EventBus,


SecurityGuard:!!SecurityGuard,


Versioning:!!Versioning,


IdService:!!IdService


}



}


);



}



};





globalThis.BaseRepository =
BaseRepository;