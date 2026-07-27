// ============================================================
// TestCommands v1.0.0
// ERP Test Execution Commands
// TaxControl ERP Core
//
// Commands:
//
// runTests()
// runTestsSafe()
// runTestsFull()
// testReport()
//
// Compatible:
// TestRunner v2.1+
// SystemInit v2.7+
// ============================================================


console.log("TestCommands v1.0.0");



const TestCommands = {



version:"1.0.0",





// ============================================================
// MAIN TEST RUN
// ============================================================


run(options={}){


Logger.log(
"========== ERP TEST EXECUTION START =========="
);



try{


// Проверяем запуск ERP

if(
typeof SystemInit!=="undefined"
&&
!SystemInit.initialized
){


Logger.warn(
"ERP not initialized. Starting..."
);



SystemInit.init();


}





if(
typeof TestRunner==="undefined"
){

throw new Error(
"TestRunner unavailable"
);

}



const result =
TestRunner.runAll(options);



Logger.log(
"========== ERP TEST EXECUTION COMPLETE =========="
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
catch(e){


Logger.error(
"TEST EXECUTION FAILED "+
e.message
);


return {


status:"FAILED",

error:e.message


};


}



},







// ============================================================
// SAFE MODE
// ============================================================


runSafe(){


return this.run({

safe:true

});


},







// ============================================================
// FULL MODE
// ============================================================


runFull(){


return this.run({

safe:false

});


},







// ============================================================
// SHORT REPORT
// ============================================================


report(){



const result =
this.runSafe();



return {


status:
result.status,


summary:
result.summary,


failed:
Object.entries(
result.tests || {}
)
.filter(
x=>x[1].status==="FAIL"
)
.map(
x=>x[0]
)


};



}



};







// ============================================================
// GLOBAL COMMANDS
// ============================================================


globalThis.runTests =
function(){

return TestCommands.runSafe();

};



globalThis.runTestsFull =
function(){

return TestCommands.runFull();

};



globalThis.testReport =
function(){

return TestCommands.report();

};






Logger.log(
"TestCommands READY v"+
TestCommands.version
);



Logger.log(
"COMMANDS:"
);



Logger.log(
" runTests()"
);



Logger.log(
" runTestsFull()"
);



Logger.log(
" testReport()"
);