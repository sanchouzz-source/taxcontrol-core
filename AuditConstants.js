console.log("AuditConstants");


const AuditConstants = {


    version:"1.3.0",


    registered:false,



    ACTIONS:{


        CREATE:"CREATE",

        UPDATE:"UPDATE",

        DELETE:"DELETE",

        RESTORE:"RESTORE",

        READ:"READ",

        LOGIN:"LOGIN",

        LOGOUT:"LOGOUT",

        EXPORT:"EXPORT",

        IMPORT:"IMPORT",

        APPROVE:"APPROVE",

        CANCEL:"CANCEL",

        SECURITY:"SECURITY",

        SYSTEM:"SYSTEM"


    },





    get ACTION_CREATE(){

        return this.ACTIONS.CREATE;

    },


    get ACTION_UPDATE(){

        return this.ACTIONS.UPDATE;

    },


    get ACTION_DELETE(){

        return this.ACTIONS.DELETE;

    },


    get ACTION_RESTORE(){

        return this.ACTIONS.RESTORE;

    },





    register(){


        if(this.registered){

            Logger.log(
                "AuditConstants ALREADY REGISTERED"
            );

            return;

        }



        /*
            Legacy API
        */


        globalThis.ACTION_CREATE =
            this.ACTIONS.CREATE;


        globalThis.ACTION_UPDATE =
            this.ACTIONS.UPDATE;


        globalThis.ACTION_DELETE =
            this.ACTIONS.DELETE;


        globalThis.ACTION_RESTORE =
            this.ACTIONS.RESTORE;





        /*
            Modern API
        */


        globalThis.AuditActions =
            Object.freeze(
                this.ACTIONS
            );





        this.registered=true;



        Logger.log(
            "AUDIT CONSTANTS REGISTERED v"
            +
            this.version
        );


    },








    get(action){


        if(!action){

            return null;

        }


        const key =
            String(action)
            .trim()
            .toUpperCase();




        return this.ACTIONS[key]
            ||
            null;


    },







    has(action){


        return Boolean(
            this.get(action)
        );


    },







    list(){


        return Object
            .values(
                this.ACTIONS
            );


    },







    health(){


        return HealthContract.create(

            "AuditConstants",

            this.registered
                ?
                "OK"
                :
                "WARNING",


            {


                version:
                    this.version,


                registered:
                    this.registered,


                count:
                    this.list().length,


                actions:
                    this.list()


            }

        );


    }



};






AuditConstants.register();





globalThis.AuditConstants =
    AuditConstants;





Logger.log(
    "AuditConstants READY v"
    +
    AuditConstants.version
);