console.log("SecurityGuard");


const SecurityGuard = {


    permissions:{},


    init(){

        Logger.log(
            "SecurityGuard READY"
        );

    },


    check(permission){

        // пока базовая версия

        return true;

    },


    health(){

        return {

            status:"OK",

            permissions:
                Object.keys(
                    this.permissions
                ),

            timestamp:
                new Date()

        };

    }


};



globalThis.SecurityGuard =
    SecurityGuard;