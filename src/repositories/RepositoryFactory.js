// ============================================================
// RepositoryFactory v2.8.0
// Enterprise Repository Dependency Container
// TaxControl ERP Core
//
// Architecture:
//
// EntityRegistry
//        |
//        v
// RepositoryFactory
//        |
//        v
// BaseRepository
//        |
//        v
// Database
//
// Compatible:
// EntityRegistry v2.5+
// BaseRepository v5.7+
// EntityService v5+
// SystemInit v2.8+
// ============================================================


console.log("RepositoryFactory v2.8.0");



const RepositoryFactory = {


version:"2.8.0",

apiVersion:"3.0",



repositories:{},

metadata:{},

pending:{},


initialized:false,

initializing:false,


discoveryRuns:0,







// ============================================================
// INIT
// ============================================================


init(){


if(this.initialized){

Logger.debug(
"RepositoryFactory ALREADY READY"
);


return true;

}



if(
typeof EntityRegistry==="undefined"
){

throw new Error(
"RepositoryFactory requires EntityRegistry"
);

}



if(
typeof BaseRepository==="undefined"
){

throw new Error(
"RepositoryFactory requires BaseRepository"
);

}





try{


this.initializing=true;



Logger.log(
"RepositoryFactory INIT v"+
this.version
);





this.loadRegistry();



this.discovery();



this.autoRegister();



this.refreshPending();



this.syncRegistry();





this.initialized=true;



Logger.log(

"RepositoryFactory READY v"+
this.version+
" count="+
this.count()

);



return true;



}

catch(e){


Logger.error(

"RepositoryFactory FAILED "+
e.message

);


throw e;


}

finally{


this.initializing=false;


}



},







// ============================================================
// LOAD EXISTING REGISTRY
// ============================================================


loadRegistry(){


if(
typeof RepositoryRegistry==="undefined"
){

return;

}



try{


RepositoryRegistry.list()

.forEach(entity=>{


const repo =
RepositoryRegistry.get(entity);



if(repo){

this.register(
entity,
repo
);

}


});


}

catch(e){


Logger.warn(
"RepositoryRegistry load failed "+
e.message
);


}



},







// ============================================================
// DISCOVERY CUSTOM REPOSITORIES
// ============================================================


discovery(){



this.discoveryRuns++;



Object.keys(globalThis)

.filter(
name=>
name.endsWith("Repository")
)

.forEach(name=>{


const repo =
globalThis[name];



if(!repo){

return;

}



const entity =
this.resolveEntity(
repo,
name
);



if(entity){

this.register(
entity,
repo
);

}


});



},







// ============================================================
// RESOLVE ENTITY
// ============================================================


resolveEntity(repo,name){



if(
repo.entity
){

return this.normalizeEntity(
repo.entity
);

}





let entity =

name
.replace(
"Repository",
""
)

.replace(
/([a-z])([A-Z])/g,
"$1_$2"
)

.toUpperCase();



return this.normalizeEntity(entity);


},







normalizeEntity(entity){



if(
typeof EntityRegistry!=="undefined"
&&
EntityRegistry.resolve
){


try{


return EntityRegistry.resolve(
entity
);


}

catch(e){}



}



return String(entity)
.toUpperCase();


},







// ============================================================
// AUTO REGISTER ALL ENTITIES
// ============================================================


autoRegister(){



EntityRegistry.list()

.forEach(entity=>{


if(
entity.startsWith("__TEST_")
){

return;

}



if(
this.repositories[entity]
){

return;

}





const meta =
EntityRegistry.get(entity);



if(!meta){

return;

}





let repo;



// 1. ищем готовый

if(
meta.repository
){

repo =
this.resolveRepository(
meta.repository
);

}





// 2. создаём BaseRepository

if(!repo){


repo =
this.createRepository(
entity
);


}





if(repo){


this.register(
entity,
repo
);


}



});



},







// ============================================================
// CREATE BASE REPOSITORY INSTANCE
// ============================================================


createRepository(entity){



if(
BaseRepository.createRepository
){


return BaseRepository.createRepository(
entity
);


}




// fallback


const repo =
Object.create(
BaseRepository
);



repo.entity =
entity;



repo.init();



return repo;


},







// ============================================================
// BUILD REPOSITORY NAME
// ============================================================


buildRepositoryName(entity){



const map={


KPI:
"KPIRepository",


AUDIT:
"AuditRepository",


VERSION:
"VersionRepository",


FINANCIAL_TRANSACTION:
"FinancialTransactionRepository",


CLIENT_FINANCE_PROFILE:
"ClientFinanceProfileRepository",


TRANSPORT_ORDER:
"TransportOrderRepository"


};




if(map[entity]){

return map[entity];

}





return entity

.split("_")

.map(
x=>
x.charAt(0)+
x.slice(1).toLowerCase()
)

.join("")

+"Repository";


},







// ============================================================
// REGISTER
// ============================================================


register(entity,repo,options={}){



if(
!entity ||
!repo
){

return false;

}





entity =
this.normalizeEntity(
entity
);






if(
this.repositories[entity]
&&
!options.force
){

return false;

}







const adapted =
this.applyCompatibility(
repo,
entity
);





this.repositories[entity]=adapted;



this.metadata[entity]={


version:
repo.version ||
"unknown",


type:
repo.repositoryType ||
"BASE",


registered:
new Date()
.toISOString(),


contract:
this.validate(adapted)


};






Logger.log(

"Repository REGISTER "+
entity+
" ["+
this.metadata[entity].type+
"]"

);



return true;


},







// ============================================================
// COMPATIBILITY
// ============================================================


applyCompatibility(repo,entity){



repo.entity =
repo.entity ||
entity;





if(
!repo.getById &&
repo.findById
){


repo.getById =
repo.findById.bind(repo);

}





if(
!repo.getAll &&
repo.findAll
){


repo.getAll =
repo.findAll.bind(repo);

}






if(
!repo.save
){



repo.save=function(data){



const meta =
EntityRegistry.get(
entity
);



const idField =
meta.idField;



if(
data &&
data[idField]
){


return repo.update(
data[idField],
data
);


}



return repo.create(data);



};



}





return repo;


},







// ============================================================
// VALIDATE
// ============================================================


validate(repo){



const required=[


"create",

"findById",

"findAll",

"update",

"delete",

"restore",

"exists"


];





return{


status:

required.every(
x=>
typeof repo[x]==="function"
)

?

"OK"

:

"WARNING",



missing:

required.filter(
x=>
typeof repo[x]!=="function"
)


};



},







// ============================================================
// RESOLVE REPOSITORY
// ============================================================


resolveRepository(name){



if(
globalThis[name]
){

return globalThis[name];

}





const key =
Object.keys(globalThis)

.find(

x=>
x.toUpperCase()
===
name.toUpperCase()

);





return key
?
globalThis[key]
:
null;


},







// ============================================================
// ACCESS
// ============================================================


get(entity){



entity =
this.normalizeEntity(
entity
);



if(
!this.repositories[entity]
){


this.autoRegister();


}





const repo =
this.repositories[entity];





if(!repo){

throw new Error(

"Repository not found "+
entity

);

}



return repo;


},







has(entity){


return !!this.repositories[
this.normalizeEntity(entity)
];


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
// SYNC
// ============================================================


syncRegistry(){


if(
typeof RepositoryRegistry==="undefined"
){

return;

}



if(
!RepositoryRegistry.register
){

return;

}





Object.entries(
this.repositories
)

.forEach(
([entity,repo])=>{


try{


RepositoryRegistry.register(
entity,
repo
);



}

catch(e){}



});


},







// ============================================================
// HEALTH
// ============================================================


health(){



const entities =
EntityRegistry.list()
.filter(
e=>
!e.startsWith("__TEST_")
);



const loaded =
entities.filter(
e=>
this.has(e)
);





const coverage =
entities.length
?

Math.round(
loaded.length /
entities.length *
100
)

:

0;





return HealthContract.create(

"RepositoryFactory",

coverage===100
?
"OK"
:
"WARNING",

{


version:this.version,


loaded:this.count(),


entities:entities.length,


coverage,


repositories:this.list(),


metadata:this.metadata


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


count:
this.count(),


repositories:
this.metadata,


discoveryRuns:
this.discoveryRuns,


pending:
this.pending


};


},







// ============================================================
// RESET
// ============================================================


reset(){


this.repositories={};


this.metadata={};


this.pending={};


this.initialized=false;


this.initializing=false;



Logger.log(
"RepositoryFactory RESET"
);



}



};





globalThis.RepositoryFactory =
RepositoryFactory;



Logger.log(

"RepositoryFactory GLOBAL READY v"+
RepositoryFactory.version

);