function installSystem() {

    SchemaManager.init();
    Registry.init();

    EventBus.init?.(); // если есть
    AutomationEngine.init();
    FinanceEngine.init(); // 🔥 ВАЖНО
}