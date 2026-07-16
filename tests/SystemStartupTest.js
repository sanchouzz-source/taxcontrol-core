console.log("SystemStartupTest");


const SystemStartupTest = {


version:"0.6.0",



fullHealth(){


Logger.log(
"========== FULL SYSTEM HEALTH TEST =========="
);



Logger.log(
"STEP 1: BOOT SYSTEM"
);



Bootstrap.start();





Logger.log(
"STEP 2: CORE HEALTH"
);



const health =
HealthService.full();



Logger.log(
JSON.stringify(
health,
null,
2
)
);





Logger.log(
"STEP 3: INSPECTOR"
);



const report =
Inspector.inspect();



Logger.log(
JSON.stringify(
report,
null,
2
)
);





Logger.log(
"STEP 4: ENTITY SERVICE CHECK"
);



if(globalThis.EntityService){


Logger.log(
"EntityService AVAILABLE"
);


}
else{


Logger.error(
"EntityService MISSING"
);


}







Logger.log(
"STEP 5: DATA REPAIR CHECK"
);



const repair =
DataRepair.fixClients();



Logger.log(
JSON.stringify(
repair,
null,
2
)
);







Logger.log(
"========== SYSTEM TEST COMPLETE =========="
);



return {


health,


report,


repair



};



}





};






function testDataRepair(){



Logger.log(
"===== DATA REPAIR TEST ====="
);



const result =
DataRepair.scan(
"Clients"
);



Logger.log(
JSON.stringify(
result,
null,
2
)
);



return result;


}







function testEntityServiceBoot(){



Logger.log(
"===== ENTITY SERVICE BOOT TEST ====="
);



Bootstrap.start();



const service =
globalThis.EntityService;



if(!service){


throw new Error(
"EntityService not loaded"
);


}



Logger.log(
JSON.stringify(
service.health(),
null,
2
)
);



Logger.log(
"ENTITY SERVICE READY"
);



}







globalThis.SystemStartupTest =
SystemStartupTest;