// ============================================================
// CoreInfrastructureTest v2.6
// ERP Core Architecture Validation
// TaxControl ERP
//
// Compatible:
//
// SystemInit v2.5+
// RepositoryFactory v2.7+
// EntityService v5+
// Database v4+
// BaseRepository v5+
// ============================================================


console.log("CoreInfrastructureTest v2.6");



const CoreInfrastructureTest = {


version:"2.6.0",




// ============================================================
// RUN
// ============================================================


run(options={}){


const safe =
options.safe !== false;



Logger.log(
"========== CORE INFRASTRUCTURE TEST v2.6 =========="
);



const result={


version:this.version,

timestamp:
new Date().toISOString(),


mode:
safe
?
"SAFE"
:
"FULL",



bootstrap:{},

systemInit:{},

components:{},

database:{},

repositories:{},

entities:[],

summary:{}



};



try{


result.bootstrap =
this.checkBootstrap();



result.systemInit =
this.checkSystemInit();



result.components =
this.checkComponents();



result.database =
this.checkDatabase();



result.repositories =
this.checkRepositoryFactory();



if(
typeof EntityRegistry==="undefined"
){

throw new Error(
"EntityRegistry unavailable"
);

}



EntityRegistry.list()
.forEach(entity=>{


result.entities.push(

this.checkEntity(
entity,
safe
)

);


});



result.summary =
this.summary(
result.entities
);



Logger.log(

JSON.stringify(
result,
null,
2
)

);



Logger.log(
"========== CORE TEST COMPLETE =========="
);



return result;



}
catch(e){


Logger.error(
"CORE TEST FAILED "+
e.message
);


throw e;


}



},







// ============================================================
// BOOTSTRAP
// ============================================================


checkBootstrap(){


return {


exists:
typeof Bootstrap!=="undefined",


started:
typeof Bootstrap!=="undefined"
&&
Bootstrap.started===true,


starting:
typeof Bootstrap!=="undefined"
&&
Bootstrap.starting===true



};


},







// ============================================================
// SYSTEM INIT
// ============================================================


checkSystemInit(){


if(
typeof SystemInit==="undefined"
){

return {
exists:false
};

}



return {


exists:true,


version:
SystemInit.version,


initialized:
SystemInit.initialized,


components:
Object.keys(
SystemInit.started||{}
),


failed:
SystemInit.bootLog
?
SystemInit.bootLog.filter(
x=>x.status==="FAILED"
)
:
[]


};


},







// ============================================================
// COMPONENTS
// ============================================================


checkComponents(){


const list=[


"EntityRegistry",

"SchemaRegistry",

"SchemaManager",

"Database",

"SpreadsheetAdapter",

"BaseRepository",

"RepositoryFactory",

"EntityService",

"EventBus",

"HealthContract"


];



const result={};



list.forEach(name=>{


result[name]=
typeof globalThis[name]!=="undefined";


});



return result;


},







// ============================================================
// DATABASE
// ============================================================


checkDatabase(){


if(
typeof Database==="undefined"
){

return {
exists:false
};

}



return {


exists:true,


version:
Database.version,


initialized:
Database.initialized,


status:
Database.status,


adapter:
Database.adapterName
?
Database.adapterName()
:
null



};


},







// ============================================================
// REPOSITORY FACTORY
// ============================================================


checkRepositoryFactory(){


if(
typeof RepositoryFactory==="undefined"
){

return {
exists:false
};

}



const entities =
typeof EntityRegistry!=="undefined"
?
EntityRegistry.list()
:
[];



const loaded =
RepositoryFactory.list();



return {


exists:true,


version:
RepositoryFactory.version,


initialized:
RepositoryFactory.initialized,


loaded:
loaded.length,


entities:
entities.length,


coverage:
entities.length
?
Math.round(
loaded.length/entities.length*100
)
:
0,


repositories:
loaded,


metadata:
RepositoryFactory.metadata,


pending:
RepositoryFactory.pending,


health:
RepositoryFactory.health
?
RepositoryFactory.health()
:
null



};


},







// ============================================================
// ENTITY
// ============================================================


checkEntity(entity,safe){



const row={


entity,


system:false,


metadata:false,


schema:false,


repository:false,


repositoryType:null,


contract:false,


crud:false,


events:false,


relations:false,


warnings:[],


errors:[]

};




try{



const meta =
EntityRegistry.get(entity);



if(meta){


row.metadata=true;


row.system =
meta.system===true
||
entity.startsWith("__TEST_");


}






// SCHEMA

try{


const schema =
SchemaRegistry.get(entity);



if(schema){


row.schema=true;


row.relations=
!!schema.relations;


}



}
catch(e){


row.warnings.push(
"Schema missing"
);


}







// REPOSITORY


try{


const repo =
RepositoryFactory.get(entity);



if(repo){


row.repository=true;



const info =
RepositoryFactory.metadata?.[entity];



if(info){


row.repositoryType =
info.type;


row.contract =
info.contract?.status==="OK"
||
info.contract?.status==="WARNING";


}



}



}
catch(e){


if(!row.system){

row.errors.push(
"Repository "+
e.message
);

}


}







// EVENTS


row.events =
typeof EventBus!=="undefined";







// CRUD


if(
row.repository
&&
row.contract
){


row.crud =
safe
?
true
:
this.testCrud(entity);


}



}
catch(e){


row.errors.push(
e.message
);


}



return row;


},







// ============================================================
// CRUD
// ============================================================


testCrud(entity){


try{


const repo =
RepositoryFactory.get(entity);



return [

"create",

"findById",

"findAll",

"update",

"delete",

"restore",

"exists"


]
.every(
m=>
typeof repo[m]==="function"
);



}
catch(e){

return false;

}


},







// ============================================================
// SUMMARY
// ============================================================


summary(rows){


return {


total:
rows.length,


metadata:
rows.filter(
x=>x.metadata
)
.length,


schema:
rows.filter(
x=>x.schema
)
.length,


repository:
rows.filter(
x=>x.repository
)
.length,


contract:
rows.filter(
x=>x.contract
)
.length,


crud:
rows.filter(
x=>x.crud
)
.length,


baseRepositories:
rows.filter(
x=>x.repositoryType==="BASE"
)
.length,


customRepositories:
rows.filter(
x=>x.repositoryType==="CUSTOM"
)
.length,


events:
rows.filter(
x=>x.events
)
.length,


warnings:
rows.filter(
x=>x.warnings.length
)
.length,


failed:
rows.filter(
x=>x.errors.length
)
.length



};


},







// ============================================================
// HEALTH
// ============================================================


health(){


const result =
this.run({
safe:true
});



return HealthContract.create(

"CoreInfrastructureTest",

result.summary.failed===0
?
"OK"
:
"WARNING",

result

);


}



};





globalThis.CoreInfrastructureTest =
CoreInfrastructureTest;



globalThis.testCoreInfrastructure =
function(){

return CoreInfrastructureTest.run();

};



Logger.log(
"CoreInfrastructureTest READY v"+
CoreInfrastructureTest.version
);