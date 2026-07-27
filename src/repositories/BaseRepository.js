// ============================================================
// BaseRepository v5.7.3
// Enterprise Repository Base
// TaxControl ERP Core
//
// Sprint 1 CORE-001
//
// Compatible:
// Database v4.2+
// EntityRegistry v2.4+
// RepositoryFactory v2.7+
// EntityService v5+
// ============================================================


console.log("BaseRepository v5.7.3");



const BaseRepository = {


version:"5.7.3",


architecture:
"EntityService -> RepositoryFactory -> Repository -> Database",



_initialized:false,

_adapter:null,

entity:null,





// ============================================================
// INIT
// ============================================================


init(database){


if(this._initialized){

return true;

}



this._adapter =
database ||
(
typeof Database!=="undefined"
?
Database
:
null
);



if(!this._adapter){

throw new Error(
"BaseRepository Database unavailable"
);

}



this._initialized=true;



Logger.log(
"BaseRepository READY v"+
this.version
);



return true;


},







// ============================================================
// REQUIRE
// ============================================================


_requireAdapter(){


if(!this._initialized){

this.init();

}



if(!this._adapter){

throw new Error(
"BaseRepository adapter missing"
);

}



return this._adapter;


},







// ============================================================
// FACTORY
// ============================================================


createRepository(entity){


const repo =
Object.create(this);



repo.entity =
EntityRegistry.resolve(entity);



repo._initialized=false;



repo.init();



return repo;


},







// ============================================================
// META
// ============================================================


getMeta(entity=null){



const name =
entity ||
this.entity;



if(!name){

throw new Error(
"Repository entity missing"
);

}



return EntityRegistry.get(name);


},







// ============================================================
// CREATE
// ============================================================


create(entityOrData,dataOrOptions={},options={}){


this._requireAdapter();



let entity;
let data;



if(this.entity){


entity=this.entity;

data=entityOrData || {};


}

else{


entity=entityOrData;

data=dataOrOptions || {};


}




const meta =
EntityRegistry.get(entity);



const payload={
...data
};



const idField =
meta.idField ||
"ID";



if(!payload[idField]){


payload[idField]=
IdService.generate(entity);


}



this.applySystemFields(
meta,
payload,
false
);




if(
typeof EntityValidator!=="undefined"
&&
EntityValidator.validate
){


EntityValidator.validate(
entity,
payload
);


}




let result =
this._adapter.insert(
entity,
payload
);



if(
!result ||
typeof result!=="object"
){

result={
...payload
};

}



this.emit(
meta.events?.created,
null,
result,
"CREATE",
entity
);



this.audit(
"CREATE",
entity,
payload[idField],
null,
result
);



return result;


},







// ============================================================
// FIND BY ID
// ============================================================


findById(entityOrId,idOrOptions={},options={}){


this._requireAdapter();



let entity;
let id;
let opts;



if(this.entity){


entity=this.entity;

id=entityOrId;

opts=idOrOptions || {};


}
else{


entity=entityOrId;

id=idOrOptions;

opts=options || {};


}



const result =
this._adapter.find(
entity,
id
);



if(!result){

return null;

}



const meta =
EntityRegistry.get(entity);



if(
meta.softDelete!==false
&&
opts.includeDeleted!==true
&&
this.isDeleted(result)
){

return null;

}



return result;


},







// ============================================================
// FIND ALL
// ============================================================


findAll(filters={},options={}){


this._requireAdapter();



let rows;



if(!this.entity){

throw new Error(
"findAll requires repository entity"
);

}



rows =
this._adapter.query(
this.entity,
filters
)
||
[];




const meta =
this.getMeta();



if(
meta.softDelete!==false
&&
options.includeDeleted!==true
){

rows =
rows.filter(
x=>!this.isDeleted(x)
);

}



return rows;


},







findWhere(criteria={}){


return this.findAll(criteria);


},







// ============================================================
// UPDATE
// ============================================================


update(entityOrId,idOrData={},data={}){


this._requireAdapter();



let entity;
let id;
let payload;



// instance
// repo.update(id,data)

if(this.entity){


entity=this.entity;

id=entityOrId;

payload=idOrData || {};


}


// static
// BaseRepository.update(entity,id,data)

else{


entity=entityOrId;

id=idOrData;

payload=data || {};


}




const old =
this.findById(
entity,
id,
{
includeDeleted:true
}
);



if(!old){


throw new Error(
entity+
" not found "+
id
);

}



payload={
...payload
};



const meta =
EntityRegistry.get(entity);



this.applySystemFields(
meta,
payload,
true
);



const result =
this._adapter.update(
entity,
id,
payload
);



this.emit(
meta.events?.updated,
old,
result,
"UPDATE",
entity
);



this.audit(
"UPDATE",
entity,
id,
old,
result
);



return result;


},







// ============================================================
// DELETE
// ============================================================


delete(entityOrId,id=null){


this._requireAdapter();



let entity;
let key;



if(this.entity){


entity=this.entity;

key=entityOrId;


}
else{


entity=entityOrId;

key=id;


}




const meta =
EntityRegistry.get(entity);



if(meta.softDelete!==false){


return this.update(
entity,
key,
{

Deleted:true,

DeletedAt:
new Date().toISOString()

}

);


}



return this._adapter.delete(
entity,
key
);


},







// ============================================================
// RESTORE
// ============================================================


restore(entityOrId,id=null){



let entity;
let key;



if(this.entity){

entity=this.entity;
key=entityOrId;

}
else{

entity=entityOrId;
key=id;

}




return this.update(
entity,
key,
{

Deleted:false,

DeletedAt:null

}

);


},







// ============================================================
// QUERY
// ============================================================


exists(id){


return !!this.findById(id);


},




existsBy(field,value){


return this.findAll({

[field]:value

}).length>0;


},




count(filters={}){


return this.findAll(filters).length;


},







// ============================================================
// LEGACY API
// ============================================================


getById(entityOrId,idOrOptions={},options={}){


return this.findById(
entityOrId,
idOrOptions,
options
);


},





getAll(filters={},options={}){


return this.findAll(
filters,
options
);


},







save(data){



const meta=this.getMeta();


const idField=meta.idField;



if(data[idField]){


return this.update(
data[idField],
data
);


}



return this.create(data);


},







// ============================================================
// BULK
// ============================================================


bulkCreate(list=[]){


return list.map(
x=>this.create(x)
);


},



bulkUpdate(ids,data){


return ids.map(
id=>this.update(id,data)
);


},







// ============================================================
// SYSTEM
// ============================================================


applySystemFields(meta,data,update){



const now =
new Date().toISOString();



if(meta.timestamps!==false){



if(!update){

data.CreatedAt =
data.CreatedAt ||
now;


}



data.UpdatedAt =
now;


}




if(
typeof OrganizationContext!=="undefined"
&&
meta.organization!==false
&&
!data.OrganizationID
){

data.OrganizationID =
OrganizationContext.get();

}



return data;


},







isDeleted(row){


return (

row.Deleted===true

||

row.Deleted==="true"

||

row.Deleted===1

);


},







// ============================================================
// EVENTS
// ============================================================


emit(event,before,after,action,entity=null){



if(
!event
||
typeof EventBus==="undefined"
||
!EventBus.emit
){

return;

}



EventBus.emit(
event,
{


entity:
entity || this.entity,


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







// ============================================================
// AUDIT
// ============================================================


audit(action,entity,id,before,after){



if(
typeof AuditLog==="undefined"
||
!AuditLog.write
){

return;

}



AuditLog.write({

action,

entity,

entityId:id,

before,

after,

timestamp:
new Date().toISOString()

});


},







// ============================================================
// TRANSACTION
// ============================================================


transaction(callback){


if(
typeof LockService!=="undefined"
){

const lock =
LockService.getScriptLock();



lock.waitLock(10000);



try{


return callback();


}
finally{


lock.releaseLock();


}



}



return callback();


},







// ============================================================
// HEALTH
// ============================================================


health(){


return HealthContract.create(

"BaseRepository",

this._initialized
?
"OK"
:
"WARNING",

{


version:this.version,


entity:this.entity,


database:!!this._adapter


}


);


},







diagnostics(){


return{


version:this.version,


entity:this.entity,


initialized:this._initialized,


adapter:
!!this._adapter


};


}



};







globalThis.BaseRepository =
BaseRepository;



Logger.log(
"BaseRepository GLOBAL READY v"+
BaseRepository.version
);