// ============================================================
// CoreInfrastructureTest v2.3
// ERP Core Architecture Validation
// TaxControl ERP
// Compatible RepositoryFactory v2.5.7
// ============================================================


console.log("CoreInfrastructureTest v2.3");



const CoreInfrastructureTest = {


version:"2.3.0",



run(options={}){


const safe =
options.safe !== false;



Logger.log(
"========== CORE INFRASTRUCTURE TEST v2.3 =========="
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


components:{},


repositoryFactory:{},


entities:[],


summary:{}



};



try{



// ============================================
// COMPONENTS
// ============================================


result.components =
this.checkComponents();




// ============================================
// REPOSITORY FACTORY STATUS
// ============================================


if(
typeof RepositoryFactory!=="undefined"
){


result.repositoryFactory =
{

status:
RepositoryFactory.status?.(),

missing:
RepositoryFactory.missingRepositories?.(),

validation:
RepositoryFactory.validateAll?.()


};


}







// ============================================
// ENTITIES
// ============================================


const entities =
EntityRegistry.list();



Logger.log(
"Entities found: "+entities.length
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







// ==================================================
// COMPONENT CHECK
// ==================================================


checkComponents(){


const result={};


const components=[


"EntityRegistry",

"SchemaRegistry",

"RepositoryFactory",

"EntityService",

"Database",

"EventBus",

"SchemaManager"


];



components.forEach(name=>{


const exists =
typeof globalThis[name]!=="undefined";


result[name]=exists;



if(exists){

Logger.log(
"COMPONENT OK "+name
);

}
else{

throw new Error(
"Missing component "+name
);

}



});



return result;


},







// ==================================================
// ENTITY CHECK
// ==================================================


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



let schema=null;



try{



// =====================================
// METADATA
// =====================================


const meta =
EntityRegistry.get(entity);



if(meta){

row.metadata=true;

row.system =
meta.system===true;

}







// =====================================
// SCHEMA
// =====================================


schema =
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



if(!schema.idField){

row.errors.push(
"Missing idField"
);

}


}
else{


row.errors.push(
"Schema missing"
);


}








// =====================================
// REPOSITORY
// =====================================


try{


const repo =
RepositoryFactory.get(entity);



if(repo){

row.repository=true;

}




const meta =
RepositoryFactory.metadata?.[entity];



if(meta?.contract){


row.contract =
[
"OK",
"ADAPTED"
]
.includes(
meta.contract.status
);



}



}
catch(e){


row.errors.push(
"Repository: "+
e.message
);


}







// =====================================
// RELATIONS
// =====================================


try{


if(
schema &&
schema.relations &&
SchemaRegistry.validateRelations
){


SchemaRegistry.validateRelations(
schema.table,
{}

);


}



row.relations=true;


}
catch(e){


row.errors.push(
"Relations: "+
e.message
);


}







// =====================================
// EVENTS
// =====================================


if(
typeof EventBus!=="undefined"
){


row.events=true;


}








// =====================================
// CRUD
// =====================================


if(
row.repository &&
row.schema
){


row.crud =
this.testCrud(
entity,
schema,
safe
);


}



}
catch(e){


row.errors.push(
e.message
);


}



return row;


},







// ==================================================
// CRUD
// ==================================================


testCrud(
entity,
schema,
safe
){


try{



// FULL тест только системных таблиц

if(
schema.system
){


return this.testSystemCrud(
entity,
schema
);


}




// SAFE режим

if(safe){


const repo =
RepositoryFactory.get(entity);



return !!repo;


}



return false;



}
catch(e){


Logger.warn(
"CRUD FAILED "+
entity+
" "+
e.message
);


return false;


}



},







// ==================================================
// SYSTEM CRUD
// ==================================================


testSystemCrud(
entity,
schema
){



const id =
"TEST_"+Date.now();



const data={};



data[schema.idField]=id;



if(
schema.fields?.some(
f=>f.name==="value"
)
){

data.value=
"CORE TEST";

}



EntityService.create(
entity,
data
);



const found =
EntityService.findById(
entity,
id
);



if(!found){

throw new Error(
"READ FAILED"
);

}



EntityService.delete(
entity,
id
);



return true;


},







// ==================================================
// SUMMARY
// ==================================================


summary(rows){


return{


total:
rows.length,


metadata:
rows.filter(x=>x.metadata).length,


schema:
rows.filter(x=>x.schema).length,


repository:
rows.filter(x=>x.repository).length,


contract:
rows.filter(x=>x.contract).length,


crud:
rows.filter(x=>x.crud).length,


events:
rows.filter(x=>x.events).length,


relations:
rows.filter(x=>x.relations).length,


failed:
rows.filter(
x=>x.errors.length
).length


};


}



};





globalThis.CoreInfrastructureTest =
CoreInfrastructureTest;




function testCoreInfrastructure(options){

return CoreInfrastructureTest.run(options);

}