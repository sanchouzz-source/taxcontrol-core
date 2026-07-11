console.log("SystemStartupTest");


function testFullHealth(){


    Logger.log(
        "===== FULL SYSTEM HEALTH TEST ====="
    );


    Logger.log(
        "STEP 1: INIT"
    );


    SystemInit.init();



    Logger.log(
        "STEP 2: INSPECTOR START"
    );


    const report =
        Inspector.inspect();



    Logger.log(
        "STEP 3: REPORT CREATED"
    );


    Logger.log(
        JSON.stringify(
            report,
            null,
            2
        )
    );



    Logger.log(
        "===== TEST COMPLETE ====="
    );

}