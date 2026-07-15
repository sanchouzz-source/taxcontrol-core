console.log("SecurityGuard");


const SecurityGuard = {


    version:"0.2.1",


    permissions:{},


    initialized:false,



    init(){


        if(this.initialized){

            Logger.log(
                "SecurityGuard ALREADY READY"
            );

            return;

        }


        this.registerPermissions();


        this.initialized=true;


        Logger.log(

            "SecurityGuard READY v"
            +
            this.version

        );


    },




    registerPermissions(){


       this.permissions={


    CLIENT_CREATE:"CLIENT_CREATE",

    CLIENT_READ:"CLIENT_READ",

    CLIENT_UPDATE:"CLIENT_UPDATE",

    CLIENT_DELETE:"CLIENT_DELETE",

    CLIENT_RESTORE:"CLIENT_RESTORE",


    ORGANIZATION_CREATE:"ORGANIZATION_CREATE",

    ORGANIZATION_READ:"ORGANIZATION_READ",

    ORGANIZATION_UPDATE:"ORGANIZATION_UPDATE",

    ORGANIZATION_DELETE:"ORGANIZATION_DELETE",

    ORGANIZATION_RESTORE:"ORGANIZATION_RESTORE",


    USER_CREATE:"USER_CREATE",
    USER_READ:"USER_READ",
    USER_UPDATE:"USER_UPDATE",
    USER_DELETE:"USER_DELETE",

    EMPLOYEE_CREATE:"EMPLOYEE_CREATE",
    EMPLOYEE_READ:"EMPLOYEE_READ",
    EMPLOYEE_UPDATE:"EMPLOYEE_UPDATE",
    EMPLOYEE_DELETE:"EMPLOYEE_DELETE",



    TRIP_CREATE:"TRIP_CREATE",

    TRIP_READ:"TRIP_READ",

    TRIP_UPDATE:"TRIP_UPDATE",

    TRIP_DELETE:"TRIP_DELETE",

    TRIP_RESTORE:"TRIP_RESTORE",



    FINANCE_VIEW:"FINANCE_VIEW",

    FINANCE_EDIT:"FINANCE_EDIT",



    REPORT_VIEW:"REPORT_VIEW",

    REPORT_EXPORT:"REPORT_EXPORT"


};



        Object.keys(
            this.permissions
        )
        .forEach(key=>{


            globalThis[
                "PERMISSION_" + key
            ] =
                this.permissions[key];


        });



        Logger.log(
            "SECURITY PERMISSIONS REGISTERED"
        );


    },




    check(permission){


        if(!permission){

            Logger.warn(
                "SECURITY CHECK WITHOUT PERMISSION"
            );

            return false;

        }



        const allowed =
            Object.values(
                this.permissions
            )
            .includes(
                permission
            );



        if(!allowed){


            Logger.warn(

                "UNKNOWN PERMISSION: "
                +
                permission

            );


            return false;

        }



        Logger.log(

            "PERMISSION OK: "
            +
            permission

        );



        return true;


    },




    health(){


        return HealthContract.create(

            "SecurityGuard",

            this.initialized
            ?
            "OK"
            :
            "WARNING",


            {

                version:this.version,

                permissions:
                    Object.keys(
                        this.permissions
                    ),

                initialized:
                    this.initialized

            }


        );


    }



};



globalThis.SecurityGuard =
    SecurityGuard;