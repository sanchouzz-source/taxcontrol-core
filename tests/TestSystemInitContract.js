// ============================================================
// TestSystemInitContract v3.1.0
// TaxControl ERP Core
//
// Enterprise Startup Contract Test
//
// Checks:
//
// Bootstrap
// SystemInit
// Repository Layer
// Event Layer
// Service Layer
//
// No business writes
//
// ============================================================


console.log(
"TestSystemInitContract v3.1.0"
);



const TestSystemInitContract = {


version:"3.1.0",



run(){


Logger.log(
"================================================"
);



Logger.log(
"SYSTEM INIT CONTRACT TEST START"
);



Logger.log(
"================================================"
);




const result={


tests:[],


summary:{


total:0,


passed:0,


failed:0


}



};






// ========================================================
// SYSTEM
// ========================================================


this.check(

result,

"SYSTEM_INIT_EXISTS",

()=>{


if(
typeof SystemInit==="undefined"
){

throw new Error(
"SystemInit missing"
);

}


}

);








// ========================================================
// DATABASE
// ========================================================


this.check(

result,

"DATABASE_READY",

()=>{


if(
typeof Database==="undefined"
){

throw new Error(
"Database missing"
);

}



}

);








// ========================================================
// REPOSITORY
// ========================================================


this.check(

result,

"BASE_REPOSITORY_READY",

()=>{


if(
typeof BaseRepository==="undefined"
){

throw new Error(
"BaseRepository missing"
);

}


}

);







this.check(

result,

"REPOSITORY_FACTORY_READY",

()=>{


if(
typeof RepositoryFactory==="undefined"
){

throw new Error(
"RepositoryFactory missing"
);

}


}

);








this.check(

result,

"REPOSITORY_REGISTRY_READY",

()=>{


if(
typeof RepositoryRegistry==="undefined"
){

throw new Error(
"RepositoryRegistry missing"
);

}


}

);








// ========================================================
// EVENTS
// ========================================================


this.check(

result,

"EVENT_CONTRACT_READY",

()=>{


if(
typeof ERPEventContract==="undefined"
){

throw new Error(
"ERPEventContract missing"
);

}


}

);







this.check(

result,

"EVENTBUS_READY",

()=>{


if(
typeof EventBus==="undefined"
){

throw new Error(
"EventBus missing"
);

}


}

);








// ========================================================
// SERVICES
// ========================================================


this.check(

result,

"SERVICE_REGISTRY_READY",

()=>{


if(
typeof ServiceRegistry==="undefined"
){

throw new Error(
"ServiceRegistry missing"
);

}



if(
!ServiceRegistry.initialized
){

throw new Error(
"ServiceRegistry not initialized"
);

}


}

);








this.check(

result,

"CLIENT_SERVICE_READY",

()=>{


const service =

ServiceRegistry.get(
"ClientService"
);



if(
!service
){

throw new Error(
"ClientService missing"
);

}



if(
typeof service.create!=="function"
){

throw new Error(
"ClientService.create missing"
);

}


}

);









this.check(

result,

"TRANSPORT_ORDER_SERVICE_READY",

()=>{


const service =

ServiceRegistry.get(
"TransportOrderService"
);



if(
!service
){

throw new Error(
"TransportOrderService missing"
);

}



if(
typeof service.create!=="function"
){

throw new Error(
"TransportOrderService.create missing"
);

}


}

);








// ========================================================
// HEALTH
// ========================================================


this.check(

result,

"SYSTEM_HEALTH",

()=>{


const health =
SystemInit.health();



if(
health.status!=="OK"
){

throw new Error(
"System health status "
+
health.status
);

}


}

);








// ========================================================
// SUMMARY
// ========================================================


result.summary.total =
result.tests.length;



result.summary.passed =

result.tests.filter(

x=>

x.status==="PASS"

).length;





result.summary.failed =

result.tests.filter(

x=>

x.status==="FAIL"

).length;





result.status =

result.summary.failed===0

?

"PASS"

:

"FAIL";







Logger.log(

JSON.stringify(

result,

null,

2

)

);






Logger.log(
"================================================"
);



Logger.log(

"SYSTEM INIT CONTRACT TEST RESULT: "
+
result.status

);



Logger.log(
"================================================"
);



return result;


},







// ========================================================
// ASSERT
// ========================================================


check(
result,
name,
fn
){


try{


fn();



result.tests.push({


name:name,


status:"PASS"


});



Logger.log(

name+
" PASS"

);



}
catch(e){



result.tests.push({


name:name,


status:"FAIL",


error:e.message


});



Logger.error(

name+
" FAIL "
+
e.message

);



}



}



};







globalThis.TestSystemInitContract =
TestSystemInitContract;







function runSystemInitContractTest(){


return TestSystemInitContract.run();


}