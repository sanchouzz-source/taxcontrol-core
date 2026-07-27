// ============================================================
// EntityService v5.2.0
// Enterprise Application Service Layer
// TaxControl ERP Core
//
// Layer:
//
// Module
//    |
// EntityService
//    |
// RepositoryFactory
//    |
// Repository
//    |
// Database
//
// ============================================================


console.log("EntityService v5.2.0");



const EntityService = {


version:"5.2.0",


ready:false,







// ============================================================
// INIT
// ============================================================


init(){


if(this.ready){

return true;

}


this.ready=true;



Logger.log(
"EntityService READY v"+
this.version
);



return true;


},







// ============================================================
// ENTITY RESOLVE
// ============================================================


resolve(entity){


if(
typeof EntityRegistry!=="undefined" &&
EntityRegistry.resolve
){

return EntityRegistry.resolve(entity);

}



return entity;


},







// ============================================================
// METADATA
// ============================================================


getMeta(entity){


entity=this.resolve(entity);



if(
typeof EntityRegistry!=="undefined" &&
EntityRegistry.get
){

const meta =
EntityRegistry.get(entity);


if(meta){

return meta;

}

}



if(
typeof EntityMetadata!=="undefined" &&
EntityMetadata.get
){

return EntityMetadata.get(entity);

}



throw new Error(
"Metadata missing "+entity
);



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
// PREPARE DATA
// ============================================================


prepareData(entity,data={}){


const result={
...data
};



const meta=
this.getMeta(entity);




// ORGANIZATION

if(
meta.organization!==false &&
typeof OrganizationContext!=="undefined"
){


result.OrganizationID =
result.OrganizationID ||
OrganizationContext.get();


}




// TENANT

if(
meta.tenant!==false &&
typeof TenantContext!=="undefined"
){


result.TenantID =
result.TenantID ||
TenantContext.get();


}



return result;


},







// ============================================================
// ID GENERATION
// ============================================================


generateId(meta,data){



if(
!meta.idField
){

return data;

}



if(
data[meta.idField]
){

return data;

}




if(
typeof IdService!=="undefined" &&
IdService.generate
){


data[meta.idField]=
IdService.generate(

meta.idPrefix ||
meta.idField

);


}



return data;


},







// ============================================================
// VALIDATION
// ============================================================


validate(entity,data){



if(
typeof EntityValidator!=="undefined" &&
EntityValidator.validate
){


return EntityValidator.validate(
entity,
data
);


}



if(
typeof EntityMetadata!=="undefined" &&
EntityMetadata.validate
){


return EntityMetadata.validate(
entity,
data
);


}



return true;


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



data=this.generateId(
meta,
data
);



this.validate(
entity,
data
);



const result=
this.getRepository(entity)
.create(
data
);




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





// compatibility

getById(entity,id,options={}){


return this.findById(
entity,
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



if(
typeof repo.findWhere==="function"
){

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


const repo=
this.getRepository(entity);



if(repo.existsBy){

return repo.existsBy(
field,
value,
options
);

}



return false;


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



const result=
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
// DELETE
// ============================================================


delete(entity,id){


entity=this.resolve(entity);



const meta=
this.getMeta(entity);



this.checkPermission(
meta,
"delete"
);



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







// ============================================================
// RESTORE
// ============================================================


restore(entity,id){


entity=this.resolve(entity);



const meta=
this.getMeta(entity);



this.checkPermission(
meta,
"restore"
);



const result=
this.getRepository(entity)
.restore(id);



this.emit(
entity,
"restored",
null,
result,
"RESTORE"
);



return result;


},







// ============================================================
// BULK
// ============================================================


bulkCreate(entity,list=[]){


return list.map(
item=>
this.create(
entity,
item
)
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
typeof TransactionManager!=="undefined" &&
TransactionManager.run
){

return TransactionManager.run(
callback
);

}



if(
typeof BaseRepository!=="undefined" &&
BaseRepository.transaction
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



const permission =
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
typeof EventBus==="undefined" ||
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
// DIAGNOSTICS
// ============================================================


diagnostics(){


return{


version:this.version,


ready:this.ready,


repositoryFactory:
typeof RepositoryFactory!=="undefined",


entityRegistry:
typeof EntityRegistry!=="undefined",


eventBus:
typeof EventBus!=="undefined",



features:[

"CRUD",

"Validation",

"AutoID",

"RepositoryPattern",

"OrganizationScope",

"TenantScope",

"SoftDelete",

"Restore",

"Events",

"AuditReady",

"VersioningReady",

"BulkOperations",

"Transactions"

]


};


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
"Enterprise Application Service Layer",


diagnostics:
this.diagnostics()


}


);


}



};







globalThis.EntityService =
EntityService;



Logger.log(
"EntityService GLOBAL READY v"+
EntityService.version
);