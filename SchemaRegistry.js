const SchemaRegistry = {

    map: {
        Organizations:"OrganizationID",
        Clients:"ClientID",
        Vehicles:"VehicleID",
        Trips:"TripID",
        Payments:"PaymentID",
        FinancialTransactions:"TransactionID"
    },

    getIdField(entity) {

        const field = this.map[entity];

        if (!field) {
            throw new Error("No schema mapping for: " + entity);
        }

        return field;
    }
};