console.log("TestRunner");



function testEntityLifecycleMatrix(){


Logger.log(
"START ENTITY LIFECYCLE MATRIX TEST"
);



if(
typeof TestEntityLifecycleMatrix==="undefined"
){


throw new Error(
"TestEntityLifecycleMatrix not loaded"
);


}




return TestEntityLifecycleMatrix.run();



}



globalThis.testEntityLifecycleMatrix =
testEntityLifecycleMatrix;



Logger.log(
"testEntityLifecycleMatrix READY"
);