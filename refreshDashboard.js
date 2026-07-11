console.log("RefreshDashboard");


function refreshDashboard() {


    if(
        typeof DashboardEngine === "undefined"
    ){

        throw new Error(
            "DashboardEngine not loaded"
        );

    }


    DashboardEngine.refresh();


}