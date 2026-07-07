const TripRepository = {

    create(data) {

        SecurityGuard.check("TRIP_CREATE");

        if (!data.TripID) {
            data.TripID = IdService.generate("TRP");
        }

        data.OrganizationID = OrganizationContext.get();

        const result = Database.insert(
            "Trips",
            data
        );

        AuditLog.write(
            "CREATE",
            "TRIP",
            null,
            result
        );

        EventBus.emit(
            "TRIP_CREATED",
            result
        );

        return result;
    },


    update(tripId, data) {

        SecurityGuard.check("TRIP_UPDATE");

        const existing =
            Database.find(
                "Trips",
                tripId
            );


        if (!existing) {
            throw new Error(
                "Trip not found"
            );
        }


        Versioning.save(
            "TRIP",
            tripId,
            existing
        );


        data.TripID = tripId;

        data.OrganizationID =
            OrganizationContext.get();


        const updated =
            Database.update(
                "Trips",
                tripId,
                data
            );


        AuditLog.write(
            "UPDATE",
            "TRIP",
            existing,
            updated
        );


        EventBus.emit(
            "TRIP_UPDATED",
            updated
        );


        return updated;
    },


    getById(id) {

        SecurityGuard.check(
            "TRIP_READ"
        );

        return Database.find(
            "Trips",
            id
        );
    },


    list() {

        SecurityGuard.check(
            "TRIP_READ"
        );

        return Database.query(
            "Trips",
            {}
        );
    }

};


globalThis.TripRepository = TripRepository;