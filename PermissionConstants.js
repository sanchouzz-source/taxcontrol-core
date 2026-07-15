console.log("PermissionConstants");


const PermissionConstants = {


    version:"0.3.0",



    CLIENT:{


        CREATE:"CLIENT_CREATE",

        READ:"CLIENT_READ",

        UPDATE:"CLIENT_UPDATE",

        DELETE:"CLIENT_DELETE",

        RESTORE:"CLIENT_RESTORE"


    },



    TRIP:{


        CREATE:"TRIP_CREATE",

        READ:"TRIP_READ",

        UPDATE:"TRIP_UPDATE",

        DELETE:"TRIP_DELETE",

        RESTORE:"TRIP_RESTORE"


    },



    FINANCE:{


        VIEW:"FINANCE_VIEW",

        CREATE:"FINANCE_CREATE",

        UPDATE:"FINANCE_UPDATE",

        DELETE:"FINANCE_DELETE"


    },



    REPORT:{


        VIEW:"REPORT_VIEW",

        EXPORT:"REPORT_EXPORT"


    },



    SYSTEM:{


        ADMIN:"SYSTEM_ADMIN",

        CONFIG:"SYSTEM_CONFIG",

        AUDIT_VIEW:"AUDIT_VIEW"


    },






    all(){


        return [

            ...Object.values(this.CLIENT),

            ...Object.values(this.TRIP),

            ...Object.values(this.FINANCE),

            ...Object.values(this.REPORT),

            ...Object.values(this.SYSTEM)

        ];


    },






    registerGlobal(){



        this.all()
        .forEach(permission=>{


            const key =
                "PERMISSION_" +
                permission;


            globalThis[key]=permission;


        });



        Logger.log(
            "PERMISSION CONSTANTS REGISTERED"
        );


    },







    health(){


        return HealthContract.create(

            "PermissionConstants",

            "OK",

            {

                version:this.version,

                permissions:
                    this.all().length

            }


        );


    }



};





PermissionConstants.registerGlobal();



globalThis.PermissionConstants =
    PermissionConstants;