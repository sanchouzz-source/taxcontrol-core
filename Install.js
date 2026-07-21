function installSystem() {

    Logger.log("ERP INSTALL START");

    SchemaManager.init();

    Registry.init();
    EventBus.init();


LogisticsSubscriptions.init();


TripEventHandler.init();

FinanceEngine.init();

    SystemInit.init();

    Logger.log("ERP INSTALL COMPLETE");

}