const Auth = {

    roles: {
        ADMIN: "ADMIN",
        MANAGER: "MANAGER",
        ACCOUNTANT: "ACCOUNTANT"
    },

    permissions: {

        ADMIN: ["*"],

        MANAGER: [
            "CLIENT_CREATE",
            "CLIENT_READ",
            "TRIP_CREATE",
            "TRIP_READ"
        ],

        ACCOUNTANT: [
            "TRIP_READ",
            "FINANCE_READ"
        ]
    },

    getCurrentUser() {

        const props = PropertiesService.getScriptProperties();

        return {
            userId: props.getProperty("CURRENT_USER") || "SYSTEM",
            role: props.getProperty("CURRENT_ROLE") || "ADMIN"
        };
    }
};
Auth.hasPermission = function(action) {

    const user = this.getCurrentUser();
    const rolePermissions = this.permissions[user.role];

    if (!rolePermissions) {
        return false;
    }

    return rolePermissions.includes("*") ||
           rolePermissions.includes(action);
};