console.log("RepositoryFactory");


const RepositoryFactory = {


version:"0.1.0",


repositories:{},




register(
    entity,
    repository
){


this.repositories[entity]=repository;



Logger.log(

"REPOSITORY REGISTERED: "
+
entity

);



},






get(entity){



const repo =
this.repositories[entity];




if(!repo){


throw new Error(

"Repository not found: "
+
entity

);


}




return repo;



},







health(){


return HealthContract.create(


"RepositoryFactory",


"OK",


{


version:this.version,


repositories:
Object.keys(
this.repositories
)



}



);



}



};





globalThis.RepositoryFactory =
RepositoryFactory;