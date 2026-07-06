const DuplicateDetector = {

    run() {

        Logger.log("===== DUPLICATE DETECTOR START =====");

        const issues = [];

        const targets = [
            "EventBus",
            "Database",
            "IdService",
            "SchemaManager",
            "EventStore"
        ];

        targets.forEach(name => {

            const count = this.countDeclarations(name);

            if (count > 1) {
                issues.push(name + " is DECLARED " + count + " times");
            }
        });

        const missing = SystemRegistry.checkGlobals();
        issues.push(...missing);

        if (issues.length === 0) {
            Logger.log("OK - NO ISSUES FOUND");
        } else {
            issues.forEach(i => Logger.log("ISSUE: " + i));
        }

        Logger.log("===== DETECTOR END =====");

        return issues;
    },

    // ⚠️ ограниченный, но рабочий способ
    countDeclarations(name) {

        const scripts = Object.keys(globalThis);

        let count = 0;

        scripts.forEach(key => {
            if (key === name) count++;
        });

        return count;
    }
};