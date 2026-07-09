console.log("HealthService");


const HealthService = {


    check(moduleName, module) {


        try {


            if (!module) {


                return {

                    status:"ERROR",

                    module:
                        moduleName,

                    message:
                        "MODULE NOT FOUND",

                    timestamp:
                        new Date()

                };

            }



            if (
                typeof module.health === "function"
            ) {


                const result =
                    module.health();


                return {

                    status:
                        result.status || "OK",

                    module:
                        moduleName,

                    details:
                        result,

                    timestamp:
                        new Date()

                };


            }



            return {


                status:"WARNING",

                module:
                    moduleName,


                message:
                    "health() not implemented",


                timestamp:
                    new Date()


            };



        }
        catch(e){


            return {


                status:"ERROR",

                module:
                    moduleName,


                message:
                    e.message,


                timestamp:
                    new Date()


            };


        }


    },



    checkAll(){


        const modules = {


            SystemInit:
                SystemInit,


            Database:
                Database,


            EventBus:
                EventBus,


            Registry:
                Registry,


            SchemaManager:
                SchemaManager,


            ModuleRegistry:
                ModuleRegistry,


            ModuleLoader:
                ModuleLoader,


            FinanceEngine:
                FinanceEngine,


            KPIEngine:
                KPIEngine,


            DashboardEngine:
                DashboardEngine


        };



        const result = {};



        Object.keys(modules)
        .forEach(name=>{


            result[name] =
                this.check(
                    name,
                    modules[name]
                );


        });



        return result;


    }


};



globalThis.HealthService =
HealthService;