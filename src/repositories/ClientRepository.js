console.log("ClientRepository");


const ClientRepository = {


version:"0.6.0",


entity:
EntityRegistry.CLIENT,



init(){


    RepositoryFactory.register(

        "ClientRepository",

        this

    );


    Logger.log(

        "ClientRepository READY v"
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

        "ClientRepository",

        "OK",

        {


            version:this.version,


            entity:
            this.entity.entity,


            baseRepository:
            !!BaseRepository,


            registered:
            !!(
                RepositoryFactory
                &&
                RepositoryFactory.repositories
                &&
                RepositoryFactory.repositories.ClientRepository
            )


        }

    );


}



};





globalThis.ClientRepository =
ClientRepository;