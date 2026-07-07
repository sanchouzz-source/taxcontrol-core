const SystemInit = {

    init() {

        Logger.log("ERP INIT START");

        // 🧠 сначала проверяем систему
        SafeCore.init();

        // 🧠 базовая схема
        if (typeof SchemaManager !== "undefined") {
            SchemaManager.init();
        }

        // 🧠 подписки (если есть EventBus)
        if (typeof EventSubscriptions !== "undefined") {
            EventSubscriptions.initEventSubscriptions();
        }

        // 🧠 dashboard (в safe mode может работать частично)
        if (typeof DashboardEngine !== "undefined") {
            DashboardEngine.render(true);
        }

        Logger.log("ERP INIT COMPLETE");
    }
};
globalThis.SystemInit = SystemInit;