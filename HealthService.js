console.log("HealthService");


const HealthService = {


    check(moduleName, module) {


        try {


            if (!module) {

                return {

                    status:"ERROR",
                    module:moduleName,
                    message:"MODULE NOT FOUND",
                    timestamp:new Date()

                };

            }



            if (typeof module.health === "function") {


                return module.health();


            }



            return {


                status:"WARNING",
                module:moduleName,
                message:"health() not implemented",
                timestamp:new Date()


            };



        } catch(e){


            return {


                status:"ERROR",
                module:moduleName,
                message:e.message,
                timestamp:new Date()


            };


        }


    }


};



globalThis.HealthService = HealthService;