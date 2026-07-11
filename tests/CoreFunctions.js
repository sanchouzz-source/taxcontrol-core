console.log("CoreFunctions");


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