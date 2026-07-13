console.log("SystemStartupTest");


const SystemStartupTest={



fullHealth(){



Logger.log(
"===== FULL SYSTEM HEALTH TEST ====="
);



Logger.log(
"STEP 1: BOOT"
);



Bootstrap.start();



Logger.log(
"STEP 2: INSPECTOR"
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
DataRepair.fixClients()
);


Logger.log(
"===== TEST COMPLETE ====="
);



return report;



}



};



globalThis.SystemStartupTest =
SystemStartupTest;