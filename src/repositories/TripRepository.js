console.log("TripRepository");



const TripRepository = {



version:"0.5.0",



entity:
EntityRegistry.TRIP,





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






list(){


return BaseRepository.list(

this.entity

);


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

"TripRepository",

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



globalThis.TripRepository =
TripRepository;


RepositoryFactory.register(
    "TripRepository",
    TripRepository
);