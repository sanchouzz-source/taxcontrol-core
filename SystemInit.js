const SystemInit = {

    init() {

        Logger.log("ERP BOOT START");


        SafeCore.init();


        Registry.load();


        if (typeof EventBus !== "undefined") {
            EventBus.init();
        }


        ModuleLoader.init();


        ServiceContainer.start();


        DashboardEngine.render(true);


        Logger.log("ERP BOOT COMPLETE");
    }
};


globalThis.SystemInit = SystemInit;