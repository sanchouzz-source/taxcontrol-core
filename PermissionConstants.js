console.log("PermissionConstants");


const PermissionConstants = {


    CLIENT_CREATE:
        "CLIENT_CREATE",

    CLIENT_UPDATE:
        "CLIENT_UPDATE",

    CLIENT_DELETE:
        "CLIENT_DELETE",


    TRIP_CREATE:
        "TRIP_CREATE",

    TRIP_UPDATE:
        "TRIP_UPDATE",

    TRIP_DELETE:
        "TRIP_DELETE",


    PAYMENT_CREATE:
        "PAYMENT_CREATE",

    PAYMENT_UPDATE:
        "PAYMENT_UPDATE",


    DOCUMENT_CREATE:
        "DOCUMENT_CREATE"


};



globalThis.PermissionConstants =
    PermissionConstants;



// совместимость с Repository
globalThis.PERMISSION_CLIENT_CREATE =
    PermissionConstants.CLIENT_CREATE;


globalThis.PERMISSION_CLIENT_UPDATE =
    PermissionConstants.CLIENT_UPDATE;


globalThis.PERMISSION_CLIENT_DELETE =
    PermissionConstants.CLIENT_DELETE;