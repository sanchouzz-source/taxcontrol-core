// ============================================================
// RepositoryFactory v3.0.0
// Enterprise Repository Factory
// TaxControl ERP Core
//
// Architecture:
//
// EntityService
//      |
//      v
// RepositoryFactory
//      |
//      v
// BaseRepository
//      |
//      v
// Database
//
// Compatible:
// EntityRegistry v2.5+
// BaseRepository v5.7+
// RepositoryRegistry v1.1+
// ============================================================


console.log("RepositoryFactory v3.0.0");



const RepositoryFactory = {


version:"3.0.0",


initialized:false,


repositories:{},




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


if(!entity){

throw new Error(
"RepositoryFactory register entity missing"
);

}



const key =
this.resolveEntity(entity);



if(
this.repositories[key]
&&
!options.force
){

return this.repositories[key];

}



this.repositories[key]=repository;



Logger.log(

"RepositoryFactory REGISTER "+
key

);



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



return repository;


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




// автоматическое создание

if(
typeof BaseRepository==="undefined"
){

throw new Error(
"BaseRepository unavailable"
);

}



const repository =
BaseRepository.createRepository(
key
);



this.register(
key,
repository
);



return repository;


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
// REGISTER ALL LOADED
// LEGACY REMOVED
// ============================================================


registerLoaded(entity,repository){


Logger.warn(

"registerLoaded deprecated. Use register()"

);


return this.register(
entity,
repository
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






// ============================================================
// HAS
// ============================================================


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


this.initialized=false;


Logger.log(
"RepositoryFactory RESET"
);


},






// ============================================================
// HEALTH
// ============================================================


health(){


return HealthContract.create(

"RepositoryFactory",

this.initialized
?
"OK"
:
"WARNING",

{


version:this.version,


count:this.list().length,


repositories:this.list()


}


);


},






// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){


return {


module:
"RepositoryFactory",


version:
this.version,


initialized:
this.initialized,


repositories:
this.list(),


count:
this.list().length


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