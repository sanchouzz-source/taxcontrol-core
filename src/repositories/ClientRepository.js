console.log("ClientRepository");



const ClientRepository = {


version:"2.0.0",



entity:"CLIENT",







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


"ClientRepository",


"OK",


{


version:
this.version,


entity:
this.entity,


table:
EntityRegistry.CLIENT.table



}


);


}



};





globalThis.ClientRepository =
ClientRepository;



Logger.log(

"ClientRepository READY v"
+
ClientRepository.version

);