console.log("SecurityGuard");



const SecurityGuard = {


    version:"0.2.0",


    permissions:{},


    initialized:false,



    init(){



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



            CLIENT_CREATE:
                "CLIENT_CREATE",


            CLIENT_UPDATE:
                "CLIENT_UPDATE",


            CLIENT_DELETE:
                "CLIENT_DELETE",


            CLIENT_RESTORE:
                "CLIENT_RESTORE",




            TRIP_CREATE:
                "TRIP_CREATE",


            TRIP_UPDATE:
                "TRIP_UPDATE",


            TRIP_DELETE:
                "TRIP_DELETE",


            TRIP_RESTORE:
                "TRIP_RESTORE",



            FINANCE_VIEW:
                "FINANCE_VIEW",


            FINANCE_EDIT:
                "FINANCE_EDIT",



            REPORT_VIEW:
                "REPORT_VIEW",


            REPORT_EXPORT:
                "REPORT_EXPORT"



        };




        /*
            совместимость
            со старым кодом
        */


        globalThis.PERMISSION_CLIENT_CREATE =
            this.permissions.CLIENT_CREATE;


        globalThis.PERMISSION_CLIENT_UPDATE =
            this.permissions.CLIENT_UPDATE;


        globalThis.PERMISSION_CLIENT_DELETE =
            this.permissions.CLIENT_DELETE;


        globalThis.PERMISSION_CLIENT_RESTORE =
            this.permissions.CLIENT_RESTORE;



        globalThis.PERMISSION_TRIP_CREATE =
            this.permissions.TRIP_CREATE;


        globalThis.PERMISSION_TRIP_UPDATE =
            this.permissions.TRIP_UPDATE;


        globalThis.PERMISSION_TRIP_DELETE =
            this.permissions.TRIP_DELETE;



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




        const exists =

            Object.values(
                this.permissions
            )
            .includes(
                permission
            );





        if(!exists){


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