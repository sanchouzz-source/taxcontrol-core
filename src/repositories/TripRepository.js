console.log("TripRepository");


const TripRepository = {


version:"0.6.0",


entity:
EntityRegistry.TRIP,



init(){


    RepositoryFactory.register(
        "TripRepository",
        this
    );


    Logger.log(
        "TripRepository READY v"
        +
        this.version
    );


},




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



findById(id){
    return this.getById(id);
},


findAll(){
    return this.list();
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


entity:
this.entity.entity,


baseRepository:
!!BaseRepository,


registered:
!!RepositoryFactory.repositories.TripRepository



}


);



}



};





globalThis.TripRepository =
TripRepository;