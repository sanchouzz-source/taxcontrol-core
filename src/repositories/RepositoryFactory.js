// ============================================================
// RepositoryFactory v2.5.9
// Enterprise Repository Dependency Container
// TaxControl ERP Core
// ============================================================

console.log("RepositoryFactory v2.5.9");


const RepositoryFactory = {


version:"2.5.9",

apiVersion:"2.3",



repositories:{},

pending:{},

metadata:{},



initialized:false,

initializing:false,


discoveryRuns:0,



// ============================================================
// INIT
// ============================================================


init(){


if(this.initialized){

Logger.debug(
"RepositoryFactory already initialized"
);

return;

}


if(this.initializing){

return;

}


this.initializing=true;



try{


Logger.log(
"RepositoryFactory INIT"
);



this.loadFromRegistry();



this.registerAllRepositories();



this.autoRegister();



this.refreshPending();



this.discoverLoadedRepositories();



this.recoverMissingRepositories();



this.syncRegistry();



this.initialized=true;



Logger.log(
"RepositoryFactory READY v"+
this.version+
" count="+
this.count()
);



}
catch(e){


this.initialized=false;


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
// LOAD REGISTRY
// ============================================================


loadFromRegistry(){


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
// MANUAL DISCOVERY
// ============================================================


registerAllRepositories(){


const list=[


"ClientRepository",

"TripRepository",

"VehicleRepository",

"RouteRepository",

"TransportOrderRepository",

"CarrierRepository",

"DriverRepository",

"CargoRepository",

"FinancialTransactionRepository",

"ClientFinanceProfileRepository",

"KPIRepository",

"AuditRepository",

"VersionRepository"


];



let count=0;



list.forEach(name=>{


const repo =
this.resolveRepository(name);



if(repo){


const entity =
this.buildEntityName(name);



if(this.register(entity,repo)){


count++;


}



}



});



Logger.log(
"Manual repositories registered "+
count
);


return count;


},




// ============================================================
// NAME CONVERSION
// ============================================================


buildEntityName(repositoryName){


return repositoryName

.replace("Repository","")

.replace(/([a-z])([A-Z])/g,"$1_$2")

.toUpperCase();


},




buildRepositoryName(entity){


const special={


KPI:"KPIRepository",

AUDIT:"AuditRepository",

VERSION:"VersionRepository",

CRM:"CRMRepository",

API:"APIRepository"


};



if(special[entity]){

return special[entity];

}



return entity

.split("_")

.map(x=>

x.charAt(0)+

x.slice(1).toLowerCase()

)

.join("")+

"Repository";


},




// ============================================================
// AUTO REGISTER FROM ENTITY REGISTRY
// ============================================================


autoRegister(){


if(
typeof EntityRegistry==="undefined"
){

return;

}



EntityRegistry.list()
.forEach(entity=>{


const meta =
EntityRegistry.get(entity);



if(!meta){

return;

}



// системные тестовые сущности

if(
entity.startsWith("__TEST_")
){

return;

}



const repoName =
meta.repository ||

this.buildRepositoryName(entity);



const repo =
this.resolveRepository(repoName);



if(repo){


this.register(
entity,
repo
);


}
else{


this.pending[entity]={


repository:repoName,


created:new Date()


};



Logger.debug(
"Repository pending "+
entity+
" -> "+
repoName
);



}



});


},




// ============================================================
// REGISTER
// ============================================================


register(entity,repository,options={}){


if(!entity || !repository){

return false;

}



if(
this.repositories[entity] &&
!options.force
){


return false;

}



const contract =
this.validate(
entity,
repository
);



this.repositories[entity]=repository;



this.metadata[entity]={


version:
repository.version || "unknown",


contract,


crud:
this.detectCRUD(repository),


registeredAt:
new Date()


};



delete this.pending[entity];



Logger.log(
"RepositoryFactory REGISTER "+
entity
);



return true;


},




// ============================================================
// LATE LOAD
// ============================================================


registerLoaded(entity,repository){


if(
!entity ||
!repository
){

return false;

}



delete this.pending[entity];



return this.register(
entity,
repository
);


},



notifyLoaded(entity,repository){


Logger.log(
"RepositoryFactory NOTIFY LOADED "+
entity
);


return this.registerLoaded(
entity,
repository
);


},




// ============================================================
// DISCOVERY
// ============================================================


discoverLoadedRepositories(){


this.discoveryRuns++;


let count=0;



Object.keys(globalThis)

.filter(name=>

name.endsWith("Repository")

)

.forEach(name=>{


const repo =
globalThis[name];



if(
!repo ||
typeof repo!=="object"
){

return;

}



const entity =
repo.entity ||

this.buildEntityName(name);



if(
entity &&
!this.repositories[entity]
){


if(this.register(entity,repo)){


count++;


Logger.log(
"Repository DISCOVERED "+
entity
);



}



}



});



return count;


},




// ============================================================
// RECOVERY
// ============================================================


recoverMissingRepositories(){


if(
typeof EntityRegistry==="undefined"
){

return 0;

}



let count=0;



EntityRegistry.list()

.forEach(entity=>{


if(
this.repositories[entity]
){

return;

}



const name =
this.buildRepositoryName(entity);



const repo =
this.resolveRepository(name);



if(repo){


if(this.register(entity,repo)){


count++;


}


}



});



return count;


},




// ============================================================
// VALIDATE CONTRACT
// ============================================================


validate(entity,repo){


const required=[


"create",

"findById",

"findAll",

"update",

"delete",

"restore",

"exists"


];



const missing=[];



required.forEach(m=>{


if(
typeof repo[m]!=="function"
){

missing.push(m);

}


});



if(missing.length){


return {


status:"WARNING",

missing


};


}



return {


status:"OK",

missing:[]


};



},




// ============================================================
// CRUD
// ============================================================


detectCRUD(repo){


const list=[


"create",

"findById",

"findAll",

"update",

"delete"


];



let ok=0;



list.forEach(m=>{


if(
typeof repo[m]==="function"
){

ok++;

}


});



return {


available:ok,

total:list.length,


percent:
Math.round(ok/list.length*100)


};


},




// ============================================================
// RESOLVE
// ============================================================


resolveRepository(name){


if(
globalThis[name]
){

return globalThis[name];

}



const key =
Object.keys(globalThis)

.find(k=>

k.toUpperCase()==name.toUpperCase()

);



return key
?
globalThis[key]
:
null;


},




// ============================================================
// PENDING
// ============================================================


refreshPending(){


let loaded=0;



Object.entries(this.pending)

.forEach(([entity,item])=>{


const repo =
this.resolveRepository(
item.repository
);



if(repo){


this.registerLoaded(
entity,
repo
);



loaded++;


}



});



return loaded;


},




pendingReport(){


return Object.entries(this.pending)

.map(([entity,item])=>({


entity,


repository:item.repository


}));


},




// ============================================================
// ACCESS
// ============================================================


get(entity){


if(
!this.repositories[entity]
){

this.refreshPending();


this.recoverMissingRepositories();


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


return !!this.repositories[entity];


},



list(){


return Object.keys(this.repositories);


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
typeof RepositoryRegistry.register!=="function"
){

return;

}



Object.entries(this.repositories)

.forEach(([entity,repo])=>{


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
// REFRESH
// ============================================================


refresh(){


Logger.log(
"RepositoryFactory FULL REFRESH"
);



this.registerAllRepositories();


this.autoRegister();


this.refreshPending();


this.discoverLoadedRepositories();


const recovered =
this.recoverMissingRepositories();



this.syncRegistry();



return {


repositories:this.count(),


recovered,


pending:Object.keys(this.pending)


};



},




// ============================================================
// STATUS
// ============================================================


status(){


return {


version:this.version,


initialized:this.initialized,


count:this.count(),


repositories:this.list(),


pending:this.pendingReport()


};


},




// ============================================================
// HEALTH
// ============================================================


health(){


const total =
typeof EntityRegistry!=="undefined"

?
EntityRegistry.list().length

:
0;



const loaded =
this.count();



return HealthContract.create(

"RepositoryFactory",

"OK",

{


version:this.version,


loaded,


total,


coverage:
total
?
Math.round(
loaded/total*100
)
:
0,


repositories:this.list(),


pending:Object.keys(this.pending)


}


);


},




// ============================================================
// RESET
// ============================================================


reset(){


this.repositories={};

this.pending={};

this.metadata={};

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