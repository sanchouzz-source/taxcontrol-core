function startERP() {

    if (globalThis.__ERP_STARTED__) {
        Logger.log("ERP already started");
        return;
    }

    globalThis.__ERP_STARTED__ = true;

    Logger.log("🚀 ERP BOOT START");

    SchemaManager.init();
    IdService.init?.();
    Database.init?.();

    EventBus.init?.();
    SystemRegistry.init?.();

    Logger.log("✅ ERP BOOT COMPLETE");
}