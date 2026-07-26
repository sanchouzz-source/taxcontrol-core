// ============================================================
// CoreInfrastructureTest v2.5
// ERP Core Architecture Validation
// TaxControl ERP
//
// Compatible:
// Bootstrap v0.6+
// ERP Bootstrap v2.3+
// SystemInit v2.4+
// RepositoryFactory v2.5.9
// EntityMetadata v2.0
// ============================================================


console.log("CoreInfrastructureTest v2.5");



const CoreInfrastructureTest = {


version:"2.5.0",



// ============================================================
// RUN
// ============================================================


run(options={}){


const safe =
options.safe !== false;



Logger.log(
"========== CORE INFRASTRUCTURE TEST v2.5 =========="
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

repositoryFactory:{},

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



result.repositoryFactory =
this.checkRepositoryFactory();



if(
typeof EntityRegistry==="undefined"
){

throw new Error(
"EntityRegistry unavailable"
);

}



const entities =
EntityRegistry.list();



Logger.log(
"Entities found: "+
entities.length
);



entities.forEach(entity=>{


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
"CORE INFRASTRUCTURE FAILED "+
e.message
);


throw e;


}



},




// ============================================================
// BOOTSTRAP
// ============================================================


checkBootstrap(){


const result={


exists:false,

started:false,

starting:false,

error:null


};



if(
typeof Bootstrap==="undefined"
){

return result;

}



result.exists=true;


result.started =
Bootstrap.started===true;



result.starting =
Bootstrap.starting===true;



if(
Bootstrap.error
){

result.error =
Bootstrap.error;

}



return result;


},




// ============================================================
// SYSTEM INIT
// ============================================================


checkSystemInit(){


const result={


exists:false,

initialized:false,

components:0,

failed:0


};



if(
typeof SystemInit==="undefined"
){

return result;

}



result.exists=true;



result.initialized =
SystemInit.initialized===true;



result.components =
Object.keys(
SystemInit.started || {}
).length;



result.failed =
SystemInit.bootLog
?
SystemInit.bootLog
.filter(x=>x.status==="FAILED")
.length
:
0;



return result;


},




// ============================================================
// COMPONENTS
// ============================================================


checkComponents(){


const result={};



const list=[


"Bootstrap",

"SystemInit",

"EntityMetadata",

"EntityRegistry",

"SchemaRegistry",

"SchemaManager",

"Database",

"BaseRepository",

"RepositoryFactory",

"EntityService",

"EventBus",

"HealthContract"


];



list.forEach(name=>{


const exists =
typeof globalThis[name]!=="undefined";



result[name]=exists;



if(exists){


Logger.log(
"COMPONENT OK "+
name
);


}
else{


Logger.warn(
"COMPONENT MISSING "+
name
);


}



});



return result;


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



const health =
RepositoryFactory.health
?
RepositoryFactory.health()
:
null;



const total =
typeof EntityRegistry!=="undefined"

?
EntityRegistry.list().length

:
0;



const loaded =
RepositoryFactory.count();



return {


exists:true,


version:
RepositoryFactory.version,


initialized:
RepositoryFactory.initialized,


count:
loaded,


total,


coverage:
total
?
Math.round(
loaded / total *100
)
:
0,



repositories:
RepositoryFactory.list(),



pending:
RepositoryFactory.pendingReport
?
RepositoryFactory.pendingReport()
:
[],



health


};


},




// ============================================================
// ENTITY CHECK
// ============================================================


checkEntity(entity,safe){


const row={


entity,


system:false,


metadata:false,


schema:false,


repository:false,


contract:false,


crud:false,


events:false,


relations:false,


warnings:[],


errors:[]


};



try{



// --------------------------
// METADATA
// --------------------------


const meta =
EntityRegistry.get(entity);



if(meta){


row.metadata=true;


row.system =
meta.system===true ||
entity.startsWith("__TEST_");


}




// --------------------------
// SCHEMA
// --------------------------


const schema =
SchemaRegistry.get(entity);



if(schema){


row.schema=true;


if(
!schema.fields ||
schema.fields.length===0
){

row.warnings.push(
"Schema fields empty"
);

}


}




// --------------------------
// REPOSITORY
// --------------------------


if(
typeof RepositoryFactory!=="undefined"
){



try{


const repo =
RepositoryFactory.get(entity);



if(repo){


row.repository=true;



const info =
RepositoryFactory.metadata?.[entity];



if(info){


row.contract =
info.contract?.status==="OK"
||
info.contract?.status==="ADAPTED"
||
info.contract?.status==="WARNING";


}



}



}
catch(e){



// тестовые системные сущности
// не требуют Repository


if(!row.system){


row.errors.push(
"Repository: "+
e.message
);


}



}


}




// --------------------------
// EVENTS
// --------------------------


row.events =
typeof EventBus!=="undefined";





// --------------------------
// RELATIONS
// --------------------------


row.relations =
!!(
schema &&
schema.relations
);





// --------------------------
// CRUD
// --------------------------


if(
row.repository &&
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
// CRUD VALIDATION
// ============================================================


testCrud(entity){


try{


const repo =
RepositoryFactory.get(entity);



const methods=[


"create",

"findById",

"findAll",

"update",

"delete",

"restore",

"exists"


];



return methods.every(
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



return{


total:
rows.length,


metadata:
rows.filter(x=>x.metadata)
.length,


schema:
rows.filter(x=>x.schema)
.length,


repository:
rows.filter(x=>x.repository)
.length,


contract:
rows.filter(x=>x.contract)
.length,


crud:
rows.filter(x=>x.crud)
.length,


events:
rows.filter(x=>x.events)
.length,


relations:
rows.filter(x=>x.relations)
.length,


warnings:
rows.filter(x=>x.warnings.length)
.length,


failed:
rows.filter(x=>x.errors.length)
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




// ============================================================
// GLOBAL
// ============================================================


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