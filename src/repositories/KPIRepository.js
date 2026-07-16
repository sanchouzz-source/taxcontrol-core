console.log("KPIRepository");



const KPIRepository = {


version:"0.6.0",



entity:
EntityRegistry.KPI,





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







// совместимость EntityService

findById(id){


return this.getById(id);


},







list(filters={}){


return BaseRepository.list(

    this.entity,

    filters

);


},







// совместимость EntityService

findAll(filters={}){


return this.list(filters);


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

    "KPIRepository",

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







globalThis.KPIRepository =
KPIRepository;







RepositoryFactory.register(

    "KPIRepository",

    KPIRepository

);







console.log(

    "KPIRepository READY v"
    +
    KPIRepository.version

);