function installSystem() {

SchemaManager.init();

Registry.init();

EventBus.init();

TransportOrderEventHandler.init();

LogisticsEventSubscriptions.init();

TripEventHandler.init();

FinanceEngine.init();

}