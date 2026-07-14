console.log("BaseRepository");


const BaseRepository = {


create(entityConfig, data){


SecurityGuard.check(
entityConfig.permissions.create
);



if(!data[entityConfig.idField]){


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
entity:entityConfig.entity,
action:"CREATE",
before:null,
after:result
}
);



return result;


},




update(entityConfig,id,data){


SecurityGuard.check(
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



const merged = {


...existing,

...data

};



merged[entityConfig.idField]=id;



merged.OrganizationID =
OrganizationContext.get();



const updated =
Database.update(
entityConfig.table,
id,
merged
);



EventBus.emit(
entityConfig.events.updated,
{
entity:entityConfig.entity,
action:"UPDATE",
before:existing,
after:updated
}
);



return updated;


},





delete(entityConfig,id){


SecurityGuard.check(
entityConfig.permissions.delete
);



const existing =
Database.find(
entityConfig.table,
id
);



if(!existing){

throw new Error(
"Entity not found"
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
UpdatedAt:new Date().toISOString()
}
);



EventBus.emit(
entityConfig.events.deleted,
{
entity:entityConfig.entity,
action:"DELETE",
before:existing,
after:deleted
}
);



return deleted;


},





restore(entityConfig,id){


SecurityGuard.check(
entityConfig.permissions.update
);



const existing =
Database.find(
entityConfig.table,
id
);



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
UpdatedAt:new Date().toISOString()
}
);



EventBus.emit(
entityConfig.events.restored,
{
entity:entityConfig.entity,
action:"RESTORE",
before:existing,
after:restored
}
);



return restored;


},




getById(entityConfig,id){


SecurityGuard.check(
entityConfig.permissions.read
);



return Database.find(
entityConfig.table,
id
);


},




list(entityConfig){


SecurityGuard.check(
entityConfig.permissions.read
);



return Database.query(
entityConfig.table,
{
Deleted:false
}
);


}



};



globalThis.BaseRepository =
BaseRepository;