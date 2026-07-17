console.log("Logger");


const Logger = {


    version:"0.3.0",


    log(message){

        console.log(
            message
        );

    },



    debug(message){

        console.log(
            "[DEBUG]",
            message
        );

    },



    info(message){

        console.info(
            "[INFO]",
            message
        );

    },



    warn(message){

        console.warn(
            "[WARN]",
            message
        );

    },



    error(message){

        console.error(
            "[ERROR]",
            message
        );

    },



    health(){

        return {

            status:"OK",

            version:this.version,

            methods:[
                "log",
                "debug",
                "info",
                "warn",
                "error"
            ]

        };

    }



};



globalThis.Logger =
    Logger;