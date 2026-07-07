function installSystem() {

    SchemaManager.init();
    Registry.init();

    EventBus.init?.(); // если есть
    TripEventHandler.init();
    AutomationEngine.init();
    FinanceEngine.init(); // 🔥 ВАЖНО
}