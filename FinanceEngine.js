const FinanceEngine = {

    init() {

        // 💰 обработка завершения рейса
        EventBus.on("TRIP_COMPLETED", (trip) => {

            this.calculateTripProfit(trip);
        });

        // 📊 клиентская аналитика
        EventBus.on("CLIENT_CREATED", (client) => {

            this.initClientFinance(client);
        });
    }
};
//расчет прибыли рейса
FinanceEngine.calculateTripProfit = function(trip) {

    const revenue = Number(trip.Revenue || 0);
    const cost = Number(trip.ActualCost || 0);

    const profit = revenue - cost;

    Logger.log("💰 Trip Profit: " + profit);

    // сюда позже добавим:
    // - запись в Finance table
    // - обновление KPI
    // - бонусы менеджерам
};
//клиентская инансовая карточка
FinanceEngine.initClientFinance = function(client) {

    Logger.log("📊 Finance profile created for: " + client.Name);

    // будущая логика:
    // - кредитный лимит
    // - оборот
    // - риск-скоринг
};