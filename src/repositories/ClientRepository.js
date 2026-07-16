console.log("ClientRepository");


const ClientRepository = {


version:"0.7.0",


entity:
EntityRegistry.CLIENT,





init(){


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




// EntityService compatibility

findById(id){


    return this.getById(id);


},





list(){


    return BaseRepository.list(

        this.entity

    );


},





// EntityService compatibility

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


        entity:
        this.entity.entity,


        baseRepository:
        !!BaseRepository



    }


);



}



};





globalThis.ClientRepository =
ClientRepository;





// безопасная регистрация

if(
    typeof RepositoryFactory !== "undefined"
){


    RepositoryFactory.register(

        "ClientRepository",

        ClientRepository

    );


}
else{


    console.warn(
        "RepositoryFactory not ready, delayed registration"
    );


}





console.log(
    "ClientRepository READY v"
    +
    ClientRepository.version
);