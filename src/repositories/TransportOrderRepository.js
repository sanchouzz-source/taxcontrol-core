const TransportOrderRepository = {

    create(data){

        return Database.insert(
            "TRANSPORT_ORDER",
            data
        );

    },


    get(id){

        return Database.findById(
            "TRANSPORT_ORDER",
            id
        );

    },


    update(id,data){

        return Database.update(
            "TRANSPORT_ORDER",
            id,
            data
        );

    },


    delete(id){

        return Database.softDelete(
            "TRANSPORT_ORDER",
            id
        );

    }

};
globalThis.TransportOrderRepository =
TransportOrderRepository;


if(globalThis.RepositoryFactory){

    RepositoryFactory.register(
        "TRANSPORT_ORDER",
        TransportOrderRepository
    );

}