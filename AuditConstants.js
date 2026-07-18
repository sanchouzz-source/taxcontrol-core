console.log("AuditConstants");


const AuditConstants = {


    version:"1.2.0",


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





    /*
        Совместимость со старым кодом

        AuditConstants.ACTION_CREATE
        AuditConstants.ACTION_UPDATE

    */


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
            Старый глобальный API
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
            Новый API
        */


        globalThis.AuditActions =
            this.ACTIONS;





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




        return this.ACTIONS[
            String(action)
            .toUpperCase()
        ]
        ||
        null;


    },







    has(action){


        return this.get(action)!==null;


    },







    list(){


        return Object.values(
            this.ACTIONS
        );


    },







    health(){


        return HealthContract.create(


            "AuditConstants",


            "OK",


            {


                version:
                    this.version,


                registered:
                    this.registered,


                actions:
                    this.list()


            }


        );


    }



};





/*
    Регистрация при загрузке
*/


AuditConstants.register();





globalThis.AuditConstants =
    AuditConstants;



Logger.log(
    "AuditConstants READY v"
    +
    AuditConstants.version
);