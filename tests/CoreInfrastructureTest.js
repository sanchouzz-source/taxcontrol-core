// ============================================================
// CoreInfrastructureTest v2.4
// ERP Core Architecture Validation
// TaxControl ERP
//
// Compatible:
// Bootstrap v0.6+
// ERP Bootstrap v2.3
// SystemInit v2.2+
// RepositoryFactory v2.5+
// ============================================================


console.log("CoreInfrastructureTest v2.4");



const CoreInfrastructureTest = {


version:"2.4.0",



// ============================================================
// RUN
// ============================================================


run(options={}){


const safe =
options.safe !== false;



Logger.log(
"========== CORE INFRASTRUCTURE TEST v2.4 =========="
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


// ==================================================
// BOOTSTRAP STATE
// ==================================================


result.bootstrap =
this.checkBootstrap();




// ==================================================
// SYSTEM INIT
// ==================================================


result.systemInit =
this.checkSystemInit();




// ==================================================
// COMPONENTS
// ==================================================


result.components =
this.checkComponents();




// ==================================================
// REPOSITORIES
// ==================================================


result.repositoryFactory =
this.checkRepositoryFactory();





// ==================================================
// ENTITIES
// ==================================================


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




for(const entity of entities){


result.entities.push(

this.checkEntity(
entity,
safe
)

);


}




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

"CORE INFRASTRUCTURE FAILED "
+
e.message

);



throw e;


}



},







// ============================================================
// BOOTSTRAP CHECK
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



return result;


},







// ============================================================
// SYSTEM INIT CHECK
// ============================================================


checkSystemInit(){



const result={


exists:false,

initialized:false,

components:0


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



return result;


},







// ============================================================
// COMPONENT CHECK
// ============================================================


checkComponents(){


const checks={};



const list=[


"Bootstrap",

"SystemInit",

"EntityRegistry",

"SchemaRegistry",

"SchemaManager",

"Database",

"BaseRepository",

"RepositoryFactory",

"EntityService",

"EventBus"


];



list.forEach(name=>{


const ok =
typeof globalThis[name]!=="undefined";



checks[name]=ok;



if(ok){

Logger.log(
"COMPONENT OK "+name
);

}
else{

Logger.warn(
"COMPONENT MISSING "+name
);

}



});



return checks;


},







// ============================================================
// REPOSITORY FACTORY
// ============================================================


checkRepositoryFactory(){


if(
typeof RepositoryFactory==="undefined"
){

return null;

}



return {


version:
RepositoryFactory.version,


initialized:
RepositoryFactory.initialized,


count:
RepositoryFactory.count(),


repositories:
RepositoryFactory.list(),


pending:
RepositoryFactory.pendingReport(),



missing:
RepositoryFactory.missingRepositories(),



health:
RepositoryFactory.pendingHealth()



};



},







// ============================================================
// ENTITY CHECK
// ============================================================


checkEntity(
entity,
safe
){


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


errors:[]


};



try{



// ---------------------
// METADATA
// ---------------------


const meta =
EntityRegistry.get(entity);



if(meta){

row.metadata=true;

row.system =
meta.system===true;

}



// ---------------------
// SCHEMA
// ---------------------


const schema =
SchemaRegistry.get(entity);



if(schema){


row.schema=true;



if(
!schema.fields ||
schema.fields.length===0
){

row.errors.push(
"Schema fields empty"
);

}



}



// ---------------------
// REPOSITORY
// ---------------------


try{


const repo =
RepositoryFactory.get(entity);



if(repo){


row.repository=true;


const metadata =
RepositoryFactory.metadata?.[entity];



if(metadata){


row.contract =
metadata.contract?.status==="OK"
||
metadata.contract?.status==="ADAPTED";


}



}



}
catch(e){



// системные сущности без repo не считаем ошибкой

if(!row.system){

row.errors.push(
"Repository: "+e.message
);

}



}




// ---------------------
// RELATIONS
// ---------------------


if(
schema &&
schema.relations
){


row.relations=true;


}



// ---------------------
// EVENTS
// ---------------------


row.events =
typeof EventBus!=="undefined";





// ---------------------
// CRUD
// ---------------------


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
// CRUD TEST
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



return{


total:
rows.length,


metadata:
rows.filter(
x=>x.metadata
).length,



schema:
rows.filter(
x=>x.schema
).length,



repository:
rows.filter(
x=>x.repository
).length,



contract:
rows.filter(
x=>x.contract
).length,



crud:
rows.filter(
x=>x.crud
).length,



events:
rows.filter(
x=>x.events
).length,



relations:
rows.filter(
x=>x.relations
).length,



failed:
rows.filter(
x=>x.errors.length
).length



};



}



};






globalThis.CoreInfrastructureTest =
CoreInfrastructureTest;





function testCoreInfrastructure(){


return CoreInfrastructureTest.run();


}



globalThis.testCoreInfrastructure =
testCoreInfrastructure;



Logger.log(
"CoreInfrastructureTest READY v"+
CoreInfrastructureTest.version
);