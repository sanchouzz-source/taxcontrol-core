console.log("Inspector");


const Inspector = {


    health(){


        return HealthContract.create(

            "Inspector",

            "OK",

            {

                dependencies:{

                    HealthService:true,
                    Logger:true

                }

            }

        );


    },



    inspect(){


        Logger.log(
            "========== ERP HEALTH =========="
        );


        const report =
            HealthService.checkAll();



        Object.keys(report)
        .forEach(name=>{


            const item =
                report[name];


            if(item.status==="OK"){


                Logger.log(
                    "✅ "
                    + name
                    + " OK"
                );


            }
            else{


                Logger.log(

                    "⚠️ "
                    + name
                    + " "
                    + item.status
                    + " "
                    + (
                        item.message
                        ||
                        JSON.stringify(item)
                    )

                );


            }


        });



        Logger.log(
            "================================"
        );


        return report;


    }


};



function inspectSystem(){

    return Inspector.inspect();

}


globalThis.Inspector =
Inspector;