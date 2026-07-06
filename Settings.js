const Settings = {

    setCurrentOrganization(orgId) {

        if (!orgId) {
            throw new Error("OrganizationID cannot be empty");
        }

        PropertiesService.getScriptProperties()
            .setProperty("CURRENT_ORG", orgId);
    },

    getCurrentOrganization() {

        const org = PropertiesService.getScriptProperties()
            .getProperty("CURRENT_ORG");

        if (!org) {
            throw new Error("Current organization is not set");
        }

        return org;
    }
};