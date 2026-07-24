// ============================================================
// RepositoryFactory v1.5.0
// Enterprise Repository Container
// ERP Core
// ============================================================


console.log("RepositoryFactory v1.5.0");


const RepositoryFactory = {


version:"1.5.0",

apiVersion:"1.0",


repositories:{},

pending:{},

metadata:{},

initialized:false,



// ============================================================
// INIT
// ============================================================


init(){


if(this.initialized){

Logger.debug(
"RepositoryFactory ALREADY READY"
);

return;

}


Logger.debug(
"RepositoryFactory INIT"
);



this.autoRegister();


this.checkPending();



this.initialized=true;



Logger.log(
"RepositoryFactory READY v"+
this.version
);


},




// ============================================================
// AUTO REGISTER FROM ENTITY METADATA
// ============================================================


autoRegister(){


if(!globalThis.EntityRegistry){

throw new Error(
"EntityRegistry unavailable"
);

}



const entities =
EntityRegistry.list();



entities.forEach(entity=>{


const meta =
EntityRegistry.get(entity);



if(!meta || !meta.repository){

return;

}



const repo =
globalThis[meta.repository];



if(repo){

this.register(
entity,
repo
);

}
else{


Logger.debug(
"WAITING REPOSITORY: "+
entity+
" -> "+
meta.repository
);


this.pending[entity]={
repository:meta.repository,
timestamp:new Date()
};


}



});


},




// ============================================================
// REGISTER
// ============================================================


register(name,repository){



if(!repository){

throw new Error(
"Repository missing: "+
name
);

}



if(this.repositories[name]){


Logger.warn(
"Repository already registered: "+
name
);


return false;

}



const contract =
this.validate(repository);



this.repositories[name]=repository;


this.metadata[name]={

version:
repository.version || "1.0.0",

registeredAt:
new Date(),

methods:
contract.methods

};



Logger.debug(
"REGISTERED REPOSITORY: "+
name+
" v"+
this.metadata[name].version
);



return true;


},





// ============================================================
// CONTRACT VALIDATION
// ============================================================


validate(repository){



const required=[

"create",

"findAll",

"findById",

"update",

"delete",

"restore",

"exists"

];



const missing=[];



required.forEach(method=>{


if(typeof repository[method]!=="function"){

missing.push(method);

}


});



if(missing.length){


throw new Error(

"Repository contract violation. Missing methods: "+
missing.join(", ")

);


}



return {

methods:required

};


},





// ============================================================
// LAZY REGISTER
// ============================================================


registerLazy(name,getter){


Object.defineProperty(

this.repositories,

name,

{

configurable:true,

get(){


const repo=getter();


if(!repo){

throw new Error(
"Lazy repository unavailable: "+
name
);

}


return repo;


}

}

);



Logger.debug(
"LAZY REGISTERED: "+
name
);


},





// ============================================================
// REGISTER AFTER LOAD
// ============================================================


registerLoaded(name,repository){



this.register(
name,
repository
);



delete this.pending[name];



Logger.debug(
"LOADED REPOSITORY REGISTERED: "+
name
);



},





// ============================================================
// PENDING CHECK
// ============================================================


checkPending(){



let registered=0;



for(
const [entity,data]
of Object.entries(this.pending)
){



const repo =
globalThis[data.repository];



if(repo){


this.registerLoaded(
entity,
repo
);


registered++;


}


}



if(registered){


Logger.debug(

"CHECK PENDING REGISTERED: "+
registered

);


}
else{


Logger.debug(
"CHECK PENDING: no repositories found"
);


}



},




// ============================================================
// GET
// ============================================================


get(name){



const repo =
this.repositories[name];



if(!repo){


Logger.error(

"Repository missing: "+
name+
" pending="+
JSON.stringify(this.pending)

);



throw new Error(

"Repository not registered: "+
name

);


}



return repo;


},




// ============================================================
// HELPERS
// ============================================================


has(name){

return !!this.repositories[name];

},



list(){

return Object.keys(
this.repositories
);

},




count(){

return this.list().length;

},





// ============================================================
// HEALTH
// ============================================================


health(){


return HealthContract.create(

"RepositoryFactory",

this.initialized
?
"OK"
:
"WARNING",


{


version:this.version,


repositories:this.list(),


count:this.count(),


pending:Object.keys(this.pending)


}


);


}



};




// ============================================================
// GLOBAL
// ============================================================


globalThis.RepositoryFactory =
RepositoryFactory;



Logger.log(

"RepositoryFactory GLOBAL REGISTERED v"+
RepositoryFactory.version

);



// авто-подхват уже загруженных

RepositoryFactory.checkPending();