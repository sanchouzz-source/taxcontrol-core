// ============================================================
// RepositoryRegistry v2.1.0
// Enterprise Repository Registry
// TaxControl ERP Core
//
// Dynamic Repository Registration
//
// Compatible:
//
// RepositoryFactory v3+
// EntityRegistry v2.6+
// SchemaManager v4.2+
// BaseRepository v5.7+
//
// ============================================================


console.log(
"RepositoryRegistry v2.1.0"
);



const RepositoryRegistry = {


// ============================================================
// META
// ============================================================


version:"2.1.0",

ready:false,

repositories:{},



aliases:{


CLIENT:"CLIENT",

Clients:"CLIENT",

Client:"CLIENT",



TRIP:"TRIP",

Trip:"TRIP",



VEHICLE:"VEHICLE",

Vehicle:"VEHICLE",



DRIVER:"DRIVER",

Driver:"DRIVER",



CARRIER:"CARRIER",

Carrier:"CARRIER",



ROUTE:"ROUTE",

Route:"ROUTE",



CARGO:"CARGO",

Cargo:"CARGO"


},







// ============================================================
// INIT
// ============================================================


init(){


if(this.ready){

return true;

}



Logger.log(
"RepositoryRegistry INIT v"+
this.version
);





this.ready=true;



this.syncFactory();



this.publish();



Logger.log(

"RepositoryRegistry READY count="+
this.count()

);



return true;


},







// ============================================================
// NORMALIZE
// ============================================================


normalize(entity){


if(!entity){

throw new Error(
"RepositoryRegistry entity required"
);

}



const key =
String(entity)
.trim();



return (

this.aliases[key]
||
this.aliases[key.toUpperCase()]
||
key.toUpperCase()

);


},







// ============================================================
// REGISTER
// ============================================================


register(
entity,
repository,
options={}
){


const key =
this.normalize(entity);




if(!repository){

throw new Error(

"RepositoryRegistry repository missing "+
key

);

}





if(
this.repositories[key]
&&
!options.force
){


return this.repositories[key];


}




this.repositories[key]=repository;



Logger.debug(

"RepositoryRegistry REGISTER "+
key

);





this.syncFactoryEntity(
key,
repository
);



return repository;


},







// ============================================================
// LATE LOAD SUPPORT
// ============================================================


notifyLoaded(
entity,
repository
){


return this.register(

entity,

repository,

{
force:true
}

);


},




registerLoaded(
entity,
repository
){


return this.notifyLoaded(
entity,
repository
);


},







// ============================================================
// GET
// ============================================================


get(entity){


const key =
this.normalize(entity);



const repo =
this.repositories[key];



if(!repo){


throw new Error(

"RepositoryRegistry repository not found "+
key

);


}



return repo;


},






getRepository(entity){


return this.get(entity);


},







// ============================================================
// CHECK
// ============================================================


has(entity){


try{


const key =
this.normalize(entity);


return !!this.repositories[key];


}
catch(e){

return false;

}


},







list(){


return Object.keys(
this.repositories
);


},







count(){


return this.list().length;


},







// ============================================================
// FACTORY SYNC
// ============================================================


syncFactoryEntity(
entity,
repository
){


try{


if(
typeof RepositoryFactory==="undefined"
){

return false;

}




if(
typeof RepositoryFactory.register==="function"
){


RepositoryFactory.register(

entity,

repository,

{
force:true
}

);


return true;


}



}
catch(e){


Logger.warn(

"Factory sync failed "+
entity+
" "+
e.message

);


}



return false;


},







syncFactory(){


this.list()
.forEach(entity=>{


this.syncFactoryEntity(

entity,

this.repositories[entity]

);


});



},







// ============================================================
// CORE REGISTRY
// ============================================================


publish(){


try{


if(
typeof CoreRegistry!=="undefined"
&&
CoreRegistry.register
){


CoreRegistry.register(

"Repositories",

this.repositories

);


}



}
catch(e){


Logger.warn(
"RepositoryRegistry publish skipped "+
e.message
);


}



},







// ============================================================
// HEALTH
// ============================================================


getHealthReport(){


return this.list()
.map(entity=>{


const repo =
this.repositories[entity];



return {


entity,


version:
repo.version || "-",



table:
repo.table || "-",



health:

typeof repo.health==="function"

?

repo.health()

:

null


};


});


},







health(){



const data={


version:this.version,


ready:this.ready,


count:this.count(),


repositories:this.list()


};



const status =
this.ready
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

"RepositoryRegistry",

status,

data

);


}




return {


module:"RepositoryRegistry",

status,

...data

};


}



};








// ============================================================
// GLOBAL
// ============================================================


globalThis.RepositoryRegistry =
RepositoryRegistry;








// ============================================================
// SAFE BOOT
// ============================================================


try{


RepositoryRegistry.init();



}
catch(e){


Logger.warn(

"RepositoryRegistry deferred "+
e.message

);


}







Logger.log(

"RepositoryRegistry GLOBAL READY v"+
RepositoryRegistry.version

);