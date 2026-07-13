console.log("App");

const App = {

version:"0.5.0",

init(){

    Logger.log(
        "ERP APP INIT"
    );


    if(
        typeof Bootstrap === "undefined"
    ){

        throw new Error(
            "Bootstrap not loaded"
        );

    }


},



start(){


    this.init();



    Logger.log(
        "========== ERP START REQUEST =========="
    );


    Bootstrap.start();



    return Inspector.inspect();



},


health(){

    Logger.log(
        "========== ERP HEALTH REQUEST =========="
    );

    try{

        Bootstrap.start();
        const report =
            Inspector.inspect();

        Logger.log(
            JSON.stringify(
                report,
                null,
                2
            )
        );

        return report;

    }
    catch(e){

        const error = {

            status:"ERROR",

            module:"App",

            message:
                e.message,

            timestamp:
                new Date()

        };

        Logger.log(
            JSON.stringify(
                error,
                null,
                2
            )
        );


        return error;

    }

},

reset(){

    if(
        typeof ModuleRegistry !== "undefined"
    ){

        ModuleRegistry.reset();

    }

    if(
        typeof SchemaManager !== "undefined"
    ){

        SchemaManager.initialized=false;

    }

    if(
        typeof Database !== "undefined"
    ){

        Database.initialized=false;

    }

    Logger.log(
        "ERP RESET COMPLETE"
    );

},

info(){

return {

    application:
        "TaxControl ERP",

    version:
        this.version,

    platform:
        "Google Apps Script",

    timestamp:
        new Date()

};

}

};

// ========================
// GLOBAL API
// ========================

function erpStart(){

return App.start();

}

function erpHealth(){

return App.health();

}

function erpReset(){

return App.reset();

}

function erpInfo(){

return App.info();

}