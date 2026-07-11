console.log("Bootstrap");


const Bootstrap = {


    init(){

        Logger.log(
            "BOOTSTRAP START"
        );


        SystemInit.init();


        Logger.log(
            "BOOTSTRAP COMPLETE"
        );

    }


};


globalThis.Bootstrap =
Bootstrap;