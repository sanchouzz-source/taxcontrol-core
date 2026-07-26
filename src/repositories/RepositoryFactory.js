// ============================================================
// RepositoryFactory v2.3.0
// Enterprise Repository Dependency Container
// ERP Core
// ============================================================

console.log("RepositoryFactory v2.3.0");


const RepositoryFactory = {

version:"2.3.0",

apiVersion:"2.1",

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
"RepositoryFactory already initialized"
);

return;

}


Logger.log(
"RepositoryFactory INIT"
);



this.loadFromRegistry();


this.autoRegister();



this.checkPending();



this.syncRegistry();



this.initialized=true;



Logger.log(
"RepositoryFactory READY v"+
this.version+
" count="+
this.count()
);


},



// ============================================================
// LOAD REGISTRY
// ============================================================

loadFromRegistry(){


if(typeof RepositoryRegistry==="undefined")
return;



RepositoryRegistry.list()
.forEach(entity=>{


const repo =
RepositoryRegistry.get(entity);



if(repo)
this.register(entity,repo);


});


},




// ============================================================
// AUTO REGISTER
// ============================================================


autoRegister(){


if(typeof EntityRegistry==="undefined")
throw new Error(
"EntityRegistry unavailable"
);



const entities =
EntityRegistry.list();



entities.forEach(entity=>{


const meta =
EntityRegistry.get(entity);



const repoName =
meta.repository;



let repo =
this.resolveRepository(repoName);



if(repo){


this.register(
entity,
repo
);


}
else{


// fallback
if(meta.system &&
typeof BaseRepository!=="undefined"){


this.register(
entity,
BaseRepository
);


}
else{


this.pending[entity]={

repository:repoName,

created:new Date()

};


Logger.debug(
"Repository pending "+
entity+
" -> "+
repoName
);


}


}



});


},



// ============================================================
// RESOLVE REPOSITORY
// ============================================================


resolveRepository(name){


if(!name)
return null;



// 1 globalThis

if(globalThis[name])
return globalThis[name];



// 2 прямой lookup

try{


return eval(name);


}catch(e){}



return null;


},




// ============================================================
// REGISTER
// ============================================================


register(entity,repository){


if(this.repositories[entity])
return false;



if(!repository)
throw new Error(
"Repository missing "+
entity
);



this.validate(
entity,
repository
);



this.repositories[entity]=repository;



this.metadata[entity]={

version:
repository.version||"unknown",

registeredAt:
new Date()

};



Logger.log(
"RepositoryFactory REGISTER "+
entity
);



return true;


},




// ============================================================
// VALIDATION
// ============================================================


validate(entity,repo){


const required=[

"create",

"findById",

"findAll",

"update",

"delete",

"restore",

"exists"

];



const missing=[];



required.forEach(m=>{


if(typeof repo[m]!=="function")
missing.push(m);


});



if(missing.length){


if(typeof BaseRepository!=="undefined"){


this.attachBaseAdapter(
entity,
repo,
missing
);


return;


}


throw new Error(

"Repository contract failed "+
entity+
": "+
missing.join(",")

);


}



},




// ============================================================
// BASE ADAPTER
// ============================================================


attachBaseAdapter(entity,repo,methods){


methods.forEach(method=>{


if(typeof repo[method]!=="function"){


repo[method]=function(...args){


return BaseRepository[method](
entity,
...args
);


};


}


});


},




// ============================================================
// PENDING
// ============================================================


checkPending(){


Object.entries(this.pending)
.forEach(([entity,item])=>{


const repo =
this.resolveRepository(
item.repository
);



if(repo){


this.register(
entity,
repo
);


delete this.pending[entity];


}


});


},




// ============================================================
// SYNC
// ============================================================


syncRegistry(){


if(typeof RepositoryRegistry==="undefined")
return;



Object.entries(this.repositories)
.forEach(([entity,repo])=>{


if(RepositoryRegistry.register){

RepositoryRegistry.register(
entity,
repo
);

}


});


},




// ============================================================
// ACCESS
// ============================================================


get(entity){


const repo =
this.repositories[entity];



if(!repo)
throw new Error(
"Repository not found "+
entity
);



return repo;


},



has(entity){

return !!this.repositories[entity];

},



list(){

return Object.keys(this.repositories);

},



count(){

return this.list().length;

},



diagnostics(){


return {


version:this.version,


repositories:this.list(),


pending:this.pending,


count:this.count()


};


},



health(){


return HealthContract.create(

"RepositoryFactory",

this.initialized?
"OK":
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



globalThis.RepositoryFactory =
RepositoryFactory;


Logger.log(
"RepositoryFactory GLOBAL READY v"+
RepositoryFactory.version
);