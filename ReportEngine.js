// ============================================================
// ReportEngine v1.0.0
// Role-protected, organization-scoped operational reports
// ============================================================

const ReportEngine = {
  version: "1.0.0",

  requireAccess() {
    return SecurityGuard.require(
      "REPORT_VIEW"
    );
  },

  clientsKPI() {
    this.requireAccess();

    const clients =
      Database.query(
        "CLIENT",
        {},
        {
          includeDeleted: true,
        }
      );
    const valid = clients.filter(
      (client) =>
        client.ClientID &&
        !String(client.ClientID)
          .includes("undefined")
    );

    return {
      total: valid.length,
      active: valid.filter(
        (client) =>
          client.Status ===
          "ACTIVE"
      ).length,
      deleted: valid.filter(
        (client) =>
          client.Deleted === true ||
          client.Deleted === "true" ||
          client.Deleted === 1
      ).length,
    };
  },

  tripsKPI() {
    this.requireAccess();

    const trips =
      Database.query("TRIP", {});
    let revenue = 0;
    let cost = 0;

    trips.forEach((trip) => {
      revenue += Number(
        trip.Revenue || 0
      );
      cost += Number(
        trip.ActualCost ||
        trip.Cost ||
        0
      );
    });

    return {
      totalTrips: trips.length,
      revenue,
      cost,
      margin: revenue - cost,
    };
  },

  clientProfitability() {
    this.requireAccess();

    const clients =
      Database.query("CLIENT", {});
    const trips =
      Database.query("TRIP", {});

    return clients.map((client) => {
      const clientTrips =
        trips.filter(
          (trip) =>
            trip.ClientID ===
            client.ClientID
        );
      const revenue =
        clientTrips.reduce(
          (sum, trip) =>
            sum +
            Number(
              trip.Revenue || 0
            ),
          0
        );
      const cost =
        clientTrips.reduce(
          (sum, trip) =>
            sum +
            Number(
              trip.ActualCost ||
              trip.Cost ||
              0
            ),
          0
        );

      return {
        ClientID: client.ClientID,
        Name: client.Name,
        Trips: clientTrips.length,
        Revenue: revenue,
        Cost: cost,
        Margin: revenue - cost,
      };
    });
  },

  managerKPI() {
    this.requireAccess();

    const trips =
      Database.query("TRIP", {});
    const map = {};

    trips.forEach((trip) => {
      const managerId =
        trip.ManagerID ||
        "UNKNOWN";

      if (!map[managerId]) {
        map[managerId] = {
          ManagerID: managerId,
          Trips: 0,
          Revenue: 0,
          Cost: 0,
          Margin: 0,
        };
      }

      map[managerId].Trips++;
      map[managerId].Revenue +=
        Number(trip.Revenue || 0);
      map[managerId].Cost +=
        Number(
          trip.ActualCost ||
          trip.Cost ||
          0
        );
      map[managerId].Margin =
        map[managerId].Revenue -
        map[managerId].Cost;
    });

    return Object.values(map);
  },
};

globalThis.ReportEngine =
  ReportEngine;

