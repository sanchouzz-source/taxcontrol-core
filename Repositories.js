const ClientRepository = {

    create(data) {

        SecurityGuard.check("CLIENT_CREATE");

        data = ClientValidator.validate(data);

        if (!data.ClientID) {
            data.ClientID = IdService.generate("CLI");
        }

        data.OrganizationID = OrganizationContext.get();

        const result = Database.insert("Clients", data);

        AuditLog.write("CREATE", "CLIENT", null, result);

        EventBus.emit("CLIENT_CREATED", result);

        return result;
    },

    update(clientId, data) {

        SecurityGuard.check("CLIENT_UPDATE");

        const existing = Database.find("Clients", clientId);

        if (!existing) {
            throw new Error("Client not found");
        }

        Versioning.save("CLIENT", clientId, existing);

        data = ClientValidator.validate(data);

        data.OrganizationID = OrganizationContext.get();
        data.ClientID = clientId;

        const updated = Database.update("Clients", clientId, data);

        AuditLog.write("UPDATE", "CLIENT", existing, updated);

        EventBus.emit("CLIENT_UPDATED", updated);

        return updated;
    },

    getById(id) {
        SecurityGuard.check("CLIENT_READ");
        return Database.find("Clients", id);
    },

    list() {
        SecurityGuard.check("CLIENT_READ");
        return Database.query("Clients", {});
    }
};