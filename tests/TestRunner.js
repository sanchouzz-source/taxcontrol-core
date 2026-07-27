// ============================================================
// TestRunner v2.1.0
// ERP Enterprise Test Orchestrator
// TaxControl ERP Core
//
// Compatible:
//
// CoreInfrastructureTest v2.6+
// ERPDiagnostics v4.1+
// TestEntityLifecycleMatrix v2.2+
// EntityService v5+
// RepositoryFactory v2.6+
// ============================================================


console.log("TestRunner v2.1.0");



const TestRunner = {


version:"2.1.0",



tests:[


{
name:"CoreInfrastructure",
type:"object",
target:"CoreInfrastructureTest"
},



{
name:"EntityLifecycleMatrix",
type:"object",
target:"TestEntityLifecycleMatrix"
},



{
name:"ERPDiagnostics",
type:"object",
target:"ERPDiagnostics"
},



{
name:"EntityService",
type:"function",
target:"testEntityService"
},



{
name:"FullEntityLifecycle",
type:"function",
target:"testFullEntityLifecycle"
},



{
name:"AuditCRUD",
type:"function",
target:"testAuditCRUD"
}



],







// ============================================================
// RUN ALL
// ============================================================


runAll(options={}){


const safe =
options.safe !== false;



Logger.log(
"========== TEST RUNNER v2.1 START =========="
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


tests:{},


summary:{


total:0,

passed:0,

failed:0,

skipped:0


},


status:"UNKNOWN"



};






for(const test of this.tests){


result.summary.total++;


const output =
this.executeTest(
test,
safe
);



result.tests[test.name]=output;



switch(output.status){


case "PASS":

result.summary.passed++;

break;


case "FAIL":

result.summary.failed++;

break;


case "SKIPPED":

result.summary.skipped++;

break;


}



}







result.status =
this.calculateStatus(
result.summary
);






Logger.log(
JSON.stringify(
result,
null,
2
)
);



Logger.log(
"========== TEST RUNNER COMPLETE =========="
);



return result;



},







// ============================================================
// EXECUTE TEST
// ============================================================


executeTest(test,safe){



const start =
Date.now();



Logger.log(
"RUN TEST "+
test.name
);



try{


let target =
globalThis[test.target];



if(!target){


return {


status:"SKIPPED",


reason:
"NOT FOUND",


duration:
Date.now()-start


};


}





let output;





// object runner

if(
typeof target==="object"
&&
typeof target.run==="function"
){


output =
target.run(
{
safe
}
);


}






// function runner

else if(
typeof target==="function"
){


output =
target();


}

else{


return {


status:"SKIPPED",


reason:
"NO EXECUTOR",


duration:
Date.now()-start


};


}







// анализ результата


if(
output
&&
output.status
&&
(
output.status==="FAIL"
||
output.status==="FAILED"
)

){


return {


status:"FAIL",

duration:
Date.now()-start,

result:output


};


}







return {


status:"PASS",


duration:
Date.now()-start,


result:output


};





}
catch(e){


Logger.error(

"TEST FAILED "+
test.name+
" "+
e.message

);



return {


status:"FAIL",


duration:
Date.now()-start,


error:e.message


};


}



},







// ============================================================
// STATUS
// ============================================================


calculateStatus(summary){


if(
summary.failed===0
){

return "PASS";

}



if(
summary.passed>0
){

return "WARNING";

}



return "FAILED";


},







// ============================================================
// HEALTH
// ============================================================


health(){


const available =
this.tests.filter(t=>

typeof globalThis[t.target]!=="undefined"

)
.map(t=>t.name);



return HealthContract.create(

"TestRunner",

"OK",

{


version:this.version,


registeredTests:
this.tests.length,


availableTests:
available,


missing:
this.tests
.filter(
t=>
typeof globalThis[t.target]==="undefined"
)
.map(t=>t.name)



}


);


},







// ============================================================
// QUICK TEST
// ============================================================


quick(){


return this.runAll(
{
safe:true
}
);


}



};






globalThis.TestRunner =
TestRunner;



globalThis.runTests =
function(options={}){


return TestRunner.runAll(options);


};





globalThis.testHealth =
function(){

return TestRunner.health();

};





Logger.log(
"TestRunner READY v"+
TestRunner.version
);


Logger.log(
"COMMANDS:"
);


Logger.log(
" runTests()"
);


Logger.log(
" testHealth()"
);