console.log("Bootstrap");

if(!globalThis.Bootstrap){

const Bootstrap = {



    version:"0.2.0",



    started:false,





    start(){



        if(this.started){


            Logger.log(
                "BOOTSTRAP ALREADY STARTED"
            );


            return;


        }





        Logger.log(
            "🚀 ERP BOOT START"
        );





        try{



            SystemInit.init();



            this.started=true;



            Logger.log(
                "✅ ERP BOOT COMPLETE"
            );



        }


        catch(error){



            Logger.error(

                "BOOT FAILED: "
                +
                error.message

            );


            throw error;


        }



    },






    health(){



        return HealthContract.create(


            "Bootstrap",


            this.started
            ?
            "OK"
            :
            "NOT_READY",



            {


                version:this.version,


                started:this.started



            }


        );


    }



};





globalThis.Bootstrap =
Bootstrap;

}

Logger.log(
"Bootstrap READY"
);