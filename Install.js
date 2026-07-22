function installSystem() {
  // 1. Сначала инициализируем SchemaManager (он строит схему из метаданных)
  if (typeof SchemaManager !== "undefined") {
    SchemaManager.init();
  }

  // 2. Затем Database – теперь без внутреннего вызова SchemaManager
  if (typeof Database !== "undefined") {
    Database.init();
  }

  // 3. Остальные компоненты
  if (typeof Registry !== "undefined") {
    Registry.init();
  }

  if (typeof EventBus !== "undefined") {
    EventBus.init();
  }

  if (typeof TransportOrderEventHandler !== "undefined") {
    TransportOrderEventHandler.init();
  }

  if (typeof LogisticsEventSubscriptions !== "undefined") {
    LogisticsEventSubscriptions.init();
  }

  if (typeof TripEventHandler !== "undefined") {
    TripEventHandler.init();
  }

  if (typeof FinanceEngine !== "undefined") {
    FinanceEngine.init();
  }

  Logger.log("System installation complete.");
}