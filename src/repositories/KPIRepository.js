console.log("KPIRepository");


const KPIRepository = {


version:"0.7.0",


entity:
EntityRegistry.KPI,





create(data){


return BaseRepository.create(

this.entity,

data

);


},






update(id,data){


return BaseRepository.update(

this.entity,

id,

data

);


},






getById(id){


return BaseRepository.getById(

this.entity,

id

);


},





// совместимость EntityService

findById(id){


return this.getById(id);


},






list(){


return BaseRepository.list(

this.entity

);


},






// совместимость EntityService

findAll(){


return this.list();


},






delete(id){


return BaseRepository.delete(

this.entity,

id

);


},






restore(id){


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


entity:this.entity.entity,


baseRepository:
!!BaseRepository



}



);


}



};








globalThis.KPIRepository =
KPIRepository;






// безопасная регистрация

if(
globalThis.RepositoryFactory
){


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