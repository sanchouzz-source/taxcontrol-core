console.log("RepositoryFactory");


const RepositoryFactory = {


version:"0.4.0",


repositories:{},


aliases:{},




contract:[

"findById",
"findAll",
"create",
"update",
"delete",
"restore"

],








validateRepository(
name,
repository
){


this.contract.forEach(method=>{


if(typeof repository[method] !== "function"){


throw new Error(

"Repository contract failed: "
+
name
+
" missing "
+
method

);


}


});



Logger.log(

"REPOSITORY CONTRACT OK: "
+
name

);


},







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





this.validateRepository(
name,
repository
);





if(this.repositories[name]){


Logger.log(

"REPOSITORY ALREADY REGISTERED: "
+
name

);


return this.repositories[name];


}





this.repositories[name]=repository;



Logger.log(

"REPOSITORY REGISTERED: "
+
name

);





return repository;


},







registerAlias(
entity,
repositoryName
){



if(!this.repositories[repositoryName]
&&
!globalThis[repositoryName]){


Logger.log(

"WARNING: alias target not loaded "
+
repositoryName

);


}





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







get(
name
){



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







getOrThrow(
name
){


try{


return this.get(name);


}

catch(e){


Logger.log(

"RepositoryFactory ERROR: "
+
e.message

);


throw e;


}


},







has(
name
){


return !!this.repositories[name]
||
!!this.aliases[name];


},







init(){



Logger.log(
"RepositoryFactory INIT"
);





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







[
"ClientRepository",
"TripRepository",
"KPIRepository"

]
.forEach(name=>{


const repo =
globalThis[name];



if(repo){


this.register(
name,
repo
);


}
else{


Logger.log(

"REPOSITORY NOT FOUND DURING INIT: "
+
name

);


}


});






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


aliases:this.aliases,


count:
Object.keys(this.repositories).length


}


);


}




};





globalThis.RepositoryFactory =
RepositoryFactory;