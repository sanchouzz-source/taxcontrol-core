console.log("Logger");


const Logger = {


    version:"0.2.0",


    log(message){

        console.log(
            message
        );

    },



    info(message){

        console.info(
            message
        );

    },



    warn(message){

        console.warn(
            message
        );

    },



    error(message){

        console.error(
            message
        );

    },



    health(){

        return {

            status:"OK",

            version:this.version

        };

    }



};



globalThis.Logger =
    Logger;