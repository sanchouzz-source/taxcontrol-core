// ============================================================
// AuditRepository v1.1.0
// Enterprise System Repository
// TaxControl ERP Core
//
// System repository for audit history.
//
// Rules:
//
// - Append Only
// - Immutable records
// - No update
// - No delete
// - No restore
//
// IMPORTANT:
// BaseRepository.create() NOT USED
// to prevent AuditLog recursion.
//
// Architecture:
//
// AuditLog
//      |
//      v
// AuditRepository
//      |
//      v
// Database Adapter
//
// Compatible:
//
// EntityMetadata v3+
// EntityRegistry v2.5+
// SchemaRegistry v4+
// BaseRepository v5.7+
// RepositoryFactory v3.1+
// RepositoryRegistry v1.1+
// ============================================================


console.log(
"AuditRepository v1.1.0"
);





const AuditRepository = {


// ============================================================
// META
// ============================================================


version:"1.1.0",

entity:"AUDIT",

table:"AuditLog",


architecture:
"Append-Only System Repository",


initialized:false,

registered:false,








// ============================================================
// INIT
// ============================================================


init(){


if(this.initialized){

return true;

}



this.register();


this.initialized=true;



Logger.log(
"AuditRepository INIT READY v"+
this.version
);



return true;


},







// ============================================================
// REGISTER
// ============================================================


register(){


try{


if(
typeof RepositoryFactory==="undefined"
){

Logger.warn(
"AuditRepository: RepositoryFactory unavailable"
);


return false;

}




if(
typeof RepositoryFactory.register==="function"
){


RepositoryFactory.register(

this.entity,

this,

{
force:true
}

);


}





if(
typeof RepositoryRegistry!=="undefined"
&&
typeof RepositoryRegistry.register==="function"
){


RepositoryRegistry.register(

this.entity,

this

);


}



this.registered=true;



Logger.log(
"AuditRepository REGISTERED"
);



return true;


}
catch(e){


Logger.warn(

"AuditRepository register deferred: "+
e.message

);


return false;


}


},







// ============================================================
// CREATE
// ============================================================


create(
data={},
options={}
){


this.requireObject(
data,
"create"
);



this.requireBase();



const meta =
this.getMeta();



if(
typeof BaseRepository._requireAdapter==="function"
){

BaseRepository._requireAdapter();

}



if(
typeof BaseRepository.checkPermission==="function"
){

BaseRepository.checkPermission(

meta,

"create"

);

}



const payload={

...data

};



const idField =
meta.idField ||
meta.primaryKey ||
"AuditID";





if(
!payload[idField]
){


if(
typeof IdService==="undefined"
||
typeof IdService.generate!=="function"
){

throw new Error(
"AuditRepository: IdService unavailable"
);

}



payload[idField]=
IdService.generate(
this.entity
);


}







if(
options.skipValidation!==true
&&
typeof EntityValidator!=="undefined"
&&
EntityValidator.validate
){


EntityValidator.validate(

this.entity,

payload

);


}






if(
typeof BaseRepository.applySystemFields==="function"
){


BaseRepository.applySystemFields(

meta,

payload,

false

);


}







const adapter =
BaseRepository._adapter;



if(
!adapter
||
typeof adapter.insert!=="function"
){

throw new Error(
"AuditRepository: adapter insert unavailable"
);

}





const result =
adapter.insert(

meta.table,

payload

);






if(!result){

throw new Error(
"AuditRepository create failed"
);

}






// IMPORTANT:
// No AuditLog.write()
// No BaseRepository.audit()
// prevent recursion





return result;


},







// ============================================================
// READ
// ============================================================


findById(
id,
options={}
){


this.requireId(
id,
"findById"
);



return BaseRepository.findById(

this.entity,

id,

{

...options,

includeDeleted:true

}

);


},







get(
id,
options={}
){


return this.findById(
id,
options
);


},







findAll(
filters={},
options={}
){


return BaseRepository.findAll(

this.entity,

filters,

{

...options,

includeDeleted:true

}

);


},







findWhere(
field,
value,
options={}
){


this.requireField(
field,
"findWhere"
);



return BaseRepository.findWhere(

this.entity,

field,

value,

{

...options,

includeDeleted:true

}

);


},







// ============================================================
// AUDIT SEARCH
// ============================================================


findByEntity(
entity,
entityId,
options={}
){


if(!entity){

throw new Error(
"AuditRepository entity required"
);

}



return this.findAll(

{

Entity:entity,

EntityID:entityId

},

options

);


},







findByUser(
userId,
options={}
){


return this.findWhere(

"UserID",

userId,

options

);


},







findByAction(
action,
options={}
){


return this.findWhere(

"Action",

action,

options

);


},







// ============================================================
// COMMON
// ============================================================


count(
filters={},
options={}
){


return BaseRepository.count(

this.entity,

filters,

{

...options,

includeDeleted:true

}

);


},







exists(
id,
options={}
){


return BaseRepository.exists(

this.entity,

id,

{

...options,

includeDeleted:true

}

);


},







paginate(
page=1,
limit=50,
filters={},
options={}
){


return BaseRepository.paginate(

this.entity,

page,

limit,

filters,

{

...options,

includeDeleted:true

}

);


},







// ============================================================
// IMMUTABLE
// ============================================================


update(){

throw new Error(

"AuditRepository.update forbidden: immutable records"

);

},




delete(){

throw new Error(

"AuditRepository.delete forbidden: immutable records"

);

},




restore(){

throw new Error(

"AuditRepository.restore forbidden"

);

},







// ============================================================
// METADATA
// ============================================================


getMeta(){


if(
typeof BaseRepository!=="undefined"
&&
BaseRepository.getMeta
){


return BaseRepository.getMeta(
this.entity
);


}



if(
typeof SchemaRegistry!=="undefined"
&&
SchemaRegistry.get
){


const meta =
SchemaRegistry.get(
this.entity
);



if(meta){

return meta;

}


}




if(
typeof EntityRegistry!=="undefined"
&&
EntityRegistry.get
){


return EntityRegistry.get(
this.entity
);


}




return {


entity:this.entity,


table:this.table,


idField:"AuditID",


softDelete:false


};


},







// ============================================================
// VALIDATION
// ============================================================


requireBase(){


if(
typeof BaseRepository==="undefined"
){

throw new Error(
"AuditRepository requires BaseRepository"
);

}


},







requireId(
id,
method
){


if(
id===undefined ||
id===null ||
id===""
){

throw new Error(

"AuditRepository."+
method+
": id required"

);

}


},







requireField(
field,
method
){


if(!field){

throw new Error(

"AuditRepository."+
method+
": field required"

);

}


},







requireObject(
obj,
method
){


if(
!obj
||
typeof obj!=="object"
||
Array.isArray(obj)
){

throw new Error(

"AuditRepository."+
method+
": object required"

);

}


},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){


let meta=null;


try{

meta=this.getMeta();

}
catch(e){}





return {


module:
"AuditRepository",



version:
this.version,



entity:
this.entity,



table:
meta?.table ||
this.table,



architecture:
this.architecture,



appendOnly:true,


immutable:true,


initialized:
this.initialized,


registered:
this.registered,



layers:{


baseRepository:
typeof BaseRepository!=="undefined",


metadata:
!!meta,


schema:
typeof SchemaRegistry!=="undefined",


factory:
typeof RepositoryFactory!=="undefined",


registry:
typeof RepositoryRegistry!=="undefined"


},



timestamp:
new Date()
.toISOString()


};


},







// ============================================================
// HEALTH
// ============================================================


health(){


const data =
this.diagnostics();



const status =

data.layers.baseRepository
&&
data.layers.metadata

?

"OK"

:

"WARNING";




if(
typeof HealthContract!=="undefined"
&&
HealthContract.create
){


return HealthContract.create(

"AuditRepository",

status,

data

);


}





return {


module:"AuditRepository",

status,

...data


};


}



};









// ============================================================
// GLOBAL
// ============================================================


globalThis.AuditRepository =
AuditRepository;









// ============================================================
// SAFE START
// ============================================================


try{


AuditRepository.init();


}
catch(e){


Logger.warn(

"AuditRepository deferred: "+
e.message

);


}







Logger.log(

"AuditRepository GLOBAL READY v"+
AuditRepository.version

);