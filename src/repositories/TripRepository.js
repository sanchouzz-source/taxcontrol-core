console.log("TripRepository");



const TripRepository = {


version:"2.0.0",



entity:"TRIP",







create(data){


return BaseRepository.create(

    this.entity,

    data

);


},







findById(id){


return BaseRepository.findById(

    this.entity,

    id

);


},







get(id){


return this.findById(id);


},







findAll(filters={}){


return BaseRepository.findAll(

    this.entity,

    filters

);


},







update(id,data){


return BaseRepository.update(

    this.entity,

    id,

    data

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







exists(id){


return BaseRepository.exists(

    this.entity,

    id

);


},







health(){


return HealthContract.create(


"TripRepository",


"OK",


{


version:
this.version,


entity:
this.entity,


table:
EntityRegistry.TRIP.table



}


);


}



};






globalThis.TripRepository =
TripRepository;



Logger.log(

"TripRepository READY v"
+
TripRepository.version

);