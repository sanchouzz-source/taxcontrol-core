// ============================================================
// VersionRepository v1.1.0
// TaxControl ERP Core
//
// System Repository for Version History
//
// Architecture:
//
// Versioning
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
// Rules:
// - Append Only
// - Immutable records
// - No update
// - No delete
//
// Compatible:
// BaseRepository v5.7+
// RepositoryFactory v3+
// RepositoryRegistry v1.1+
// EntityRegistry v2.5+
// SchemaRegistry v4+
// ============================================================


console.log(
"VersionRepository v1.1.0"
);



const VersionRepository = {



version:"1.1.0",


entity:"VERSION",


table:"Versions",


architecture:
"Append-Only Version Repository",


initialized:false,





// ============================================================
// INIT
// ============================================================


init(){


if(this.initialized){

return true;

}



Logger.log(
"VersionRepository INIT"
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
// SAFE REGISTER
// ============================================================


register(){


try{


if(
typeof RepositoryFactory==="undefined"
){

Logger.warn(
"RepositoryFactory unavailable"
);

return false;

}




// ждём EntityRegistry

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
"VersionRepository waiting ENTITY metadata"
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
// CREATE
// ============================================================


create(data={},options={}){


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


this.requireObject(
filters,
"findAll"
);



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







// ============================================================
// COMMON
// ============================================================


count(filters={},options={}){


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
// IMMUTABLE BLOCK
// ============================================================


update(){


throw new Error(

"VersionRepository.update forbidden. Records immutable"

);


},



delete(){


throw new Error(

"VersionRepository.delete forbidden. Records immutable"

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

"VersionRepository."+name+
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

"VersionRepository."+name+
": object required"

);


}


},



requireField(field,name){


if(!field){


throw new Error(

"VersionRepository."+name+
": field required"

);


}


},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){


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


registered:
typeof RepositoryFactory!=="undefined"
&&
RepositoryFactory.has
?
RepositoryFactory.has(
this.entity
)
:false,


baseRepository:
typeof BaseRepository!=="undefined",


metadata:
this.getMeta(),


timestamp:
new Date().toISOString()


};


},







// ============================================================
// HEALTH
// ============================================================


health(){


const d =
this.diagnostics();



const status =
d.baseRepository &&
d.metadata
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

d

);


}



return {

module:"VersionRepository",

status,

...d

};


}



};









// ============================================================
// GLOBAL
// ============================================================


globalThis.VersionRepository =
VersionRepository;







// ============================================================
// AUTO INIT SAFE
// ============================================================


try{


VersionRepository.init();


}
catch(e){


Logger.warn(

"VersionRepository init deferred "+
e.message

);


}







Logger.log(

"VersionRepository GLOBAL READY v"+
VersionRepository.version

);