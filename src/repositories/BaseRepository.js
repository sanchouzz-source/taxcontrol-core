// ============================================================
// BaseRepository v5.6.0
// Enterprise Repository Base
// TaxControl ERP Core
//
// Architecture:
//
// EntityService
//       |
// RepositoryFactory
//       |
// BaseRepository
//       |
// Database
//       |
// SpreadsheetAdapter
//
// Responsibilities:
// - CRUD
// - Soft Delete
// - Restore
// - Validation hooks
// - Audit hooks
// - EventBus integration
// - Versioning hooks
// - Organization scope
// - Pagination
// - Bulk operations
// - Diagnostics
// ============================================================


console.log("BaseRepository v5.6.0");



const BaseRepository = {


version:"5.6.0",

architecture:
"Repository -> Database -> SpreadsheetAdapter",


_initialized:false,

_adapter:null,


// ============================================================
// INIT
// ============================================================


init(database){


if(this._initialized){

Logger.debug(
"BaseRepository already initialized"
);

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
"BaseRepository: Database unavailable"
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


_require(){


if(!this._initialized){

this.init();

}



return this._adapter;


},







// ============================================================
// METADATA
// ============================================================


getMeta(entity){


if(
typeof EntityRegistry!=="undefined"
&&
EntityRegistry.get
){

return EntityRegistry.get(entity);

}



if(
typeof SchemaRegistry!=="undefined"
&&
SchemaRegistry.get
){

return SchemaRegistry.get(entity);

}



throw new Error(
"Metadata missing "+entity
);


},







// ============================================================
// CREATE
// ============================================================


create(entity,data={},options={}){


this._require();


const meta =
this.getMeta(entity);



let payload={
...data
};



// ID

const idField =
meta.idField ||
entity+"ID";



if(!payload[idField]){


if(
typeof IdService==="undefined"
){

throw new Error(
"IdService unavailable"
);

}


payload[idField]=
IdService.generate(entity);


}




this.applySystemFields(
meta,
payload,
false
);





if(
options.validate!==false
&&
typeof EntityValidator!=="undefined"
&&
EntityValidator.validate
){

EntityValidator.validate(
entity,
payload
);

}




const result =
this._adapter.insert(
entity,
payload
);



this.afterCreate(
entity,
result
);



this.emit(
entity,
meta.events?.created,
null,
result,
"CREATE"
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


findById(entity,id,options={}){


this._require();



const record =
this._adapter.find(
entity,
id
);



if(!record){

return null;

}



const meta =
this.getMeta(entity);



if(
meta.softDelete!==false
&&
options.includeDeleted!==true
){

if(
this.isDeleted(record,meta)
){

return null;

}

}



return record;


},







// ============================================================
// FIND ALL
// ============================================================


findAll(entity,filters={},options={}){


this._require();



let rows =
this._adapter.query(
entity,
filters
);



if(!Array.isArray(rows)){

rows=[];

}



const meta =
this.getMeta(entity);



if(
meta.softDelete!==false
&&
options.includeDeleted!==true
){

rows =
rows.filter(
r=>!this.isDeleted(r,meta)
);

}



return rows;


},







// ============================================================
// FIND WHERE
// ============================================================


findWhere(entity,field,value){


return this.findAll(
entity,
{
[field]:value
}
);


},







// ============================================================
// EXISTS
// ============================================================


exists(entity,id){


return !!this.findById(
entity,
id
);


},







// ============================================================
// COUNT
// ============================================================


count(entity,filters={}){


return this.findAll(
entity,
filters
).length;


},







// ============================================================
// UPDATE
// ============================================================


update(entity,id,data={},options={}){


this._require();



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



let payload={
...data
};



this.applySystemFields(
this.getMeta(entity),
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
entity,
this.getMeta(entity)
.events?.updated,
old,
result,
"UPDATE"
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


delete(entity,id){


const meta =
this.getMeta(entity);



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
" not found"
);

}



let result;



if(meta.softDelete===false){


result =
this._adapter.delete(
entity,
id
);



}
else{


result =
this._adapter.update(
entity,
id,
{

Deleted:true,

DeletedAt:
new Date().toISOString()

}

);


}



this.emit(
entity,
meta.events?.deleted,
old,
result,
"DELETE"
);



return result;


},







// ============================================================
// RESTORE
// ============================================================


restore(entity,id){


const meta =
this.getMeta(entity);



if(meta.softDelete===false){

throw new Error(
"Restore unavailable "+entity
);

}



return this._adapter.update(
entity,
id,
{

Deleted:false,

DeletedAt:null

}

);


},







// ============================================================
// PAGINATION
// ============================================================


paginate(
entity,
page=1,
limit=50,
filters={}
){


const rows =
this.findAll(
entity,
filters
);



const start =
(page-1)*limit;



return {


data:
rows.slice(
start,
start+limit
),


page,

limit,


total:
rows.length


};


},







// ============================================================
// BULK
// ============================================================


bulkCreate(entity,list=[]){


return list.map(
x=>
this.create(
entity,
x
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
!data.OrganizationID
&&
meta.organization!==false
){

data.OrganizationID =
OrganizationContext.get();

}



return data;


},







// ============================================================
// SOFT DELETE
// ============================================================


isDeleted(record,meta){


const field =
meta.deleteField ||
"Deleted";


return record[field]===true
||
record[field]=="true"
||
record[field]==1;


},







// ============================================================
// EVENTS
// ============================================================


emit(entity,event,before,after,action){


if(
!event
||
typeof EventBus==="undefined"
){

return;

}



EventBus.emit(
event,
{

entity,

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


audit(
action,
entity,
id,
before,
after
){


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







afterCreate(){},







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


database:
!!this._adapter,


features:[

"CRUD",

"SoftDelete",

"Restore",

"Audit",

"Events",

"Validation",

"Bulk",

"Pagination"

]


}

);


},







diagnostics(){


return {


version:this.version,


initialized:this._initialized,


adapter:
this._adapter
?
"Database"
:
null,


timestamp:
new Date().toISOString()


};


}



};






globalThis.BaseRepository =
BaseRepository;



Logger.log(
"BaseRepository GLOBAL READY v"+
BaseRepository.version
);