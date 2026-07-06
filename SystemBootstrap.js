/**
 * 🧠 SINGLE BOOT SEQUENCE
 * защита от двойного запуска системы
 */

globalThis.__ERP_STATE__ = globalThis.__ERP_STATE__ || {
    started: false,
    modules: {}
};

function startERP() {

    // 🛑 защита от повторного запуска
    if (globalThis.__ERP_STATE__.started) {
        Logger.log("⚠ ERP already started - skip boot");
        return;
    }

    globalThis.__ERP_STATE__.started = true;

    Logger.log("🚀 ERP BOOT START");

    // CORE INIT (в строгом порядке)
    safeInit("SchemaManager");
    safeInit("IdService");
    safeInit("Database");

    // EVENT LAYER
    safeInit("EventBus");
    safeInit("EventStore");

    // SYSTEM
    safeInit("SystemRegistry");

    Logger.log("✅ ERP BOOT COMPLETE");
}
function safeInit(moduleName) {

    try {

        // если уже создан — не пересоздаём
        if (globalThis.__ERP_STATE__.modules[moduleName]) {
            Logger.log("⏭ Skip already loaded: " + moduleName);
            return;
        }

        const module = globalThis[moduleName];

        if (!module) {
            Logger.log("❌ Module not found: " + moduleName);
            return;
        }

        if (typeof module.init === "function") {
            module.init();
        }

        globalThis.__ERP_STATE__.modules[moduleName] = true;

        Logger.log("✔ Loaded: " + moduleName);

    } catch (e) {
        Logger.log("💥 Error loading " + moduleName + ": " + e.message);
    }
}