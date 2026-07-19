function getEntityId(entityName,data){


const map={

CLIENT:"ClientID",
TRIP:"TripID",
KPI:"KPIID",
CLIENT_FINANCE_PROFILE:"ProfileID",
FINANCIAL_TRANSACTION:"TransactionID"

};


return data[map[entityName]];


}



const TestEntityLifecycleMatrix = {


run(entityName, repository, testData){


Logger.log(
"===== ENTITY TEST START: "
+entityName+
" ====="
);



const created =
repository.create(testData);



if(!created){

throw new Error(
entityName+" CREATE FAILED"
);

}



Logger.log("CREATE OK");



const id =
getEntityId(
entityName,
created
);



const read =
repository.findById(id);



if(!read){

throw new Error(
entityName+" READ FAILED"
);

}


Logger.log("READ OK");



const updated =
repository.update(
id,
{
TestField:"UPDATED"
}
);



if(!updated){

throw new Error(
entityName+" UPDATE FAILED"
);

}


Logger.log("UPDATE OK");



repository.delete(id);



const deleted =
repository.findById(id);



if(deleted){

throw new Error(
entityName+" DELETE FAILED"
);

}


Logger.log("DELETE OK");



repository.restore(id);



const restored =
repository.findById(id);



if(!restored){

throw new Error(
entityName+" RESTORE FAILED"
);

}


Logger.log("RESTORE OK");



Logger.log(
"===== ENTITY TEST SUCCESS: "
+entityName+
" ====="
);



return true;


}


};

