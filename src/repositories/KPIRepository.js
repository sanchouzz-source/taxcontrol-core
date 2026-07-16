console.log("KPIRepository");


const KPIRepository = {


version:"0.7.0",



entity:
EntityRegistry.KPI || 
{
    entity:"KPIMetrics",
    table:"KPIMetrics"
},




create(data){


SecurityGuard.check(
    "KPI_CREATE"
);



if(!data.KPIID){


data.KPIID =
IdService.generate(
    "KPI"
);


}



if(globalThis.OrganizationContext){


data.OrganizationID =
OrganizationContext.get();


}




return BaseRepository.create(
    this.entity,
    data
);


},






getById(id){


SecurityGuard.check(
    "KPI_READ"
);



return BaseRepository.getById(
    this.entity,
    id
);


},





// совместимость EntityService

findById(id){


return this.getById(id);


},






list(filters={}){


SecurityGuard.check(
    "KPI_READ"
);



if(filters &&
Object.keys(filters).length){


return BaseRepository.query(
    this.entity,
    filters
);


}



return BaseRepository.list(
    this.entity
);


},






findAll(){


return this.list();


},






update(id,data){


SecurityGuard.check(
    "KPI_UPDATE"
);



const existing =
this.getById(id);



if(!existing){


throw new Error(
"KPI not found"
);


}




Versioning.save(
    "KPI",
    id,
    existing
);




return BaseRepository.update(
    this.entity,
    id,
    data
);



},







delete(id){


SecurityGuard.check(
    "KPI_DELETE"
);



return BaseRepository.delete(
    this.entity,
    id
);


},






restore(id){


SecurityGuard.check(
    "KPI_RESTORE"
);



return BaseRepository.restore(
    this.entity,
    id
);


},







health(){



return HealthContract.create(

"KPIRepository",

"OK",

{


version:this.version,


entity:
this.entity.entity,


baseRepository:
!!BaseRepository



}


);



}



};






globalThis.KPIRepository =
KPIRepository;





// безопасная регистрация

if(globalThis.RepositoryFactory){


RepositoryFactory.register(
    "KPIRepository",
    KPIRepository
);



}

else{


Logger.warn(
"RepositoryFactory not ready, delayed registration"
);



}




console.log(
"KPIRepository READY v"
+
KPIRepository.version
);