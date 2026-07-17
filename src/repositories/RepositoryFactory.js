console.log("RepositoryFactory");


const RepositoryFactory = {


version:"1.1.0",


ready:false,


repositories:{},


aliases:{},



contract:[

"create",
"findById",
"findAll",
"update",
"delete",
"restore",
"exists"

],





init(){


if(this.ready){

Logger.log(
"RepositoryFactory ALREADY READY"
);

return;

}



Logger.log(
"RepositoryFactory INIT"
);



this.ready=true;



},






register(
name,
repository,
alias
){



this.validate(
name,
repository
);



if(this.repositories[name]){


throw new Error(
"Repository already registered: "
+
name
);


}




this.repositories[name]=repository;



if(alias){

this.aliases[
alias
]=name;


Logger.log(
"REPOSITORY ALIAS: "
+
alias+
" -> "+
name
);


}



Logger.log(

"REPOSITORY REGISTERED: "
+
name

);



},






validate(
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




this.contract.forEach(
method=>{


if(
typeof repository[method]
!=="function"
){


throw new Error(

"Repository "
+
name
+
" missing method "
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








registerDefaults(){


this.init();



this.register(

"ClientRepository",

ClientRepository,

"CLIENT"

);



this.register(

"TripRepository",

TripRepository,

"TRIP"

);



this.register(

"KPIRepository",

KPIRepository,

"KPI"

);



},







get(
alias
){



const name=
this.aliases[alias];



if(!name){


throw new Error(

"Repository not registered: "
+
alias

);


}



return this.repositories[name];


},







has(alias){


return !!this.aliases[alias];


},







list(){


return Object.keys(
this.repositories
);


},







health(){


return HealthContract.create(

"RepositoryFactory",

this.ready
?
"OK"
:
"NOT_READY",

{


version:this.version,


repositories:
this.list(),


aliases:
this.aliases


}


);


}



};





globalThis.RepositoryFactory=
RepositoryFactory;



Logger.log(
"RepositoryFactory READY v1.1.0"
);