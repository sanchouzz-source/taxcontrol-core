console.log("SystemStartupTest");


function testStartup(){

    Logger.log(
        "===== STARTUP TEST ====="
    );


    SystemInit.init();


    const health =
        HealthService.checkAll();


    Logger.log(
        JSON.stringify(
            health,
            null,
            2
        )
    );


    Logger.log(
        "===== TEST END ====="
    );

}