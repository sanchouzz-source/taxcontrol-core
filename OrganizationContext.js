const OrganizationContext = {

    get() {

        const org = PropertiesService.getScriptProperties()
            .getProperty("CURRENT_ORG");

        if (!org) {
            throw new Error("Organization context is not set");
        }

        return org;
    },

    require(data) {

        if (!data || typeof data !== "object") {
            throw new Error("Invalid data object");
        }

        const org = this.get();

        if (!data.OrganizationID) {
            data.OrganizationID = org;
        }

        if (data.OrganizationID !== org) {
            throw new Error("Cross-organization data access blocked");
        }

        return data;
    }
};