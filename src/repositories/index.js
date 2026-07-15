const RepositoryRegistry = {


version:"0.1.0",


init(){


CoreRegistry.register(
    "Repositories",
    {
        BaseRepository,
        ClientRepository,
        TripRepository,
        KPIRepository
    }
);


Logger.log(
"Repositories READY"
);



}



};


globalThis.RepositoryRegistry =
RepositoryRegistry;