console.log("CoreFunctions");

function erpTest(){


    Logger.log(
        "LEGACY ERP TEST REDIRECT"
    );


    return Bootstrap.start();


},
const CoreFunctions = {


    init(){

        SystemInit.init();

    },


    health(){

        return Inspector.inspect();

    },


    startupTest(){

        return SystemStartupTest.fullHealth();

    }


};


globalThis.CoreFunctions =
    CoreFunctions;