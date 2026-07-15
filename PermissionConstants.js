console.log("PermissionConstants");



const PermissionConstants = {


version:"1.1.0",



CLIENT_CREATE:
    "CLIENT_CREATE",


CLIENT_READ:
    "CLIENT_READ",


CLIENT_UPDATE:
    "CLIENT_UPDATE",


CLIENT_DELETE:
    "CLIENT_DELETE",


CLIENT_RESTORE:
    "CLIENT_RESTORE",



TRIP_CREATE:
    "TRIP_CREATE",


TRIP_READ:
    "TRIP_READ",


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
    "REPORT_EXPORT",





register(){



Object.keys(this)

.forEach(key=>{


if(
typeof this[key]==="string"
){


globalThis[
"PERMISSION_"+key
]=
this[key];


}


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

Object.keys(this)

.filter(k=>

typeof this[k]==="string"

)


}


);



}



};





PermissionConstants.register();



globalThis.PermissionConstants =
PermissionConstants;