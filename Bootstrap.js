console.log("Bootstrap");


const Bootstrap = {


    version:"0.2.0",


    started:false,



    start(){


        if(this.started){

            Logger.log(
                "ERP ALREADY STARTED"
            );

            return;

        }



        Logger.log(
            "========== TAXCONTROL ERP BOOTSTRAP =========="
        );



        try{


            SystemInit.init();



            this.started=true;



            Logger.log(
                "✅ ERP STARTED SUCCESSFULLY"
            );



        }
        catch(error){


            Logger.error(
                "BOOTSTRAP FAILED: "
                +
                error.message
            );


            throw error;

        }



    },



    health(){


        return {

            status:
            this.started
            ?
            "READY"
            :
            "STOPPED",


            module:
            "Bootstrap",


            version:
            this.version

        };


    }


};



globalThis.Bootstrap =
Bootstrap;



Logger.log(
    "Bootstrap READY"
);