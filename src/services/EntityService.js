// ============================================================
// EntityService v5.3.0 CORE
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
// Compatible:
//
// EntityRegistry v2.5.1
// SchemaRegistry v4.0.6
// RepositoryFactory v2.8.0
// BaseRepository v5.7+
//
// ============================================================


console.log("EntityService v5.3.0");



const EntityService = {



version:"5.3.0",


ready:false,


cacheEnabled:true,


cache:{},


bulkLimit:500,









// ============================================================
// INIT
// ============================================================


init(){


if(this.ready){

return true;

}



Logger.log(
"EntityService INIT v"+
this.version
);



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



if(!entity){

throw new Error(
"Entity required"
);

}




if(
typeof EntityRegistry!=="undefined"
&&
EntityRegistry.resolve
){

return EntityRegistry.resolve(entity);

}





if(
typeof SchemaRegistry!=="undefined"
&&
SchemaRegistry.get
){


const schema =
SchemaRegistry.get(entity);



if(schema?.entity){

return schema.entity;

}


}





return String(entity)
.toUpperCase();



},







// ============================================================
// METADATA
// ============================================================


getMeta(entity){



entity =
this.resolve(entity);





// primary source

if(
typeof EntityRegistry!=="undefined"
&&
EntityRegistry.get
){

const meta =
EntityRegistry.get(entity);



if(meta){

return meta;

}


}






// schema fallback

if(
typeof SchemaRegistry!=="undefined"
&&
SchemaRegistry.get
){

const schema =
SchemaRegistry.get(entity);



if(schema){

return schema;

}


}






// metadata fallback

if(
typeof EntityMetadata!=="undefined"
&&
EntityMetadata.get
){

const meta =
EntityMetadata.get(entity);



if(meta){

return meta;

}


}





throw new Error(
"Metadata missing "+
entity
);



},







// ============================================================
// REPOSITORY
// ============================================================


getRepository(entity){



entity =
this.resolve(entity);





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



const meta =
this.getMeta(entity);





// Organization scope

const organizationEnabled =

meta.organization!==false

||

meta.options?.organization===true;






if(
organizationEnabled
&&
typeof OrganizationContext!=="undefined"
){


if(
!result.OrganizationID
){


result.OrganizationID =
OrganizationContext.get();


}



}






// Tenant scope

const tenantEnabled =

meta.tenant!==false

||

meta.options?.tenant===true;





if(
tenantEnabled
&&
typeof TenantContext!=="undefined"
){


if(
!result.TenantID
){


result.TenantID =
TenantContext.get();


}



}







return result;


},







// ============================================================
// ID GENERATION
// ============================================================


generateId(entity,data){



const meta =
this.getMeta(entity);



const idField =
meta.idField;



if(
!idField
){

return data;

}





if(
data[idField]
){

return data;

}





if(
typeof IdService!=="undefined"
&&
IdService.generate
){


data[idField]=

IdService.generate(

meta.idPrefix ||
idField

);


}




return data;


},







// ============================================================
// VALIDATION
// ============================================================


validate(entity,data){



if(
typeof EntityValidator!=="undefined"
&&
EntityValidator.validate
){



return EntityValidator.validate(

this.resolve(entity),

data

);



}



return true;


},







// ============================================================
// CREATE
// ============================================================


create(entity,data={}){



entity =
this.resolve(entity);





const meta =
this.getMeta(entity);





this.checkPermission(
meta,
"create"
);





data =
this.prepareData(
entity,
data
);





data =
this.generateId(
entity,
data
);





this.validate(
entity,
data
);






const repo =
this.getRepository(entity);





const result =
repo.create(data);






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



entity =
this.resolve(entity);





return this.getRepository(entity)

.findById(

id,

options

);



},







getById(entity,id,options={}){


return this.findById(
entity,
id,
options
);


},







findAll(entity,filters={},options={}){



entity =
this.resolve(entity);





return this.getRepository(entity)

.findAll(

filters,

options

);



},







findWhere(entity,criteria={},options={}){



const repo =
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







exists(entity,id){


return this.getRepository(entity)

.exists(id);


},







existsBy(entity,field,value){



const repo =
this.getRepository(entity);



if(
repo.existsBy
){

return repo.existsBy(
field,
value
);


}



return false;


},







count(entity,filters={}){


const repo =
this.getRepository(entity);



if(
repo.count
){

return repo.count(filters);

}



return this.findAll(
entity,
filters
)
.length;



},
// ============================================================
// UPDATE
// ============================================================


update(entity,id,data={}){


entity =
this.resolve(entity);



const meta =
this.getMeta(entity);



this.checkPermission(
meta,
"update"
);





const before =
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






data =
this.prepareData(
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






this.invalidateCache(
entity,
id
);





this.emit(

entity,

"updated",

before,

result,

"UPDATE"

);





this.audit(

"UPDATE",

entity,

id,

before,

result

);





return result;


},







// ============================================================
// DELETE
// ============================================================


delete(entity,id){



entity =
this.resolve(entity);



const meta =
this.getMeta(entity);



this.checkPermission(
meta,
"delete"
);






const before =
this.findById(

entity,

id,

{
includeDeleted:true
}

);






const result =

this.getRepository(entity)

.delete(id);






this.invalidateCache(
entity,
id
);






this.emit(

entity,

"deleted",

before,

result,

"DELETE"

);






this.audit(

"DELETE",

entity,

id,

before,

result

);






return result;


},







// ============================================================
// RESTORE
// ============================================================


restore(entity,id){



entity =
this.resolve(entity);



const meta =
this.getMeta(entity);



this.checkPermission(
meta,
"restore"
);





const result =

this.getRepository(entity)

.restore(id);






this.invalidateCache(
entity,
id
);






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
// BULK CREATE
// ============================================================


bulkCreate(entity,list=[]){



if(
!Array.isArray(list)
){

throw new Error(
"Bulk data must be array"
);

}





const result=[];



for(
let i=0;
i<list.length;
i+=this.bulkLimit
){



const batch =
list.slice(
i,
i+this.bulkLimit
);




batch.forEach(item=>{


result.push(

this.create(
entity,
item
)

);



});



}



return result;


},







// ============================================================
// BULK UPDATE
// ============================================================


bulkUpdate(entity,ids,data={}){



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
typeof TransactionManager!=="undefined"
&&
TransactionManager.run
){


return TransactionManager.run(
callback
);


}






if(
typeof BaseRepository!=="undefined"
&&
BaseRepository.transaction
){


return BaseRepository.transaction(
callback
);


}





return callback();


},







// ============================================================
// PERMISSIONS
// ============================================================


checkPermission(meta,action){



if(
typeof SecurityGuard==="undefined"
){

return;

}





const permissions =
meta.permissions ||
meta.options?.permissions;






const permission =
permissions?.[action];






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






const meta =
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
// AUDIT
// ============================================================


audit(action,entity,id,before,after){



if(
typeof AuditLog==="undefined"
){

return;

}



if(
typeof AuditLog.write!=="function"
){

return;

}





AuditLog.write({

action,


entity,


entityId:id,


before,


after,


source:"EntityService",


timestamp:
new Date().toISOString()


});



},







// ============================================================
// CACHE
// ============================================================


cacheKey(entity,id){


return entity+
":"+
id;


},







getCached(entity,id){



if(
!this.cacheEnabled
){

return null;

}



return this.cache[
this.cacheKey(entity,id)
]
||
null;


},







setCache(entity,id,data){



if(
!this.cacheEnabled
){

return data;

}





this.cache[

this.cacheKey(entity,id)

]=data;



return data;


},







invalidateCache(entity,id){



delete this.cache[

this.cacheKey(
entity,
id
)

];


},







clearCache(){


this.cache={};


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


repositoryFactory:

typeof RepositoryFactory!=="undefined",


entityRegistry:

typeof EntityRegistry!=="undefined",


eventBus:

typeof EventBus!=="undefined",


cache:

this.cacheEnabled,


bulkLimit:

this.bulkLimit


}


);



},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){



return {


module:"EntityService",


version:this.version,


ready:this.ready,


cacheSize:

Object.keys(
this.cache
).length,



bulkLimit:

this.bulkLimit,



dependencies:{


RepositoryFactory:

typeof RepositoryFactory!=="undefined",


EntityRegistry:

typeof EntityRegistry!=="undefined",


SchemaRegistry:

typeof SchemaRegistry!=="undefined",


EventBus:

typeof EventBus!=="undefined",


AuditLog:

typeof AuditLog!=="undefined"


},




features:[


"CRUD",

"RepositoryPattern",

"MetadataResolution",

"Validation",

"AutoID",

"OrganizationScope",

"TenantScope",

"SoftDelete",

"Restore",

"Events",

"Audit",

"Cache",

"BulkOperations",

"Transactions",

"Permissions"


]



};



},







// ============================================================
// RESET
// ============================================================


reset(){



this.cache={};


this.ready=false;



Logger.log(
"EntityService RESET"
);



}







};







globalThis.EntityService =
EntityService;



Logger.log(

"EntityService GLOBAL READY v"+
EntityService.version

);