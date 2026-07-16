console.log("RepositoryFactory");


const RepositoryFactory = {


version:"0.3.0",


repositories:{},


aliases:{},






register(
name,
repository
){


if(!repository){

throw new Error(
"Repository missing: "
+
name
);

}



this.repositories[name]=repository;



Logger.log(

"REPOSITORY REGISTERED: "
+
name

);



},







registerAlias(
entity,
repositoryName
){


this.aliases[entity]=repositoryName;



Logger.log(

"REPOSITORY ALIAS: "
+
entity
+
" -> "
+
repositoryName

);


},








get(name){



let repo =
this.repositories[name];



if(repo){

return repo;

}




const alias =
this.aliases[name];



if(alias){


repo =
this.repositories[alias];


if(repo){

return repo;

}

}



throw new Error(

"Repository not found: "
+
name

);


},







init(){



this.registerAlias(
"CLIENT",
"ClientRepository"
);



this.registerAlias(
"TRIP",
"TripRepository"
);

this.registerAlias(
    "KPI",
    "KPIRepository"
);



// регистрация после загрузки всех классов

if(globalThis.TripRepository){


this.register(
    "TripRepository",
    TripRepository
);


}



Logger.log(
"RepositoryFactory READY v"
+
this.version
);



},








health(){


return HealthContract.create(

"RepositoryFactory",

"OK",

{

version:this.version,

repositories:
Object.keys(this.repositories),

aliases:this.aliases

}

);


}



};





globalThis.RepositoryFactory =
RepositoryFactory;