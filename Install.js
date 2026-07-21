function installSystem() {

    Logger.log("ERP INSTALL START");

    SchemaManager.init();

    Registry.init();
    EventBus.init();

if(
typeof LogisticsEventSubscriptions !== "undefined"
){

LogisticsEventSubscriptions.init();

}


    TripEventHandler.init();

    FinanceEngine.init();
    KPIEngine.init();

    SystemInit.init();

    Logger.log("ERP INSTALL COMPLETE");

}




