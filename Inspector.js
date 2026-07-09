console.log("Inspector");


const Inspector = {


    coreModules: [

        // SYSTEM
        "SystemInit",
        "SchemaManager",
        "Database",
        "Registry",
        "IdService",

        // EVENT SYSTEM
        "EventBus",
        "EventStore",

        // SECURITY
        "SecurityGuard",
        "AuditLog",
        "Versioning"

    ],



    businessModules: [

        // DOMAIN
        "TripRepository",
        "ClientRepository",

        "TripValidator",
        "ClientValidator",

        // FINANCE
        "FinanceEngine",

        // KPI
        "KPIEngine",
        "KPIRepository",
        "KPIService",

        // DASHBOARD
        "DashboardEngine",
        "DashboardService",
        "ReportEngine"

    ],



    inspect(){


        Logger.log(
            "========== ERP INSPECTOR =========="
        );


        Logger.log(
            "----- CORE -----"
        );


        this.checkList(
            this.coreModules
        );



        Logger.log(
            "----- BUSINESS MODULES -----"
        );


        this.checkList(
            this.businessModules
        );



        Logger.log(
            "----- MODULE REGISTRY -----"
        );


        this.checkModuleRegistry();



        Logger.log(
            "==================================="
        );


    },




    checkList(list){


        list.forEach(name=>{


            if(
                typeof globalThis[name]
                ===
                "undefined"
            ){

                Logger.log(
                    "❌ "
                    +
                    name
                    +
                    " NOT FOUND"
                );

            }
            else{

                Logger.log(
                    "✅ "
                    +
                    name
                    +
                    " OK"
                );

            }


        });


    },




    checkModuleRegistry(){


        if(
            typeof ModuleRegistry
            ===
            "undefined"
        ){

            Logger.log(
                "❌ ModuleRegistry NOT FOUND"
            );

            return;

        }



        if(
            !ModuleRegistry.modules
        ){

            Logger.log(
                "⚠ ModuleRegistry EMPTY"
            );

            return;

        }



        Object.keys(
            ModuleRegistry.modules
        )
        .forEach(name=>{


            Logger.log(
                "📦 MODULE REGISTERED: "
                +
                name
            );


        });


    }


};




globalThis.Inspector = Inspector;



function inspectSystem(){

    Inspector.inspect();

}