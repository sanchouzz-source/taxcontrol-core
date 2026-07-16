console.log("ClientRepository");


const ClientRepository = {


version:"0.6.0",


entity:
EntityRegistry.CLIENT,



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



// совместимость с EntityService
findById(id){

    return this.getById(id);

},




list(){

    return BaseRepository.list(
        this.entity
    );

},




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

    "ClientRepository",

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





globalThis.ClientRepository =
ClientRepository;



RepositoryFactory.register(
    "ClientRepository",
    ClientRepository
);



console.log(
    "ClientRepository READY v" + ClientRepository.version
);