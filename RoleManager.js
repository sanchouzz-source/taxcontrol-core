console.log("RoleManager");


const RoleManager = {


version:"0.1.0",



rolePermissions:{},




init(){


this.rolePermissions={


ADMIN:

Object.values(
PermissionConstants.PERMISSIONS
),



DIRECTOR:[

PERMISSION_CLIENT_READ,
PERMISSION_CLIENT_CREATE,
PERMISSION_CLIENT_UPDATE,

PERMISSION_FINANCE_VIEW,
PERMISSION_REPORT_VIEW

],



MANAGER:[

PERMISSION_CLIENT_READ,
PERMISSION_CLIENT_CREATE,
PERMISSION_CLIENT_UPDATE,

PERMISSION_TRIP_CREATE,
PERMISSION_TRIP_UPDATE

],



ACCOUNTANT:[

PERMISSION_FINANCE_VIEW,
PERMISSION_FINANCE_EDIT,

PERMISSION_REPORT_VIEW,
PERMISSION_REPORT_EXPORT

],



DRIVER:[

PERMISSION_TRIP_VIEW,
PERMISSION_TRIP_UPDATE

]



};



Logger.log(
"RoleManager READY v"
+
this.version
);


},






hasPermission(

role,

permission

){


if(
!this.rolePermissions[role]
){

return false;

}


return (

this.rolePermissions[role]
.includes(
permission
)

);


},





health(){


return HealthContract.create(

"RoleManager",

"OK",

{

version:this.version,

roles:
Object.keys(
this.rolePermissions
)

}

);


}



};



globalThis.RoleManager =
RoleManager;