console.log("BaseRepository");


const BaseRepository = {


version:"1.0.0",



createRepository(config){


return {


entity:
config.entity,


table:
config.table,


idField:
config.idField || 
(config.entity+"ID"),



create(data){


SecurityGuard.check(
config.permissions.CREATE
);



if(!data[this.idField]){


data[this.idField] =
IdService.generate(
config.prefix || config.entity
);


}



data.OrganizationID =
OrganizationContext.get();



const result =
Database.insert(
this.table,
data
);



AuditLog.write(

"CREATE",

config.entity,

null,

result

);



EventBus.emit(

config.events.CREATED,

result

);



return result;


},







getById(id){


SecurityGuard.check(
config.permissions.READ
);



return Database.find(

this.table,

id

);


},







list(filters={}){


SecurityGuard.check(
config.permissions.READ
);



return Database.query(

this.table,

filters

);


},







update(id,data){


SecurityGuard.check(
config.permissions.UPDATE
);



const existing =
Database.find(

this.table,

id

);



if(!existing){


throw new Error(

config.entity+
" not found"

);


}




Versioning.save(

config.entity,

id,

existing

);




const merged={

...existing,

...data,

UpdatedAt:
new Date()

};




const updated =
Database.update(

this.table,

id,

merged

);




AuditLog.write(

"UPDATE",

config.entity,

existing,

updated

);




EventBus.emit(

config.events.UPDATED,

updated

);



return updated;


},







remove(id){


SecurityGuard.check(
config.permissions.DELETE
);



const existing =
Database.find(

this.table,

id

);



if(!existing){


throw new Error(

config.entity+
" not found"

);


}



Versioning.save(

config.entity,

id,

existing

);



const deleted = {

...existing,

Deleted:true,

UpdatedAt:
new Date()

};




const result =
Database.update(

this.table,

id,

deleted

);



AuditLog.write(

"DELETE",

config.entity,

existing,

result

);



EventBus.emit(

config.events.DELETED,

result

);



return result;


},







restore(id){


SecurityGuard.check(
config.permissions.RESTORE
);



const existing =
Database.find(

this.table,

id

);



if(!existing){


throw new Error(

config.entity+
" not found"

);


}



Versioning.save(

config.entity,

id,

existing

);




const restored={


...existing,


Deleted:false,


UpdatedAt:
new Date()


};




const result =
Database.update(

this.table,

id,

restored

);




AuditLog.write(

"RESTORE",

config.entity,

existing,

result

);



EventBus.emit(

config.events.RESTORED,

result

);



return result;


},







health(){


return HealthContract.create(

config.entity+"Repository",

"OK",

{

version:"1.0.0",

table:
config.table

}

);


}



};



}





};




globalThis.BaseRepository =
BaseRepository;