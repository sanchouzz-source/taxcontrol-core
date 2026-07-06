//ядро автоматизации
const AutomationEngine = {

    init() {

        // 🧩 CLIENT CREATED
        EventBus.on("CLIENT_CREATED", (client) => {

            this.handleNewClient(client);
        });

        // 🧩 TRIP CREATED
        EventBus.on("TRIP_CREATED", (trip) => {

            this.handleNewTrip(trip);
        });

        // 🧩 TRIP COMPLETED
        EventBus.on("TRIP_COMPLETED", (trip) => {

            this.handleTripCompleted(trip);
        });
    }
};
//логика клиентов
AutomationEngine.handleNewClient = function(client) {

    Logger.log("📊 CRM update for client: " + client.Name);

    // сюда позже добавим:
    // - CRM scoring
    // - уведомления менеджеру
    // - аналитика
};
//логика рейсов
AutomationEngine.handleNewTrip = function(trip) {

    Logger.log("🚚 New trip registered: " + trip.TripID);

    // бизнес-логика:
    // - резерв машины
    // - проверка водителя
    // - расчёт предварительной маржи
};
//завершение рейса
AutomationEngine.handleTripCompleted = function(trip) {

    Logger.log("💰 Trip completed: " + trip.TripID);

    // 🔥 здесь начинается деньги

    const revenue = Number(trip.Revenue || 0);
    const cost = Number(trip.ActualCost || 0);

    const profit = revenue - cost;

    Logger.log("Profit: " + profit);

    // сюда позже добавим:
    // - финансы
    // - KPI
    // - бонусы менеджерам
};