console.log("TripRepository");
const TripRepository = {


    // =========================
    // CREATE TRIP
    // =========================

    create(data) {

        SecurityGuard.check(
            "TRIP_CREATE"
        );


        data = TripValidator.validate(
            data
        );


        if (!data.TripID) {

            data.TripID =
                IdService.generate(
                    "TRP"
                );

        }


        data.OrganizationID =
            OrganizationContext.get();



        const result =
            Database.insert(
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



    // =========================
    // UPDATE TRIP
    // =========================

    update(tripId, data) {


        SecurityGuard.check(
            "TRIP_UPDATE"
        );



        const existing =
            Database.find(
                "Trips",
                tripId
            );



        if (!existing) {

            throw new Error(
                "Trip not found: " + tripId
            );

        }



        // сохраняем старую версию

        Versioning.save(
            "TRIP",
            tripId,
            existing
        );



        // объединяем старые и новые данные

        const merged = {

            ...existing,

            ...data

        };



        data =
            TripValidator.validate(
                merged
            );



        data.TripID =
            tripId;



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



        // =========================
        // BUSINESS EVENT
        // =========================

        if (
            updated.Status === "COMPLETED"
        ) {


            EventBus.emit(
                "TRIP_COMPLETED",
                updated
            );


        }



        return updated;

    },



    // =========================
    // GET BY ID
    // =========================

    getById(id) {


        SecurityGuard.check(
            "TRIP_READ"
        );


        return Database.find(
            "Trips",
            id
        );


    },



    // =========================
    // LIST
    // =========================

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



globalThis.TripRepository =
TripRepository;