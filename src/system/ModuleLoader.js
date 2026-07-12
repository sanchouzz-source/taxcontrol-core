console.log("ModuleLoader");

const ModuleLoader = {

    coreModules: [

        "TripEventHandler",
        "FinanceEngine",
        "KPIEngine",
        "DashboardEngine"

    ],

    loadCore() {

        this.coreModules.forEach(name => {

            const module = globalThis[name];

            if (!module) {

                Logger.log("MODULE NOT FOUND: " + name);
                return;

            }

            ModuleRegistry.register(name, module);

        });

    },

    initAll() {

        ModuleRegistry.initAll();

    },

    health() {

        return HealthContract.create(
            "ModuleLoader",
            "OK",
            {
                loaded: ModuleRegistry.list()
            }
        );

    }

};

globalThis.ModuleLoader = ModuleLoader;