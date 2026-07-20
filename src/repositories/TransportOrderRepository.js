console.log("TransportOrderRepository");


const TransportOrderRepository = {

    version:"1.0.0",

    entity:"TRANSPORT_ORDER",

    table:"TransportOrders",


    create(data){

        data.TransportOrderID =
            data.TransportOrderID ||
            IdService.generate("TO");


        data.CreatedAt =
            new Date().toISOString();


        data.UpdatedAt =
            data.CreatedAt;


        data.Deleted = false;


        return BaseRepository.create(
            this.table,
            data
        );
    },


    findById(id){

        return BaseRepository.findById(
            this.table,
            id,
            "TransportOrderID"
        );
    },


    findAll(){

        return BaseRepository.findAll(
            this.table
        );
    },


    update(id,data){

        data.UpdatedAt =
            new Date().toISOString();


        return BaseRepository.update(
            this.table,
            id,
            data,
            "TransportOrderID"
        );
    },


    delete(id,user){

        return BaseRepository.delete(
            this.table,
            id,
            user,
            "TransportOrderID"
        );
    },


    restore(id){

        return BaseRepository.restore(
            this.table,
            id,
            "TransportOrderID"
        );
    },


    exists(id){

        const item=this.findById(id);

        return !!item;
    },


    health(){

        return HealthContract.create(
            "TransportOrderRepository",
            "OK",
            {
                version:this.version,
                table:this.table
            }
        );
    }

};

globalThis.TransportOrderRepository =
    TransportOrderRepository;


Logger.debug(
 "TransportOrderRepository READY v1.0.0"
);


// поздняя регистрация
if (
    typeof RepositoryFactory !== "undefined"
) {

    RepositoryFactory.register(
        "TRANSPORT_ORDER",
        TransportOrderRepository
    );

}