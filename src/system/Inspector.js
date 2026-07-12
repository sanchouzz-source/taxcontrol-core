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




    const report = {};





    const services = [

        "SystemInit",

        "Database",

        "EventBus",

        "Registry",

        "SchemaManager",

        "ModuleRegistry",

        "ModuleLoader",

        "FinanceEngine",

        "KPIEngine",

        "DashboardEngine"

    ];






    services.forEach(name=>{


        try{


            const module =
            globalThis[name];



            if(

                module
                &&
                typeof module.health==="function"

            ){



                report[name]=
                module.health();



            }

            else{



                report[name]={


                    status:"WARNING",


                    module:name,


                    message:
                    "Health method missing"


                };


            }



        }


        catch(error){


            report[name]={


                status:"FAILED",


                module:name,


                message:
                error.message


            };


        }



    });






    Object.keys(report)

    .forEach(name=>{


        const item =
        report[name];



        if(item.status==="OK"){


            Logger.log(

                "✅ "
                +
                name
                +
                " OK"

            );


        }

        else{


            Logger.log(

                "⚠️ "
                +
                name
                +
                " "
                +
                JSON.stringify(item)

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