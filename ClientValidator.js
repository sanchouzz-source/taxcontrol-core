const ClientValidator = {

    validate(data) {

        if (!data) {
            throw new Error("ClientValidator: empty data");
        }

        if (!data.Name || data.Name.trim() === "") {
            throw new Error("Name is required");
        }

        if (!data.INN) {
            throw new Error("INN is required");
        }

        // 🧠 FIX: always enforce ClientID
        if (!data.ClientID || data.ClientID === "") {
            data.ClientID = IdService.generate("CLI");
        }

        if (!data.OrganizationID) {
            data.OrganizationID =
                PropertiesService.getScriptProperties().getProperty("CURRENT_ORG");
        }

        return data;
    }
};