function initEventSubscriptions() {

    // 📊 любой клиент → обновляем dashboard
    EventBus.on("CLIENT_CREATED", function () {
        DashboardEngine.render(true);
    });

    EventBus.on("CLIENT_UPDATED", function () {
        DashboardEngine.render(true);
    });

    // 🚚 любые поездки → обновляем KPI
    EventBus.on("TRIP_CREATED", function () {
        DashboardEngine.render(true);
    });

    EventBus.on("TRIP_UPDATED", function () {
        DashboardEngine.render(true);
    });
}