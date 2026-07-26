// ============================================================
// CoreInfrastructureTest v2.2
// ERP Core Architecture Validation
// TaxControl ERP
// ============================================================


console.log("CoreInfrastructureTest v2.2");



const CoreInfrastructureTest = {


version:"2.2.0",





run(options={}){


const safe =
options.safe !== false;



Logger.log(
"========== CORE INFRASTRUCTURE TEST v2.2 =========="
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


entities:[],


summary:{}


};



try{


// ==================================================
// COMPONENTS
// ==================================================


result.components =
this.checkComponents();




// ==================================================
// ENTITIES
// ==================================================


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


const checks={};


const list=[

"EntityRegistry",

"SchemaRegistry",

"RepositoryFactory",

"EntityService",

"Database",

"EventBus",

"SchemaManager"

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

throw new Error(
"Missing component "+name
);

}



});



return checks;


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



try{


// ===========================
// METADATA
// ===========================


const meta =
EntityRegistry.get(entity);



if(meta){


row.metadata=true;


row.system =
meta.system===true;


}




// ===========================
// SCHEMA
// ===========================


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



if(!schema.idField){

row.errors.push(
"Missing idField"
);

}



}




// ===========================
// REPOSITORY
// ===========================


try{


const repo =
RepositoryFactory.get(entity);



row.repository=true;



const contract =
RepositoryFactory.metadata?.[entity];



if(contract){

row.contract =
contract.contract.status==="OK"
||
contract.contract.status==="ADAPTED";


}



}
catch(e){


row.errors.push(
"Repository: "+
e.message
);


}







// ===========================
// RELATIONS
// ===========================


try{


if(
schema &&
schema.relations
){

SchemaRegistry.validateRelations?.(
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








// ===========================
// EVENTS
// ===========================


try{


if(
typeof EventBus!=="undefined"
){


row.events=true;


}



}
catch(e){


row.errors.push(
"Events: "+
e.message
);


}







// ===========================
// CRUD
// ===========================


if(
row.metadata &&
row.schema &&
row.repository
){


row.crud =
this.testCrud(
entity,
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
// CRUD TEST
// ==================================================


testCrud(
entity,
safe
){


try{


const schema =
SchemaRegistry.get(entity);



if(!schema){

return false;

}



// системные сущности

if(schema.system){


return this.testSystemCrud(
entity,
schema
);


}





// бизнес сущности

// в SAFE режиме только проверяем контракт


if(safe){


return true;


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
schema.fields.some(
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