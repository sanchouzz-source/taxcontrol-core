// ============================================================
// RepositoryFactory v3.1.0
// Enterprise Repository Factory + Audit
// TaxControl ERP Core
//
// Architecture:
//
// EntityService
//       |
// RepositoryFactory
//       |
// RepositoryRegistry
//       |
// Repository
//       |
// BaseRepository
//
// Compatible:
// EntityRegistry v2.5+
// BaseRepository v5.7+
// RepositoryRegistry v1.1+
// ============================================================


console.log("RepositoryFactory v3.1.0");


const RepositoryFactory = {


version:"3.1.0",


initialized:false,


repositories:{},


auditLog:[],



// ============================================================
// INIT
// ============================================================

init(){


if(this.initialized){

return true;

}


Logger.log(
"RepositoryFactory INIT v"+
this.version
);


this.initialized=true;


return true;

},



// ============================================================
// REGISTER
// ============================================================

register(entity,repository,options={}){


const key =
this.resolveEntity(entity);



if(!repository){

throw new Error(
"Repository missing for "+key
);

}



if(
this.repositories[key]
&&
!options.force
){

Logger.warn(
"Repository already registered "+key
);

return this.repositories[key];

}



this.repositories[key]=repository;



this.auditLog.push({

entity:key,

repository:
repository.constructor?.name ||
"object",

time:new Date().toISOString()

});





if(
typeof RepositoryRegistry!=="undefined"
&&
RepositoryRegistry.register
){

RepositoryRegistry.register(
key,
repository
);

}




Logger.log(
"RepositoryFactory REGISTER "+key
);



return repository;

},




// ============================================================
// AUTO REGISTER LOADED
// ============================================================

registerLoaded(entity,repository){


return this.register(
entity,
repository,
{
force:true
}
);


},




// ============================================================
// GET
// ============================================================

get(entity){


const key =
this.resolveEntity(entity);



if(
this.repositories[key]
){

return this.repositories[key];

}




if(
typeof BaseRepository==="undefined"
){

throw new Error(
"BaseRepository unavailable"
);

}




const repo =
BaseRepository.createRepository(
key
);



this.register(
key,
repo
);



return repo;


},




// ============================================================
// RESOLVE
// ============================================================

resolveEntity(entity){


if(
typeof EntityRegistry!=="undefined"
&&
EntityRegistry.resolve
){

return EntityRegistry.resolve(entity);

}



return String(entity)
.toUpperCase();

},




// ============================================================
// AUDIT
// ============================================================

audit(){


const result=[];


const entities =
typeof EntityRegistry!=="undefined"
?
EntityRegistry.list()
:
[];



entities.forEach(entity=>{


const repo =
this.repositories[entity];



const meta =
EntityRegistry.get(entity);



result.push({


entity,


repository:
repo
?
"FOUND"
:
"MISSING",


table:
meta?.table || null,


methods:
repo
?
this.checkMethods(repo)
:
[]



});



});



return result;

},




checkMethods(repo){


const required=[

"create",

"findById",

"findAll",

"update",

"delete"

];


return required.filter(
m=>
typeof repo[m]!=="function"
);


},




// ============================================================
// LIST
// ============================================================

list(){

return Object.keys(
this.repositories
);

},




has(entity){

return !!this.repositories[
this.resolveEntity(entity)
];

},




// ============================================================
// RESET
// ============================================================

reset(){

this.repositories={};

this.auditLog=[];

this.initialized=false;


},




// ============================================================
// HEALTH
// ============================================================

health(){


const audit =
this.audit();



const errors =
audit.filter(
x=>
x.repository==="MISSING"
||
x.methods.length
);



return HealthContract.create(

"RepositoryFactory",

errors.length
?
"WARNING"
:
"OK",

{


version:this.version,


repositories:this.list(),


count:this.list().length,


audit:errors


}

);


},




diagnostics(){


return {


module:"RepositoryFactory",

version:this.version,

initialized:this.initialized,

repositories:this.list(),

audit:this.audit()


};


}



};




globalThis.RepositoryFactory =
RepositoryFactory;



RepositoryFactory.init();



Logger.log(
"RepositoryFactory GLOBAL READY v"+
RepositoryFactory.version
);