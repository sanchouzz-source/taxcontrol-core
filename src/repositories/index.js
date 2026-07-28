// ============================================================
// RepositoryRegistry v2.1.1
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
"RepositoryRegistry v2.1.1"
);



const RepositoryRegistry = {


// ============================================================
// META
// ============================================================


version:"2.1.1",

ready:false,


repositories:{},


factorySyncCount:0,





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

FAILED_EVENT:"FAILED_EVENT",

TRANSPORT_ORDER:"TRANSPORT_ORDER",

CLIENT_FINANCE_PROFILE:"CLIENT_FINANCE_PROFILE",

FINANCIAL_TRANSACTION:"FINANCIAL_TRANSACTION"

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



this.refresh();



Logger.log(

"RepositoryRegistry READY count="
+
this.count()

);



return true;


},







// ============================================================
// REFRESH
// Повторная синхронизация после загрузки модулей
// ============================================================


refresh(){


Logger.log(
"RepositoryRegistry REFRESH"
);



this.collectGlobals();



this.syncFactory();



this.publish();



Logger.log(

"RepositoryRegistry REFRESH COMPLETE count="
+
this.count()

);



return this.count();


},







// ============================================================
// COLLECT GLOBAL REPOSITORIES
// ============================================================


collectGlobals(){


const map={


CLIENT:"ClientRepository",

TRIP:"TripRepository",

VEHICLE:"VehicleRepository",

DRIVER:"DriverRepository",

CARRIER:"CarrierRepository",

ROUTE:"RouteRepository",

CARGO:"CargoRepository",


TRANSPORT_ORDER:
"TransportOrderRepository",


CLIENT_FINANCE_PROFILE:
"ClientFinanceProfileRepository",


FINANCIAL_TRANSACTION:
"FinancialTransactionRepository",


KPI:
"KPIRepository",


AUDIT:
"AuditRepository",


VERSION:
"VersionRepository",


FAILED_EVENT:
"FailedEventRepository"


};





Object.keys(map)
.forEach(entity=>{


const name =
map[entity];



try{


if(
typeof globalThis[name]!=="undefined"
){


this.register(

entity,

globalThis[name],

{
force:true
}

);


}



}
catch(e){


Logger.warn(

"Repository collect failed "
+
entity+
" "
+
e.message

);


}



});



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

"Repository missing "
+
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

"RepositoryRegistry REGISTER "
+
key

);



this.syncFactoryEntity(

key,

repository

);



return repository;


},







// ============================================================
// LATE LOAD
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

"Repository not found "
+
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


return !!this.repositories[
this.normalize(entity)
];


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
// FACTORY
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



this.factorySyncCount++;



return true;


}



}
catch(e){


Logger.warn(

"Factory sync failed "
+
entity+
": "
+
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

"RepositoryRegistry publish skipped "
+
e.message

);


}



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
repo.version || "-",


table:
repo.table || "-",


factory:

typeof RepositoryFactory!=="undefined"
&&
RepositoryFactory.has
?

RepositoryFactory.has(entity)

:

false,


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
// DIAGNOSTICS
// ============================================================


diagnostics(){


return {


module:"RepositoryRegistry",

version:this.version,


ready:this.ready,


count:this.count(),


factorySyncCount:
this.factorySyncCount,


repositories:this.list(),


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

this.ready
&&
data.count>0

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

"RepositoryRegistry deferred "
+
e.message

);


}







Logger.log(

"RepositoryRegistry GLOBAL READY v"+
RepositoryRegistry.version

);