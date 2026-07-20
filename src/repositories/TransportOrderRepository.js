console.log("TransportOrderRepository");


const TransportOrderRepository = {

version:"1.1.0",


create(data){

    return BaseRepository.create(
        "TRANSPORT_ORDER",
        data
    );

},


findById(id){

    return BaseRepository.findById(
        "TRANSPORT_ORDER",
        id
    );

},


findAll(filters = {}){

    return BaseRepository.findAll(
        "TRANSPORT_ORDER",
        filters
    );

},


update(id,data){

    return BaseRepository.update(
        "TRANSPORT_ORDER",
        id,
        data
    );

},


delete(id){

    return BaseRepository.delete(
        "TRANSPORT_ORDER",
        id
    );

},


restore(id){

    return BaseRepository.restore(
        "TRANSPORT_ORDER",
        id
    );

},


exists(id){

    return BaseRepository.exists(
        "TRANSPORT_ORDER",
        id
    );

},


health(){

    return HealthContract.create(
        "TransportOrderRepository",
        "OK",
        {
            version:this.version,
            entity:"TRANSPORT_ORDER"
        }
    );

}

};



globalThis.TransportOrderRepository =
    TransportOrderRepository;


Logger.debug(
"[DEBUG] TransportOrderRepository READY v"
+ TransportOrderRepository.version
);


// регистрация после загрузки

if(typeof RepositoryFactory !== "undefined"){

    RepositoryFactory.register(
        "TRANSPORT_ORDER",
        TransportOrderRepository
    );

}