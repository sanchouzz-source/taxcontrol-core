const SchemaRegistry = {

    map: {
        Clients: "ClientID",
        Trips: "TripID",
        Organizations: "OrganizationID"
    },

    getIdField(entity) {

        const field = this.map[entity];

        if (!field) {
            throw new Error("No schema mapping for: " + entity);
        }

        return field;
    }
};