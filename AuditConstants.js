console.log("AuditConstants");


const AuditConstants = {


    version:"1.1.0",



    ACTIONS:{


        CREATE:
            "CREATE",


        UPDATE:
            "UPDATE",


        DELETE:
            "DELETE",


        RESTORE:
            "RESTORE",


        READ:
            "READ",


        LOGIN:
            "LOGIN",


        LOGOUT:
            "LOGOUT",


        EXPORT:
            "EXPORT",


        IMPORT:
            "IMPORT",


        APPROVE:
            "APPROVE",


        CANCEL:
            "CANCEL",


        SECURITY:
            "SECURITY",


        SYSTEM:
            "SYSTEM"


    },





    register(){



        /*
        совместимость
        со старым кодом
        */


        globalThis.ACTION_CREATE =
            this.ACTIONS.CREATE;


        globalThis.ACTION_UPDATE =
            this.ACTIONS.UPDATE;


        globalThis.ACTION_DELETE =
            this.ACTIONS.DELETE;


        globalThis.ACTION_RESTORE =
            this.ACTIONS.RESTORE;



        globalThis.AuditActions =
            this.ACTIONS;




        Logger.log(

            "AUDIT CONSTANTS REGISTERED v"
            +
            this.version

        );


    },





    get(action){


        return this.ACTIONS[action] || null;


    },





    has(action){


        return Object
            .values(this.ACTIONS)
            .includes(action);


    },





    list(){


        return Object
            .values(this.ACTIONS);


    },





    health(){



        return HealthContract.create(


            "AuditConstants",


            "OK",


            {


                version:
                    this.version,


                actions:
                    this.list()


            }


        );


    }



};






AuditConstants.register();



globalThis.AuditConstants =
    AuditConstants;