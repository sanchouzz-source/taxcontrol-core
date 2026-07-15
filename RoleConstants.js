console.log("RoleConstants");


const RoleConstants = {


version:"0.1.0",


ROLES:{


    ADMIN:"ADMIN",

    DIRECTOR:"DIRECTOR",

    MANAGER:"MANAGER",

    ACCOUNTANT:"ACCOUNTANT",

    DISPATCHER:"DISPATCHER",

    DRIVER:"DRIVER",


    VIEWER:"VIEWER"


}



};


globalThis.RoleConstants =
RoleConstants;


Logger.log(
"ROLE CONSTANTS READY v"
+
RoleConstants.version
);