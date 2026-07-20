console.log("TestEntityLifecycleMatrix");


const TestEntityLifecycleMatrix = {


version:"1.0.0",



runEntity(entityName, repository, data){


Logger.log(
"========== TEST ENTITY "+entityName+" =========="
);



let created;



try{


// CREATE

Logger.log(
"CREATE "+entityName
);


created =
EntityService.create(
entityName,
data
);



if(!created){

throw new Error(
"CREATE FAILED"
);

}


Logger.log(
"CREATE OK "+
JSON.stringify(created)
);





// READ

Logger.log(
"READ "+entityName
);


const id =
created.ID ||
created.ClientID ||
created.TripID ||
created.KPIID;



const read =
EntityService.get(
entityName,
id
);



if(!read){

throw new Error(
"READ FAILED"
);

}


Logger.log(
"READ OK"
);





// UPDATE


Logger.log(
"UPDATE "+entityName
);



const updateData =
{
...data,
UpdatedBy:"TEST"
};



const updated =
EntityService.update(
entityName,
id,
updateData
);



if(!updated){

throw new Error(
"UPDATE FAILED"
);

}



Logger.log(
"UPDATE OK"
);





// DELETE


Logger.log(
"DELETE "+entityName
);



const deleted =
EntityService.delete(
entityName,
id
);



if(!deleted){

throw new Error(
"DELETE FAILED"
);

}



Logger.log(
"DELETE OK"
);






// RESTORE


if(EntityService.restore){


Logger.log(
"RESTORE "+entityName
);



const restored =
EntityService.restore(
entityName,
id
);



if(restored){

Logger.log(
"RESTORE OK"
);

}

}



Logger.log(
"ENTITY TEST SUCCESS "+entityName
);



return true;



}
catch(e){


Logger.error(
"ENTITY TEST FAILED "+
entityName+
" : "+
e.message
);



return false;


}




}

};






globalThis.TestEntityLifecycleMatrix =
TestEntityLifecycleMatrix;


Logger.log(
"TestEntityLifecycleMatrix READY v1.0.0"
);