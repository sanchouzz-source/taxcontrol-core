// ============================================================
// RepositoryRegistry v2.0.0
// Enterprise Repository Registry
// TaxControl ERP Core
//
// Architecture:
//
// Repository
//      |
//      v
// RepositoryRegistry
//      |
//      v
// RepositoryFactory
//      |
//      v
// EntityRegistry
//
// Compatible:
//
// RepositoryFactory v3+
// EntityRegistry v2.5+
// BaseRepository v5.7+
// ============================================================


console.log(
"RepositoryRegistry v2.0.0"
);



const RepositoryRegistry = {


version:"2.0.0",

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

Cargo:"CARGO",


KPI:"KPI",


AUDIT:"AUDIT",

VERSION:"VERSION",


FAILED_EVENT:"FAILED_EVENT"


},







// ============================================================
// INIT
// ============================================================


init(){


if(this.ready){

return true;

}



Logger.log(
"RepositoryRegistry INIT"
);





// регистрация уже загруженных

const loaded = {


CLIENT:
typeof ClientRepository!=="undefined"
?
ClientRepository:null,


TRIP:
typeof TripRepository!=="undefined"
?
TripRepository:null,


VEHICLE:
typeof VehicleRepository!=="undefined"
?
VehicleRepository:null,


DRIVER:
typeof DriverRepository!=="undefined"
?
DriverRepository:null,


CARRIER:
typeof CarrierRepository!=="undefined"
?
CarrierRepository:null,


ROUTE:
typeof RouteRepository!=="undefined"
?
RouteRepository:null,


CARGO:
typeof CargoRepository!=="undefined"
?
CargoRepository:null,


CLIENT_FINANCE_PROFILE:
typeof ClientFinanceProfileRepository!=="undefined"
?
ClientFinanceProfileRepository:null,


FINANCIAL_TRANSACTION:
typeof FinancialTransactionRepository!=="undefined"
?
FinancialTransactionRepository:null,


KPI:
typeof KPIRepository!=="undefined"
?
KPIRepository:null,


AUDIT:
typeof AuditRepository!=="undefined"
?
AuditRepository:null,


VERSION:
typeof VersionRepository!=="undefined"
?
VersionRepository:null,


FAILED_EVENT:
typeof FailedEventRepository!=="undefined"
?
FailedEventRepository:null


};





Object.keys(loaded)
.forEach(entity=>{


if(loaded[entity]){


this.register(
entity,
loaded[entity],
{
force:true
}

);


}



});






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



this.ready=true;



Logger.log(

"RepositoryRegistry READY v"+
this.version+
" count="+
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
"Repository entity empty"
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



if(
!repository
){

throw new Error(

"Repository missing "+
key

);

}




if(
this.repositories[key]
&&
!options.force
){


Logger.warn(

"Repository already exists "+
key

);



return this.repositories[key];


}





this.repositories[key]=repository;



Logger.debug(

"Repository registered "+
key

);



return repository;


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

"Repository not found "+
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


const key =
this.normalize(entity);


return !!this.repositories[key];


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
// HEALTH REPORT
// ============================================================


getHealthReport(){


return this.list()
.map(entity=>{


const repo =
this.repositories[entity];



return {


entity,


version:
repo.version || "unknown",



health:

typeof repo.health==="function"

?

repo.health()

:

null


};


});


},







// ============================================================
// HEALTH
// ============================================================


health(){


return HealthContract.create(

"RepositoryRegistry",

this.ready
?
"OK"
:
"WARNING",

{


version:this.version,


count:this.count(),


repositories:this.list()


}

);


}



};







globalThis.RepositoryRegistry =
RepositoryRegistry;





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