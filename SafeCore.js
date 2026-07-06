const SafeCore = {

    state: {
        mode: "FULL" // FULL | SAFE
    },

    init() {

        const issues = DuplicateDetector.run();

        if (issues && issues.length > 0) {

            this.state.mode = "SAFE";

            Logger.log("⚠ SYSTEM STARTED IN SAFE MODE");

            this.activateSafeMode();

        } else {

            this.state.mode = "FULL";

            Logger.log("✅ SYSTEM STARTED IN FULL MODE");
        }
    },

    activateSafeMode() {

        // 🧠 создаём fallback EventBus если сломан
        if (typeof EventBus === "undefined") {

            globalThis.EventBus = {

                handlers: {},

                on(event, fn) {
                    Logger.log("SAFE MODE: event registered " + event);
                },

                emit(event, payload) {
                    Logger.log("SAFE MODE: event ignored " + event);
                }
            };
        }

        // 🧠 создаём fallback Database если сломан
        if (typeof Database === "undefined") {

            globalThis.Database = {

                insert() {
                    Logger.log("SAFE MODE: insert blocked");
                },

                query() {
                    return [];
                }
            };
        }
    }
};