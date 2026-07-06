const SystemRegistry = {

    requiredGlobals: [
        "EventBus",
        "Database",
        "IdService",
        "SchemaManager",
        "EventStore",
        "DashboardEngine"
    ],

    checkGlobals() {

        const issues = [];

        this.requiredGlobals.forEach(name => {

            const exists = typeof globalThis[name] !== "undefined";

            if (!exists) {
                issues.push("MISSING: " + name);
            }
        });

        return issues;
    }
};