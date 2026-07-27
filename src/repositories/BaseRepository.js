// ============================================================
// BaseRepository v5.7.0
// Enterprise Repository Base
// TaxControl ERP Core
//
// Compatible:
// Database v4.2+
// EntityRegistry v2.3+
// RepositoryFactory v2.7+
// EntityService v5+
// ============================================================


console.log("BaseRepository v5.7.0");



const BaseRepository = {


version:"5.7.0",


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
// FACTORY CREATE
// ============================================================


createRepository(entity){


const repo =
Object.create(this);


repo.entity=entity;


repo._initialized=false;


repo.init();


return repo;


},







// ============================================================
// META
// ============================================================


getMeta(){


if(!this.entity){

throw new Error(
"Repository entity not defined"
);

}



return EntityRegistry.get(
this.entity
);


},







// ============================================================
// CREATE
// ============================================================


create(data={},options={}){


const meta=this.getMeta();



const idField =
meta.idField ||
"ID";



const payload={
...data
};




if(!payload[idField]){


payload[idField]=
IdService.generate(
this.entity
);


}




this.applySystemFields(
meta,
payload,
false
);





if(
options.validate!==false
&&
EntityValidator?.validate
){

EntityValidator.validate(
this.entity,
payload
);

}





const result =
Database.insert(
this.entity,
payload
);



this.emit(
meta.events?.created,
null,
result,
"CREATE"
);



this.audit(
"CREATE",
payload[idField],
null,
result
);



return result;


},







// ============================================================
// FIND
// ============================================================


findById(id,options={}){


const result =
Database.find(
this.entity,
id
);



if(!result){

return null;

}



const meta=this.getMeta();



if(
meta.softDelete!==false
&&
options.includeDeleted!==true
){

if(
this.isDeleted(result)
){

return null;

}

}



return result;


},







findAll(filters={},options={}){


let rows =
Database.query(
this.entity,
filters
);



const meta=this.getMeta();



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


update(id,data={}){


const old =
this.findById(
id,
{
includeDeleted:true
}
);



if(!old){

throw new Error(
this.entity+
" not found "+
id
);

}




const payload={
...data
};



this.applySystemFields(
this.getMeta(),
payload,
true
);





const result =
Database.update(
this.entity,
id,
payload
);



this.emit(
this.getMeta().events?.updated,
old,
result,
"UPDATE"
);



return result;


},







// ============================================================
// DELETE
// ============================================================


delete(id){


const meta=this.getMeta();



if(
meta.softDelete!==false
){


return this.update(
id,
{

Deleted:true,

DeletedAt:
new Date().toISOString()

}

);

}



return Database.delete(
this.entity,
id
);


},







restore(id){


return this.update(
id,
{

Deleted:false,

DeletedAt:null

}

);


},







// ============================================================
// EXISTS
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
// LEGACY COMPATIBILITY
// ============================================================


getById(id,options={}){


return this.findById(
id,
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


const idField=
meta.idField;



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
// SYSTEM FIELDS
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


data.UpdatedAt=now;


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







// ============================================================
// DELETE CHECK
// ============================================================


isDeleted(row){


return row.Deleted===true
||
row.Deleted==="true"
||
row.Deleted==1;


},







// ============================================================
// EVENTS
// ============================================================


emit(event,before,after,action){


if(
!event ||
!EventBus?.emit
){

return;

}



EventBus.emit(

event,

{

entity:this.entity,

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


audit(action,id,before,after){


if(
AuditLog?.write
){


AuditLog.write({

action,

entity:this.entity,

entityId:id,

before,

after,

timestamp:
new Date().toISOString()

});


}


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

database:
!!this._adapter


}


);


},







diagnostics(){


return {


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