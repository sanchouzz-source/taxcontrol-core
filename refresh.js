function refreshDashboard() {

    if (!DashboardEngine) {
        throw new Error("DashboardEngine not loaded");
    }

    DashboardEngine.render();
}