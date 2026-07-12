console.log("Inspector");

const Inspector = {

    inspect() {

        Logger.log("========== ERP HEALTH ==========");

        const report = {};

        try {

            Object.assign(
                report,
                HealthService.checkAll()
            );

        } catch (e) {

            Logger.log(
                "HEALTH ERROR: " + e.message
            );

            report.HealthService = {
                status: "ERROR",
                message: e.message
            };

        }

        Object.entries(report).forEach(([name,item])=>{

            const ok =
                item.status === "OK";

            Logger.log(
                (ok ? "✅ " : "❌ ")
                + name
                + " "
                + item.status
            );

        });

        Logger.log("==============================");

        return report;

    },

    health(){

        return HealthContract.create(

            "Inspector",

            "OK",

            {

                dependencies:{

                    HealthService:true

                }

            }

        );

    }

};

globalThis.Inspector = Inspector;