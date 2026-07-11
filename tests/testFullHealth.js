function testFullHealth() {

    Logger.log("===== FULL SYSTEM HEALTH TEST =====");

    // Инициализируем систему
    SystemInit.init();

    // Проверяем здоровье всех основных модулей
    Inspector.health();

    Logger.log("===== TEST COMPLETE =====");

}