console.log("TestRunner");



function testEntityLifecycleMatrix(){


Logger.log(
"========== ENTITY MATRIX START =========="
);





// =====================
// SYSTEM BOOT
// =====================


Logger.log(
"SYSTEM BOOT"
);



if(
typeof Bootstrap !== "undefined"
){


Bootstrap.start();


}
else{


throw new Error(
"Bootstrap missing"
);


}



Logger.log(
"ERP SYSTEM READY"
);





// =====================
// MATRIX
// =====================



const MATRIX = [



{

entity:"CLIENT",

repository:"ClientRepository",

data:{

Name:"Matrix Client",

INN:"7777777777",

Phone:"+79990000001",

Email:"matrix@test.ru",

Status:"ACTIVE"

}

},





{

entity:"TRIP",

repository:"TripRepository",

data:{

ClientID:"CLI000001",

Status:"NEW",

Destination:"TEST"

}

},





{

entity:"KPI",

repository:"KPIRepository",

data:{

Name:"Matrix KPI",

Value:100,

Category:"TEST"

}

}



];






let success = true;





for(
const item of MATRIX
){



Logger.log(
"RUN "+item.entity
);





const repo =
globalThis[item.repository];




if(!repo){


Logger.warn(
"Repository missing "+
item.repository
);


continue;


}




const result =
TestEntityLifecycleMatrix.runEntity(
item.entity,
repo,
item.data
);




if(!result){

success=false;

}



}





if(success){


Logger.log(
"========== ENTITY MATRIX SUCCESS =========="
);


}
else{


Logger.error(
"========== ENTITY MATRIX FAILED =========="
);


}



return success;



}




globalThis.testEntityLifecycleMatrix =
testEntityLifecycleMatrix;



Logger.log(
"testEntityLifecycleMatrix READY"
);