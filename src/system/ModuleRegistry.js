console.log("ModuleRegistry");

const ModuleRegistry = {

    modules: {},

    register(name, instance) {

        if (this.modules[name]) {

            Logger.log("MODULE ALREADY REGISTERED: " + name);
            return;

        }

        this.modules[name] = {

            instance,
            status: "REGISTERED"

        };

        Logger.log("MODULE REGISTERED: " + name);

    },

    init(name) {

        const module = this.modules[name];

        if (!module) {

            Logger.log("MODULE NOT FOUND: " + name);
            return;

        }

        if (module.status === "READY") {
            return;
        }

        if (typeof module.instance.init === "function") {

            module.instance.init();

        }

        module.status = "READY";

        Logger.log(name + " READY");

    },

    initAll() {

        Object.keys(this.modules)
            .forEach(name => this.init(name));

    },

    get(name) {

        return this.modules[name]?.instance;

    },

    list() {

        return Object.keys(this.modules);

    },

    health() {

        return HealthContract.create(
            "ModuleRegistry",
            "OK",
            Object.keys(this.modules).map(name => ({

                Module: name,
                Status: this.modules[name].status

            }))
        );

    }

};

globalThis.ModuleRegistry = ModuleRegistry;