console.log("BaseRepository");


const BaseRepository = {

version:"4.0.0",


/*
====================================
CREATE
====================================
*/

create(entity,data={}){


const meta=this.getMeta(entity);


if(typeof EntityValidator!=="undefined"){
    EntityValidator.validate(entity,data);
}


this.checkPermission(meta,"create");


this.beforeCreate(entity,data,meta);



const idField=meta.idField || entity+"ID";


if(!data[idField]){
    data[idField]=IdService.generate(
        entity
    );
}



this.applySystemFields(
    meta,
    data
);



const result=
Database.insert(
    meta.table,
    data
);



this.afterCreate(
    entity,
    result,
    meta
);



this.emit(
    entity,
    meta.events?.created,
    null,
    result,
    "CREATE"
);



return result;


},



/*
====================================
READ ONE
====================================
*/


findById(entity,id,options={}){


const meta=this.getMeta(entity);


this.checkPermission(
meta,
"read"
);



const record=
Database.find(
meta.table,
id
);



if(!record)
return null;



if(
meta.softDelete!==false &&
!options.includeDeleted
){


if(
this.isDeleted(record,meta)
)
return null;


}



return record;


},




/*
====================================
READ ALL
====================================
*/


findAll(entity,filters={},options={}){


const meta=this.getMeta(entity);


this.checkPermission(
meta,
"read"
);



let rows=
Database.query(
meta.table,
filters
);



if(
meta.softDelete!==false &&
!options.includeDeleted
){


rows=
rows.filter(
r=>!this.isDeleted(r,meta)
);


}



return rows;


},




/*
====================================
UPDATE
====================================
*/


update(entity,id,data={}){


const meta=this.getMeta(entity);



this.checkPermission(
meta,
"update"
);



const old=
this.findById(
entity,
id,
{
includeDeleted:true
}
);



if(!old)
throw new Error(
entity+" not found"
);



const full={
...old,
...data
};



if(typeof EntityValidator!=="undefined"){
EntityValidator.validate(
entity,
full
);
}



if(typeof Versioning!=="undefined"){
Versioning.save(
entity,
id,
old
);
}




this.beforeUpdate(
entity,
old,
data,
meta
);



this.applySystemFields(
meta,
data,
true
);



const result=
Database.update(
meta.table,
id,
data
);



if(!result)
throw new Error(
"Update failed "+entity
);



this.afterUpdate(
entity,
old,
result,
meta
);



this.emit(
entity,
meta.events?.updated,
old,
result,
"UPDATE"
);



return result;


},




/*
====================================
DELETE
====================================
*/


delete(entity,id){


const meta=this.getMeta(entity);


this.checkPermission(
meta,
"delete"
);



const old=
this.findById(
entity,
id,
{
includeDeleted:true
}
);



if(!old)
throw new Error(
entity+" not found"
);




if(meta.softDelete===false){


return Database.delete(
meta.table,
id
);


}



const fields=
this.getDeleteFields(meta);



const update={};


update[fields.deleted]="true";

update[fields.date]=
new Date().toISOString();


update[fields.user]=
this.getCurrentUser();



const result=
Database.update(
meta.table,
id,
update
);



this.emit(
entity,
meta.events?.deleted,
old,
result,
"DELETE"
);



return result;


},




/*
====================================
RESTORE
====================================
*/


restore(entity,id){


const meta=this.getMeta(entity);


if(meta.softDelete===false)
throw new Error(
"Restore disabled"
);



const old=
this.findById(
entity,
id,
{
includeDeleted:true
}
);



if(!old)
throw new Error(
entity+" not found"
);



const fields=
this.getDeleteFields(meta);



const data={};



data[fields.deleted]="false";

data[fields.date]=null;

data[fields.user]=null;



this.applySystemFields(
meta,
data,
true
);



const result=
Database.update(
meta.table,
id,
data
);



this.emit(
entity,
meta.events?.restored,
old,
result,
"RESTORE"
);



return result;


},




/*
====================================
HELPERS
====================================
*/


getMeta(entity){


const meta=
EntityMetadata.get(
entity
);



if(!meta)
throw new Error(
"Metadata missing: "+entity
);



return meta;


},



isDeleted(record,meta){


const field=
meta.deleteField ||
"Deleted";


return (
record[field]===true ||
record[field]==="true" ||
record[field]===1 ||
record[field]==="1"
);


},



getDeleteFields(meta){


return {


deleted:
meta.deleteField ||
"Deleted",


date:
meta.deleteDateField ||
"DeletedAt",


user:
meta.deleteUserField ||
"DeletedBy"


};


},



applySystemFields(meta,data,update=false){



const now=
new Date().toISOString();



if(meta.timestamps!==false){


if(!update)
data.CreatedAt=
data.CreatedAt||now;


data.UpdatedAt=now;


}




if(
typeof OrganizationContext!=="undefined"
&&
meta.organization!==false
){


if(!data.OrganizationID){

data.OrganizationID=
OrganizationContext.get();

}


}



},




checkPermission(meta,action){


if(
typeof SecurityGuard==="undefined"
)
return;



const permission=
meta.permissions?.[action];



if(permission){

SecurityGuard.check(
permission
);

}


},




emit(entity,event,before,after,action){


if(
typeof EventBus==="undefined"
||
!event
)
return;



EventBus.emit(
event,
{

entity,

entityId:
this.getId(entity,after),

action,

before,

after,

source:
"BaseRepository",

timestamp:
new Date().toISOString()

}
);


},




getId(entity,obj){


if(!obj)
return null;



const meta=
this.getMeta(entity);



return obj[
meta.idField
];

},




getCurrentUser(){


if(
typeof UserSession!=="undefined"
&&
UserSession.getCurrent
){

return UserSession.getCurrent();

}


return "SYSTEM";


},




/*
====================================
HOOKS
====================================
*/


beforeCreate(){},

afterCreate(){},

beforeUpdate(){},

afterUpdate(){},

beforeDelete(){},

afterDelete(){},



/*
====================================
HEALTH
====================================
*/


health(){


return HealthContract.create(

"BaseRepository",

"OK",

{

version:this.version,

architecture:
"EntityMetadata v0.8 + EntityRegistry v2.2",

features:[

"CRUD",

"SoftDelete",

"Restore",

"Permissions",

"Validation",

"Versioning",

"EventBus",

"OrganizationScope"

]

}

);


}


};



globalThis.BaseRepository=
BaseRepository;


Logger.log(
"BaseRepository READY v"+
BaseRepository.version
);