// ============================================================
// RepositoryFactory v2.4.0
// Enterprise Repository Dependency Container
// TaxControl ERP Core
// ============================================================


console.log("RepositoryFactory v2.4.0");



const RepositoryFactory = {


version:"2.4.0",

apiVersion:"2.2",



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


this.refreshPending();


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
// LOAD EXISTING REGISTRY
// ============================================================


loadFromRegistry(){


if(
typeof RepositoryRegistry==="undefined"
)
return;



try{


RepositoryRegistry.list()
.forEach(entity=>{


const repo =
RepositoryRegistry.get(entity);



if(repo){

this.register(
entity,
repo
);

}


});


}
catch(e){


Logger.warn(
"RepositoryRegistry load failed "+
e.message
);


}



},






// ============================================================
// AUTO REGISTER
// ============================================================


autoRegister(){


if(
typeof EntityRegistry==="undefined"
){

throw new Error(
"EntityRegistry unavailable"
);

}



EntityRegistry.list()
.forEach(entity=>{


const meta =
EntityRegistry.get(entity);



if(!meta)
return;



// SYSTEM

if(meta.system){

this.registerSystemRepository(
entity
);


return;

}




const repoName =
meta.repository ||
(entity+"Repository");



const repo =
globalThis[repoName];



if(repo){


this.register(
entity,
repo
);


}
else{


this.pending[entity]={

repository:repoName,

system:false,

created:new Date()

};



Logger.debug(
"Repository pending "+
entity+
" -> "+
repoName
);



}



});


},







// ============================================================
// SYSTEM REPOSITORY
// ============================================================


registerSystemRepository(entity){


if(
typeof BaseRepository==="undefined"
){


this.pending[entity]={

repository:"BaseRepository",

system:true,

created:new Date()

};


return;


}



this.register(
entity,
BaseRepository
);



Logger.log(
"System repository registered "+
entity
);



},








// ============================================================
// REGISTER
// ============================================================


register(
entity,
repository,
options={}
){



if(!entity)
throw new Error(
"Repository entity required"
);



if(!repository)
throw new Error(
"Repository missing "+
entity
);





if(
this.repositories[entity]
&&
!options.force
){

Logger.debug(
"Repository already exists "+
entity
);


return false;

}






const contract =
this.validate(
entity,
repository
);





this.repositories[entity]=repository;



this.metadata[entity]={


version:
repository.version ||
"unknown",


contract,


crud:
this.detectCRUD(repository),


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
// COMPATIBILITY
// ============================================================


registerLoaded(
entity,
repository
){


delete this.pending[entity];


return this.register(
entity,
repository
);


},








// ============================================================
// VALIDATE CONTRACT
// ============================================================


validate(
entity,
repository
){


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



required.forEach(method=>{


if(
typeof repository[method]
!=="function"
){

missing.push(method);

}


});






if(
missing.length
&&
typeof BaseRepository!=="undefined"
){


this.attachBaseAdapter(
entity,
repository,
missing
);



return{


status:"ADAPTED",


missing,


warnings:[
"BaseRepository adapter applied"
]


};


}






if(missing.length){


throw new Error(

"Repository contract failed "+
entity+
": "+
missing.join(",")

);


}



return{


status:"OK",

missing:[],

warnings:[]

};



},









// ============================================================
// BASE ADAPTER
// ============================================================


attachBaseAdapter(
entity,
repository,
methods
){


methods.forEach(method=>{


if(
typeof repository[method]!=="function"
){


repository[method]=
function(...args){


return BaseRepository[method](

entity,

...args

);


};


}



});



},







// ============================================================
// PENDING RETRY
// ============================================================


refreshPending(){


let loaded=0;



Object.entries(this.pending)
.forEach(([entity,item])=>{


let repo =
globalThis[item.repository];



if(repo){


this.registerLoaded(
entity,
repo
);


loaded++;


}



});



if(loaded){

Logger.log(
"Repository pending loaded "+
loaded
);

}



return loaded;



},








// ============================================================
// REGISTRY SYNC
// ============================================================


syncRegistry(){


if(
typeof RepositoryRegistry==="undefined"
)
return;



if(
typeof RepositoryRegistry.register!=="function"
)
return;




Object.entries(
this.repositories
)
.forEach(([entity,repo])=>{


RepositoryRegistry.register(
entity,
repo
);


});



},







// ============================================================
// CRUD ANALYSIS
// ============================================================


detectCRUD(repo){


const methods=[

"create",

"findById",

"findAll",

"update",

"delete"

];



let ok=0;



methods.forEach(m=>{

if(
typeof repo[m]==="function"
)
ok++;

});



return {

available:ok,

total:methods.length,

percent:
Math.round(
ok/methods.length*100
)

};



},









// ============================================================
// ACCESS
// ============================================================


get(entity){


const repo =
this.repositories[entity];



if(!repo){


throw new Error(
"Repository not found "+
entity
);


}



return repo;


},




getByEntity(entity){

return this.get(entity);

},




has(entity){

return !!this.repositories[entity];

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
// LAZY
// ============================================================


registerLazy(
entity,
getter
){


Object.defineProperty(
this.repositories,
entity,
{

configurable:true,


get(){


const repo=
getter();



if(!repo)
throw new Error(
"Lazy repository unavailable "+
entity
);



return repo;



}



});


},







// ============================================================
// RESET
// ============================================================


reset(){


this.repositories={};

this.pending={};

this.metadata={};

this.initialized=false;



Logger.log(
"RepositoryFactory RESET"
);


},








// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){


return {


version:this.version,


initialized:this.initialized,


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


pending:Object.keys(
this.pending
)


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