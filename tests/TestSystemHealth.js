function testFullSystemHealth(){


    Logger.log(
        "===== FULL SYSTEM HEALTH TEST ====="
    );


    SystemInit.init();


    Inspector.inspect();


    Logger.log(
        "===== TEST COMPLETE ====="
    );


}