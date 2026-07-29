// ============================================================
// CoreRepairTool v1.1
// ERP Auto Diagnostics Repair Assistant
// ============================================================


console.log("CoreRepairTool v1.1");


const CoreRepairTool = {


version:"1.1.0",



run(options={}){


Logger.log(
"========== CORE REPAIR START =========="
);


const report =
CoreInfrastructureTest.run();



const fixes=[];



for(const item of report.entities){


    const entity =
        item.entity;



    // ===============================
    // 1. Schema отсутствует
    // ===============================


    if(!item.schema){


        fixes.push(
            this.createSchema(entity)
        );


    }



    // ===============================
    // 2. Repository отсутствует
    // ===============================


    if(!item.repository){


        fixes.push(
            this.createRepository(entity)
        );


    }



    // ===============================
    // 3. Пустые поля
    // ===============================


    if(
      item.errors.includes(
       "Schema fields empty"
      )
    ){


        fixes.push(
          this.createMinimalFields(entity)
        );


    }


}



const result={


version:this.version,


fixed:fixes,


count:fixes.length


};



Logger.log(
JSON.stringify(result,null,2)
);



Logger.log(
"========== CORE REPAIR COMPLETE =========="
);



return result;


},





// ============================================================
// CREATE SCHEMA
// ============================================================


createSchema(entity){



try{


const meta =
EntityRegistry.get(entity);



if(!meta){

throw new Error(
"Metadata missing "+entity
);

}



SchemaRegistry.register(
entity,
{


...meta,


fields:[
{
name:meta.idField,
type:"STRING",
required:true
}
]


}
);



return {

entity,

action:"CREATE_SCHEMA",

status:"OK"

};



}
catch(e){


return {

entity,

action:"CREATE_SCHEMA",

status:"FAILED",

error:e.message

};


}


},





// ============================================================
// CREATE MINIMAL FIELDS
// ============================================================


createMinimalFields(entity){



try{


const schema =
SchemaRegistry.get(entity);



if(!schema)
throw new Error(
"Schema missing"
);



schema.fields=[

{
name:schema.idField,
type:"STRING",
required:true
},


{
name:"CreatedAt",
type:"DATE"
},


{
name:"UpdatedAt",
type:"DATE"
}


];



return {

entity,

action:"ADD_FIELDS",

status:"OK"

};



}
catch(e){


return {

entity,

action:"ADD_FIELDS",

status:"FAILED",

error:e.message

};


}


},





// ============================================================
// CREATE REPOSITORY LINK
// ============================================================


createRepository(entity){


try{


const meta =
EntityRegistry.get(entity);



if(!meta){

throw new Error(
"Metadata missing "+entity
);

}



const repository =
RepositoryFactory.get(entity);



if(
!repository
||
typeof repository.create!=="function"
||
typeof repository.findById!=="function"
){

throw new Error(
"Repository creation failed "+entity
);

}



return {


entity,

action:"REGISTER_REPOSITORY",

status:"OK",

repository:
repository.entity
||
repository.constructor?.name
||
"Repository"


};


}
catch(e){


return {


entity,

action:"REGISTER_REPOSITORY",

status:"FAILED",

error:e.message


};


}



},




// ============================================================
// HEALTH
// ============================================================


health(){


return {


module:"CoreRepairTool",

version:this.version,

status:"OK"


};


}


};




globalThis.CoreRepairTool =
CoreRepairTool;



function coreRepair(){

return CoreRepairTool.run();

}
