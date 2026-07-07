const TripRepository = {

    create(data) {

       SecurityGuard.check("TRIP_CREATE");


data = TripValidator.validate(data);


if (!data.TripID){
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


const merged = {

    ...existing,

    ...data

};


data = TripValidator.validate(
    merged
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
    if(
    updated.Status === "COMPLETED"
){

    EventBus.emit(
        "TRIP_COMPLETED",
        updated
    );

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