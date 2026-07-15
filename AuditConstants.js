console.log("AuditConstants");


const AuditConstants = {


    version:"1.0.0",


    ACTION_CREATE:
        "CREATE",


    ACTION_UPDATE:
        "UPDATE",


    ACTION_DELETE:
        "DELETE",


    ACTION_RESTORE:
        "RESTORE",



    register(){


        globalThis.ACTION_CREATE =
            this.ACTION_CREATE;


        globalThis.ACTION_UPDATE =
            this.ACTION_UPDATE;


        globalThis.ACTION_DELETE =
            this.ACTION_DELETE;


        globalThis.ACTION_RESTORE =
            this.ACTION_RESTORE;



        Logger.log(
            "AUDIT CONSTANTS REGISTERED"
        );


    },



    health(){


        return HealthContract.create(

            "AuditConstants",

            "OK",

            {

                version:this.version,


                actions:[

                    this.ACTION_CREATE,

                    this.ACTION_UPDATE,

                    this.ACTION_DELETE,

                    this.ACTION_RESTORE

                ]

            }

        );


    }



};



// регистрация при загрузке

AuditConstants.register();



globalThis.AuditConstants =
    AuditConstants;