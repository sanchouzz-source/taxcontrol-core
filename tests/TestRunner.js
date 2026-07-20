console.log("TestRunner");



const TestRunner={



version:"1.0.0",



runAll(){


Logger.log(
"========== TEST RUNNER START =========="
);



const result={};



try{


result.EntityLifecycle =
TestEntityLifecycleMatrix.run();



Logger.log(
"ENTITY TEST PASS"
);



}
catch(e){


Logger.error(
"ENTITY TEST FAIL "
+
e.message
);



result.error=e.message;


}



Logger.log(
"========== TEST RUNNER COMPLETE =========="
);



return result;



}



};




globalThis.TestRunner =
TestRunner;




function runTests(){


return TestRunner.runAll();


}