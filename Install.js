function installSystem() {

    Logger.log(
        "ERP INSTALL START"
    );

    SchemaManager.init();
    Registry.init();
    SystemInit.init();
    KPIRepository;
    KPIService;

    Logger.log(
        "ERP INSTALL COMPLETE"
    );

}