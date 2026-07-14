console.log("ClientRepository");


const ClientRepository = {


version:"0.3.0",



entity:
EntityRegistry.CLIENT,




// CREATE

create(data){


SecurityGuard.check(
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

before:null,

after:result

}

);



return result;


},





// UPDATE


update(clientId,data){


SecurityGuard.check(
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




const merged = {


...existing,

...data


};




const validated =
ClientValidator.validate(
merged
);



validated.OrganizationID =
OrganizationContext.get();



validated[this.entity.idField] =
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

before:existing,

after:updated

}

);



return updated;


},






// GET


getById(id){


SecurityGuard.check(
PERMISSION_CLIENT_READ
);



return Database.find(
this.entity.table,
id
);


},






// LIST


list(){


SecurityGuard.check(
PERMISSION_CLIENT_READ
);



return Database.query(

this.entity.table,

{
Deleted:false
}

);


},







// RESTORE


restore(clientId){


SecurityGuard.check(
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




if(

existing.Deleted === false ||

existing.Deleted === "false"

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

UpdatedAt:new Date().toISOString()

}

);





EventBus.emit(

this.entity.events.restored,

{

entity:this.entity.entity,

action:"RESTORE",

before:existing,

after:restored

}

);




return restored;


},







// DELETE


delete(clientId){


SecurityGuard.check(
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

UpdatedAt:new Date().toISOString()

}

);





EventBus.emit(

this.entity.events.deleted,

{

entity:this.entity.entity,

action:"DELETE",

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


EntityRegistry:!!EntityRegistry


}


}

);


}




};




globalThis.ClientRepository =
ClientRepository;