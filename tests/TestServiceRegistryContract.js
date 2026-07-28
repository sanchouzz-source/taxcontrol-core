// ============================================================
// TestServiceRegistryContract v1.0.0
// TaxControl ERP
//
// Checks:
//
// ServiceRegistry
// ClientService
// TransportOrderService
//
// No database writes
// ============================================================


console.log(
"TestServiceRegistryContract v1.0.0"
);



const TestServiceRegistryContract = {


version:"1.0.0",



run(){


Logger.log(
"===== SERVICE REGISTRY TEST START ====="
);



const result={

tests:[],
summary:{
total:0,
passed:0,
failed:0
}

};



this.check(
result,
"SERVICE_REGISTRY_EXISTS",
()=>{

if(
typeof ServiceRegistry==="undefined"
){

throw new Error(
"ServiceRegistry missing"
);

}

}
);



this.check(
result,
"CLIENT_SERVICE_EXISTS",
()=>{

const service =
ServiceRegistry.get(
"ClientService"
);


if(!service){

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
"TRANSPORT_ORDER_SERVICE_EXISTS",
()=>{


const service =
ServiceRegistry.get(
"TransportOrderService"
);



if(!service){

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






this.check(
result,
"SERVICE_HEALTH",
()=>{


const services =
ServiceRegistry.list();



services.forEach(name=>{


const service =
ServiceRegistry.get(name);



if(
service.health
){

const health =
service.health();



if(
health.status!=="OK"
){

throw new Error(

name+
" health failed"

);

}


}



});


}
);






result.summary.total =
result.tests.length;


result.summary.passed =
result.tests.filter(
x=>x.status==="PASS"
).length;



result.summary.failed =
result.tests.filter(
x=>x.status==="FAIL"
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



return result;



},




check(result,name,fn){


try{


fn();


result.tests.push({

name:name,

status:"PASS"

});


Logger.log(
name+" PASS"
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
" FAIL "+
e.message
);



}


}



};





globalThis.TestServiceRegistryContract =
TestServiceRegistryContract;



function runServiceRegistryContractTest(){


return TestServiceRegistryContract.run();


}