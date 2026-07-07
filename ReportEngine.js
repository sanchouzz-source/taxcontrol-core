const ReportEngine = {

    // =========================
    // KPI: Clients
    // =========================
    clientsKPI() {

        const clients = Database.query("Clients", {});

        const valid = clients.filter(c =>
            c.ClientID && !String(c.ClientID).includes("undefined")
        );

        return {
            total: valid.length,
            active: valid.filter(c => c.Status === "ACTIVE").length,
            deleted: valid.filter(c => c.Deleted === true).length
        };
    },


    // =========================
    // KPI: Trips financials
    // =========================
    tripsKPI() {

        const trips = Database.query("Trips", {});

        let revenue = 0;
        let cost = 0;

        trips.forEach(t => {
            revenue += Number(t.Revenue || 0);
            cost += Number(t.ActualCost || 0);
        });

        return {
            totalTrips: trips.length,
            revenue,
            cost,
            margin: revenue - cost
        };
    },


    // =========================
    // KPI: Client profitability
    // =========================
    clientProfitability() {

        const clients = Database.query("Clients", {});
        const trips = Database.query("Trips", {});

        return clients.map(c => {

            const clientTrips = trips.filter(t => t.ClientID === c.ClientID);

            let revenue = 0;
            let cost = 0;

            clientTrips.forEach(t => {
                revenue += Number(t.Revenue || 0);
                cost += Number(t.ActualCost || 0);
            });

            return {
                ClientID: c.ClientID,
                Name: c.Name,
                Trips: clientTrips.length,
                Revenue: revenue,
                Cost: cost,
                Margin: revenue - cost
            };
        });
    },


    // =========================
    // KPI: Manager performance (ВОССТАНОВЛЕН)
    // =========================
    managerKPI() {

        const trips = Database.query("Trips", {});

        const map = {};

        trips.forEach(t => {

            const managerId = t.ManagerID || "UNKNOWN";

            if (!map[managerId]) {

                map[managerId] = {
                    ManagerID: managerId,
                    Trips: 0,
                    Revenue: 0,
                    Cost: 0,
                    Margin: 0
                };
            }

            map[managerId].Trips += 1;
            map[managerId].Revenue += Number(t.Revenue || 0);
            map[managerId].Cost += Number(t.ActualCost || 0);
            map[managerId].Margin =
                map[managerId].Revenue - map[managerId].Cost;
        });

        return Object.values(map);
    }
};
globalThis.ReportEngine = ReportEngine;