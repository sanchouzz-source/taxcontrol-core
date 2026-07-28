// ============================================================
// VersionRepository v1.2.0
// Enterprise System Repository
// TaxControl ERP Core
//
// System Repository for Version History
//
// Rules:
// - Append Only
// - Immutable records
// - No update
// - No delete
// - Full audit history
//
// Architecture:
//
// SchemaManager
//      |
//      v
// SchemaSnapshot
//      |
//      v
// VersionRepository
//      |
//      v
// BaseRepository
//      |
//      v
// Database
//
//
// Compatible:
// EntityMetadata v3+
// EntityRegistry v2.5+
// SchemaRegistry v4+
// SchemaManager v4.2+
// BaseRepository v5.7+
// RepositoryFactory v3.1+
// RepositoryRegistry v1.1+
// ============================================================


console.log(
"VersionRepository v1.2.0"
);



const VersionRepository = {


// ============================================================
// META
// ============================================================


version:"1.2.0",

entity:"VERSION",

table:"Versions",


architecture:
"Append-Only Version Repository",


initialized:false,


registered:false,







// ============================================================
// INIT
// ============================================================


init(){


if(this.initialized){

return true;

}



Logger.log(
"VersionRepository INIT v"+
this.version
);



this.register();



this.initialized=true;



Logger.log(
"VersionRepository READY v"+
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
"VersionRepository: RepositoryFactory unavailable"
);


return false;

}




// Проверяем metadata

if(
typeof EntityRegistry!=="undefined"
&&
EntityRegistry.has
&&
!EntityRegistry.has(
this.entity
)
){


Logger.warn(
"VersionRepository metadata not ready, deferred"
);


return false;

}






RepositoryFactory.register(

this.entity,

this,

{
force:true
}

);






if(
typeof RepositoryRegistry!=="undefined"
&&
RepositoryRegistry.register
){


RepositoryRegistry.register(

this.entity,

this

);


}




this.registered=true;



Logger.log(
"VersionRepository REGISTERED"
);



return true;


}
catch(e){


Logger.warn(
"VersionRepository register deferred "+
e.message
);


return false;


}


},







// ============================================================
// BASE CHECK
// ============================================================


requireBase(){


if(
typeof BaseRepository==="undefined"
){

throw new Error(
"VersionRepository requires BaseRepository"
);

}


},







// ============================================================
// CREATE
// ============================================================


create(data={},options={}){


this.requireBase();


this.requireObject(
data,
"create"
);



return BaseRepository.create(

this.entity,

data,

{

...options,

skipVersioning:true

}

);


},







// ============================================================
// READ
// ============================================================


findById(id,options={}){


this.requireBase();


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






get(id,options={}){


return this.findById(
id,
options
);


},







findAll(filters={},options={}){


this.requireBase();



return BaseRepository.findAll(

this.entity,

filters,

{

...options,

includeDeleted:true

}

);


},







findWhere(field,value,options={}){


this.requireBase();


this.requireField(
field,
"findWhere"
);



if(
typeof BaseRepository.findWhere==="function"
){


return BaseRepository.findWhere(

this.entity,

field,

value,

{

...options,

includeDeleted:true

}

);


}



return this.findAll(

{

[field]:value

},

options

);


},







// ============================================================
// VERSION SEARCH
// ============================================================


findByEntity(
entity,
entityId,
options={}
){


if(!entity){

throw new Error(
"VersionRepository entity required"
);

}



this.requireId(
entityId,
"findByEntity"
);



return this.findAll(

{

Entity:entity,

EntityID:entityId

},

options

);


},







findLatest(
entity,
entityId,
options={}
){


const rows =
this.findByEntity(

entity,

entityId,

options

);



if(!rows.length){

return null;

}



return rows.sort(

(a,b)=>{

return Number(
b.Version||0
)
-
Number(
a.Version||0
);

}

)[0];


},







findByHash(hash){


return this.findWhere(

"Hash",

hash

);


},







// ============================================================
// COMMON
// ============================================================


count(filters={},options={}){


this.requireBase();



return BaseRepository.count(

this.entity,

filters,

{

...options,

includeDeleted:true

}

);


},






exists(id,options={}){


this.requireBase();



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
page,
limit,
filters={},
options={}
){


this.requireBase();



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

"VersionRepository.update forbidden: immutable history"

);


},




delete(){


throw new Error(

"VersionRepository.delete forbidden: immutable history"

);


},




restore(){


throw new Error(

"VersionRepository.restore forbidden"

);


},







// ============================================================
// META
// ============================================================


getMeta(){



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


idField:"VersionID",


softDelete:false


};


},







// ============================================================
// VALIDATION
// ============================================================


requireId(id,name){


if(
id===undefined ||
id===null ||
id===""
){


throw new Error(

"VersionRepository."
+
name+
": id required"

);


}


},






requireObject(obj,name){


if(
!obj ||
typeof obj!=="object"
){

throw new Error(

"VersionRepository."
+
name+
": object required"

);

}


},






requireField(field,name){


if(!field){


throw new Error(

"VersionRepository."
+
name+
": field required"

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
"VersionRepository",


version:
this.version,


entity:
this.entity,


table:
this.table,


immutable:true,


appendOnly:true,


initialized:
this.initialized,


registered:
this.registered,



factory:

typeof RepositoryFactory!=="undefined"
&&
RepositoryFactory.has
?
RepositoryFactory.has(
this.entity
)
:
false,



registry:

typeof RepositoryRegistry!=="undefined",



metadata:
!!meta,



baseRepository:
typeof BaseRepository!=="undefined",



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

data.baseRepository
&&
data.metadata

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

"VersionRepository",

status,

data

);


}



return {

module:
"VersionRepository",

status,

...data

};


}



};







// ============================================================
// GLOBAL
// ============================================================


globalThis.VersionRepository =
VersionRepository;







// ============================================================
// SAFE START
// ============================================================


try{


VersionRepository.init();


}
catch(e){


Logger.warn(

"VersionRepository deferred: "+
e.message

);


}







Logger.log(

"VersionRepository GLOBAL READY v"+
VersionRepository.version

);