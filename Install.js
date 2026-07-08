function installSystem() {

    Logger.log(
        "ERP INSTALL START"
    );

    SchemaManager.init();
    Registry.init();
    SystemInit.init();

    Logger.log(
        "ERP INSTALL COMPLETE"
    );

}