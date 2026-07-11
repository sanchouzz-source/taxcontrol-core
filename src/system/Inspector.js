console.log("Inspector");

const Inspector = {

    inspect() {

        Logger.log("========== ERP HEALTH ==========");

        const report = HealthService.checkAll();

        let ok = 0;
        let warning = 0;
        let error = 0;

        Object.entries(report).forEach(([name, item]) => {

            switch (item.status) {

                case "OK":

                    ok++;

                    Logger.log(
                        "✅ " +
                        name +
                        " OK"
                    );

                    break;

                case "WARNING":

                    warning++;

                    Logger.log(
                        "⚠️ " +
                        name +
                        " WARNING " +
                        (
                            item.message ||
                            JSON.stringify(item)
                        )
                    );

                    break;

                default:

                    error++;

                    Logger.log(
                        "❌ " +
                        name +
                        " ERROR " +
                        (
                            item.message ||
                            JSON.stringify(item)
                        )
                    );

            }

        });

        Logger.log("--------------------------------");

        Logger.log(
            "OK: " + ok +
            " | WARNING: " + warning +
            " | ERROR: " + error
        );

        Logger.log("================================");

        return {
            ok,
            warning,
            error,
            report
        };

    },

    summary() {

        const result = this.inspect();

        return {
            status:
                result.error > 0
                    ? "ERROR"
                    : result.warning > 0
                        ? "WARNING"
                        : "OK",

            ok: result.ok,
            warning: result.warning,
            error: result.error
        };

    }

};

function inspectSystem() {

    return Inspector.inspect();

}

globalThis.Inspector = Inspector;