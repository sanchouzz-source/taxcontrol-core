// ============================================================
// EntityService v5.1.0
// Enterprise Application Service Layer
// TaxControl ERP Core
// ============================================================


console.log("EntityService v5.1.0");



const EntityService = {


version:"5.1.0",

ready:false,







// ============================================================
// INIT
// ============================================================


init(){


this.ready=true;


Logger.log(
"EntityService READY v"+
this.version
);


return true;


},








// ============================================================
// RESOLVE
// ============================================================


resolve(entity){


if(
typeof EntityRegistry!=="undefined"
&&
EntityRegistry.resolve
){

return EntityRegistry.resolve(entity);

}


return entity;

},








// ============================================================
// META
// ============================================================


getMeta(entity){


entity=this.resolve(entity);



if(
EntityRegistry?.get
){

return EntityRegistry.get(entity);

}



if(
EntityMetadata?.get
){

return EntityMetadata.get(entity);

}



throw new Error(
"Metadata missing "+entity
);


},








getTable(entity){


return this.getMeta(entity).table;


},









// ============================================================
// REPOSITORY
// ============================================================


getRepository(entity){


entity=this.resolve(entity);



if(
typeof RepositoryFactory==="undefined"
){

throw new Error(
"RepositoryFactory unavailable"
);

}



return RepositoryFactory.get(entity);


},









// ============================================================
// PREPARE
// ============================================================


prepareData(entity,data={}){


const result={
...data
};



const meta =
this.getMeta(entity);



if(
typeof OrganizationContext!=="undefined"
&&
meta.organization!==false
){


result.OrganizationID =
result.OrganizationID ||
OrganizationContext.get();


}



if(
typeof TenantContext!=="undefined"
&&
meta.tenant!==false
){


result.TenantID =
result.TenantID ||
TenantContext.get();


}



return result;


},







// ============================================================
// VALIDATION
// ============================================================


validate(entity,data){


if(
typeof EntityValidator==="undefined"
){

return true;

}



return EntityValidator.validate(
entity,
data
);


},







// ============================================================
// CREATE
// ============================================================


create(entity,data={}){


entity=this.resolve(entity);


const meta=
this.getMeta(entity);



this.checkPermission(
meta,
"create"
);



data=this.prepareData(
entity,
data
);



this.validate(
entity,
data
);



const result =
this.getRepository(entity)
.create(data);



this.emit(
entity,
"created",
null,
result,
"CREATE"
);



return result;


},







// ============================================================
// READ
// ============================================================


findById(entity,id,options={}){


entity=this.resolve(entity);


return this.getRepository(entity)
.findById(
id,
options
);


},





findAll(entity,filters={},options={}){


entity=this.resolve(entity);


return this.getRepository(entity)
.findAll(
filters,
options
);


},





findWhere(entity,criteria={},options={}){


const repo=
this.getRepository(entity);



if(repo.findWhere){

return repo.findWhere(
criteria,
options
);

}



return this.findAll(
entity,
criteria,
options
);


},







exists(entity,id,options={}){


return this.getRepository(entity)
.exists(
id,
options
);


},







existsBy(entity,field,value,options={}){


return this.getRepository(entity)
.existsBy(
field,
value,
options
);


},








count(entity,filters={}){


const repo=
this.getRepository(entity);



if(repo.count){

return repo.count(
filters
);

}



return this.findAll(
entity,
filters
).length;


},







// ============================================================
// UPDATE
// ============================================================


update(entity,id,data={}){


entity=this.resolve(entity);


const meta=
this.getMeta(entity);



this.checkPermission(
meta,
"update"
);



const before=
this.findById(
entity,
id,
{
includeDeleted:true
}
);



if(!before){

throw new Error(
entity+
" not found "+
id
);

}



data=this.prepareData(
entity,
data
);



this.validate(
entity,
{
...before,
...data
}
);



const result =
this.getRepository(entity)
.update(
id,
data
);



this.emit(
entity,
"updated",
before,
result,
"UPDATE"
);



return result;


},







// ============================================================
// DELETE RESTORE
// ============================================================


delete(entity,id){


entity=this.resolve(entity);



const before=
this.findById(
entity,
id,
{
includeDeleted:true
}
);



const result=
this.getRepository(entity)
.delete(id);



this.emit(
entity,
"deleted",
before,
result,
"DELETE"
);



return result;


},





restore(entity,id){


entity=this.resolve(entity);


return this.getRepository(entity)
.restore(id);


},







// ============================================================
// BULK
// ============================================================


bulkCreate(entity,list=[]){


return list.map(
x=>
this.create(entity,x)
);


},





bulkUpdate(entity,ids,data){


return ids.map(
id=>
this.update(
entity,
id,
data
)
);


},







// ============================================================
// TRANSACTION
// ============================================================


transaction(callback){


if(
BaseRepository?.transaction
){

return BaseRepository.transaction(
callback
);

}


return callback();


},







// ============================================================
// PERMISSION
// ============================================================


checkPermission(meta,action){


if(
typeof SecurityGuard==="undefined"
){

return;

}



const permission=
meta.permissions?.[action];



if(permission){

SecurityGuard.check(
permission
);

}


},







// ============================================================
// EVENTS
// ============================================================


emit(entity,type,before,after,action){



if(
typeof EventBus==="undefined"
||
!EventBus.emit
){

return;

}



const meta=
this.getMeta(entity);



const event =
meta.events?.[type];



if(!event){

return;

}



EventBus.emit(
event,
{

entity,

action,

before,

after,

source:"EntityService",

timestamp:
new Date().toISOString()

}

);


},







// ============================================================
// SAFE EXECUTE
// ============================================================


safeExecute(name,fn){


try{

return fn();

}
catch(e){

Logger.error(
name+
" FAILED "+
e.message
);


throw e;

}


},







// ============================================================
// HEALTH
// ============================================================


health(){


return HealthContract.create(

"EntityService",

this.ready
?
"OK"
:
"WARNING",

{

version:this.version,


architecture:
"Application Service Layer",


features:[

"CRUD",

"RepositoryFactory",

"EntityRegistry",

"Metadata",

"Validation",

"Permissions",

"OrganizationScope",

"TenantScope",

"SoftDelete",

"Restore",

"EventBus",

"Audit",

"Versioning",

"BulkOperations",

"Transactions"

]


}

);


}



};






globalThis.EntityService=
EntityService;



Logger.log(
"EntityService GLOBAL READY v"+
EntityService.version
);