const TripRepository = {
    create(data) {
        SecurityGuard.check("TRIP_CREATE");
        
        data = TripValidator.validate(data);
        
        if (!data.TripID) {
            data.TripID = IdService.generate("TRP");
        }
        
        data.OrganizationID = OrganizationContext.get();
        
        const result = Database.insert("Trips", data);
        
        if (!result) {
            throw new Error("Failed to create trip");
        }
        
        AuditLog.write("CREATE", "TRIP", null, result);
        EventBus.emit("TRIP_CREATED", result);
        
        return result;
    },

    update(tripId, data) {
        SecurityGuard.check("TRIP_UPDATE");
        
        const existing = Database.find("Trips", tripId);
        
        if (!existing) {
            throw new Error("Trip not found");
        }
        
        Versioning.save("TRIP", tripId, existing);
        
        const merged = { ...existing, ...data };
        const validatedData = TripValidator.validate(merged);
        validatedData.TripID = tripId;
        validatedData.OrganizationID = OrganizationContext.get();
        
        const updated = Database.update("Trips", tripId, validatedData);
        
        if (!updated) {
            throw new Error("Failed to update trip");
        }
        
        AuditLog.write("UPDATE", "TRIP", existing, updated);
        EventBus.emit("TRIP_UPDATED", updated);
        
        if (updated.Status === "COMPLETED") {
            EventBus.emit("TRIP_COMPLETED", updated);
        }
        
        return updated;
    },

    getById(id) {
        SecurityGuard.check("TRIP_READ");
        return Database.find("Trips", id);
    },

    list(filters = {}) {
        SecurityGuard.check("TRIP_READ");
        return Database.query("Trips", filters);
    }
};

globalThis.TripRepository = TripRepository;