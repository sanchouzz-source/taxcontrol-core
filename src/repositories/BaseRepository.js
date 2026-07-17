console.log("BaseRepository");


const BaseRepository = {


version:"1.0.0",



create(
table,
data,
entity,
permission
){


SecurityGuard.check(
permission + "_CREATE"
);



if(!data.ID){

data.ID =
IdService.generate(entity);

}



data.OrganizationID =
OrganizationContext.get();



const result =
Database.insert(
table,
data
);




EventBus.emit(
entity + "_CREATED",
result
);



return result;


},






findById(
table,
id,
entity,
permission
){


SecurityGuard.check(
permission + "_READ"
);



return Database.find(
table,
id
);


},








findAll(
table,
filters={},
entity,
permission
){


SecurityGuard.check(
permission + "_READ"
);



return Database.query(
table,
filters
);


},







update(
table,
id,
data,
entity,
permission
){


SecurityGuard.check(
permission + "_UPDATE"
);



const existing =
Database.find(
table,
id
);



if(!existing){

throw new Error(
entity+" not found"
);

}




Versioning.save(
entity,
id,
existing
);



const updated = {

...existing,

...data,

UpdatedAt:
new Date().toISOString()

};




const result =
Database.update(
table,
id,
updated
);






EventBus.emit(
entity+"_UPDATED",
result
);



return result;


},







delete(
table,
id,
entity,
permission
){


SecurityGuard.check(
permission+"_DELETE"
);



const existing =
Database.find(
table,
id
);



if(!existing){

throw new Error(
entity+" not found"
);

}



Versioning.save(
entity,
id,
existing
);



const result =
Database.update(
table,
id,
{

...existing,

Deleted:true,

UpdatedAt:
new Date().toISOString()

}

);





EventBus.emit(
entity+"_DELETED",
result
);



return result;


},







restore(
table,
id,
entity,
permission
){


SecurityGuard.check(
permission+"_RESTORE"
);



const existing =
Database.find(
table,
id
);



if(!existing){

throw new Error(
entity+" not found"
);

}



Versioning.save(
entity,
id,
existing
);



const result =
Database.update(
table,
id,
{

...existing,

Deleted:false,

UpdatedAt:
new Date().toISOString()

}

);






EventBus.emit(
entity+"_RESTORED",
result
);



return result;


},







exists(
table,
id
){


return !!Database.find(
table,
id
);


}




};



globalThis.BaseRepository =
BaseRepository;



Logger.log(
"BaseRepository READY v1.0.0"
);