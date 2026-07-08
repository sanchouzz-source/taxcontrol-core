const SchemaRegistry = {

    map: {
        Organizations:"OrganizationID",
        Clients:"ClientID",
        Vehicles:"VehicleID",
        Trips:"TripID",
        Payments:"PaymentID",
        FinancialTransactions:"TransactionID",
        KPIMetrics:"KPIID"
        
    },

    getIdField(entity) {

        const field = this.map[entity];

        if (!field) {
            throw new Error("No schema mapping for: " + entity);
        }

        return field;
    }
};