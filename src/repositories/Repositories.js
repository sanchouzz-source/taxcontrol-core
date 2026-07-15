console.log("ClientRepository");



const ClientRepository = {



version:"0.4.0",



entity:
EntityRegistry.CLIENT,





create(data){



SecurityGuard.require(
PERMISSION_CLIENT_CREATE
);




data =
ClientValidator.validate(
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







update(clientId,data){



SecurityGuard.require(
PERMISSION_CLIENT_UPDATE
);




const existing =
Database.find(

this.entity.table,

clientId

);




if(!existing){


throw new Error(

"Client not found: "
+
clientId

);


}





Versioning.save(

this.entity.entity,

clientId,

existing

);





const merged={

...existing,

...data

};




const validated =
ClientValidator.validate(
merged
);





validated.OrganizationID =
OrganizationContext.get();



validated[this.entity.idField]=
clientId;





const updated =
Database.update(

this.entity.table,

clientId,

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




return updated;



},







getById(id){



SecurityGuard.require(
PERMISSION_CLIENT_READ
);



return Database.find(

this.entity.table,

id

);


},







list(){



SecurityGuard.require(
PERMISSION_CLIENT_READ
);



return Database.query(

this.entity.table,

{

Deleted:false

}

);


},







restore(clientId){



SecurityGuard.require(
PERMISSION_CLIENT_RESTORE
);




const existing =
Database.find(

this.entity.table,

clientId

);




if(!existing){


throw new Error(

"Client not found: "
+
clientId

);


}




if(

existing.Deleted===false ||

existing.Deleted==="false"

){


return existing;


}






Versioning.save(

this.entity.entity,

clientId,

existing

);






const restored =
Database.update(

this.entity.table,

clientId,

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







delete(clientId){



SecurityGuard.require(
PERMISSION_CLIENT_DELETE
);





const existing =
Database.find(

this.entity.table,

clientId

);




if(!existing){


throw new Error(

"Client not found: "
+
clientId

);


}





Versioning.save(

this.entity.entity,

clientId,

existing

);






const deleted =
Database.update(

this.entity.table,

clientId,

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







health(){



return HealthContract.create(

"ClientRepository",


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


ClientValidator:!!ClientValidator


}



}

);


}



};




globalThis.ClientRepository =
ClientRepository;