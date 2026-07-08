console.log("KPIRepository");
const KPIRepository = {


    create(data) {


        SecurityGuard.check(
            "KPI_CREATE"
        );


        if (!data.KPIID) {

            data.KPIID =
                IdService.generate("KPI");

        }


        data.OrganizationID =
            OrganizationContext.get();


        const result =
            Database.insert(
                "KPIMetrics",
                data
            );


        AuditLog.write(
            "CREATE",
            "KPI",
            null,
            result
        );


        EventBus.emit(
            "KPI_CREATED",
            result
        );


        return result;

    },


    getById(id) {


        SecurityGuard.check(
            "KPI_READ"
        );


        return Database.find(
            "KPIMetrics",
            id
        );

    },


    list(filters = {}) {


        SecurityGuard.check(
            "KPI_READ"
        );


        return Database.query(
            "KPIMetrics",
            filters
        );

    },


    update(id, data) {


        SecurityGuard.check(
            "KPI_UPDATE"
        );


        const existing =
            Database.find(
                "KPIMetrics",
                id
            );


        if (!existing) {

            throw new Error(
                "KPI not found"
            );

        }


        Versioning.save(
            "KPI",
            id,
            existing
        );


        const merged = {

            ...existing,

            ...data

        };


        const updated =
            Database.update(
                "KPIMetrics",
                id,
                merged
            );


        AuditLog.write(
            "UPDATE",
            "KPI",
            existing,
            updated
        );


        EventBus.emit(
            "KPI_UPDATED",
            updated
        );


        return updated;

    }


};


globalThis.KPIRepository = KPIRepository;