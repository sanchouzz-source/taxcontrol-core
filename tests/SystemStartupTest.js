console.log("SystemStartupTest");


function testFullHealth(){


    Logger.log(
        "===== FULL SYSTEM HEALTH TEST ====="
    );


    // 1. Запуск ERP

    SystemInit.init();



    // 2. Проверка состояния

    const report =
        Inspector.inspect();



    // 3. Вывод полного JSON

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