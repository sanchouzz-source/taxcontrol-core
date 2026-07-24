// ============================================================
// RepositoryFactory v1.6.0
// Enterprise Repository Container
// ERP Core
// ============================================================


console.log("RepositoryFactory v1.6.0");


const RepositoryFactory = {


version:"1.6.0",

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
// AUTO REGISTER
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


this.pending[entity]={

repository:meta.repository,

timestamp:new Date()

};



Logger.debug(
"WAITING REPOSITORY "+
entity+
" -> "+
meta.repository
);


}



});


},





// ============================================================
// REGISTER
// ============================================================


register(name,repository){



if(!repository){

throw new Error(
"Repository missing "+name
);

}



if(this.repositories[name]){

Logger.warn(
"Repository already registered "+name
);

return false;

}



const validation =
this.validate(
name,
repository
);



this.repositories[name]=repository;



this.metadata[name]={

version:
repository.version ||
"1.0.0",


methods:
validation.methods,


warnings:
validation.warnings,


registeredAt:
new Date()

};



Logger.debug(
"REGISTERED REPOSITORY "+
name+
" v"+
this.metadata[name].version
);



return true;


},





// ============================================================
// VALIDATE CONTRACT
// ============================================================


validate(name,repository){



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



// если есть BaseRepository
// создаём адаптер


if(
missing.length &&
globalThis.BaseRepository
){



Logger.warn(

"Repository "+
name+
" incomplete. Applying BaseRepository adapter"

);



return this.attachBaseAdapter(
name,
repository,
missing
);


}




if(missing.length){


throw new Error(

"Repository contract violation "+
name+
": missing "+
missing.join(", ")

);


}



return {

methods:required,

warnings:[]

};


},





// ============================================================
// BASE REPOSITORY ADAPTER
// ============================================================


attachBaseAdapter(name,repository,missing){



const entity =
name;



missing.forEach(method=>{


repository[method]=function(...args){


return BaseRepository[method](

entity,

...args

);


};


});



return {

methods:Object.keys(repository),

warnings:[
"BaseRepository adapter applied"
]

};


},





// ============================================================
// LAZY
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
"Lazy repository unavailable "+name
);

}


return repo;


}

}

);



Logger.debug(
"LAZY REGISTERED "+
name
);


},





// ============================================================
// LOADED
// ============================================================


registerLoaded(name,repository){


const result =
this.register(
name,
repository
);



delete this.pending[name];


return result;


},





// ============================================================
// PENDING
// ============================================================


checkPending(){


let count=0;



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


count++;

}


}



Logger.debug(

"CHECK PENDING REGISTERED "+
count

);



return count;


},





// ============================================================
// ACCESS
// ============================================================


get(name){


const repo =
this.repositories[name];



if(!repo){


throw new Error(

"Repository not registered: "+
name

);

}



return repo;


},





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
// DIAGNOSTICS
// ============================================================


diagnostics(){


return {


version:this.version,


repositories:this.metadata,


pending:this.pending,


count:this.count()


};


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

count:this.count(),

repositories:this.list(),

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