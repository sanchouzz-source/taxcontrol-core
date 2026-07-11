console.log("SystemStartupTest");


function testFullHealth(){


    Logger.log(
        "===== FULL SYSTEM HEALTH TEST ====="
    );


    SystemInit.init();


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
        "===== TEST COMPLETE ====="
    );


}