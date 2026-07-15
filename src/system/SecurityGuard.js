console.log("SecurityGuard");


const SecurityGuard = {


version:"0.4.0",


permissions:{},


currentUser:null,


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



TRIP_CREATE:"TRIP_CREATE",
TRIP_READ:"TRIP_READ",
TRIP_UPDATE:"TRIP_UPDATE",
TRIP_DELETE:"TRIP_DELETE",
TRIP_RESTORE:"TRIP_RESTORE",



ORGANIZATION_CREATE:"ORGANIZATION_CREATE",
ORGANIZATION_READ:"ORGANIZATION_READ",
ORGANIZATION_UPDATE:"ORGANIZATION_UPDATE",
ORGANIZATION_DELETE:"ORGANIZATION_DELETE",



USER_CREATE:"USER_CREATE",
USER_READ:"USER_READ",
USER_UPDATE:"USER_UPDATE",
USER_DELETE:"USER_DELETE",



EMPLOYEE_CREATE:"EMPLOYEE_CREATE",
EMPLOYEE_READ:"EMPLOYEE_READ",
EMPLOYEE_UPDATE:"EMPLOYEE_UPDATE",
EMPLOYEE_DELETE:"EMPLOYEE_DELETE",



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
"PERMISSION_"+key
]
=
this.permissions[key];


});




Logger.log(
"SECURITY PERMISSIONS REGISTERED"
);



},







check(permission){


return Object.values(
this.permissions
)
.includes(permission);


},







require(permission){



if(
!permission
){


throw new Error(
"SECURITY PERMISSION EMPTY"
);


}




const allowed =
this.check(permission);





if(!allowed){



Logger.error(

"SECURITY DENIED: "
+
permission

);



throw new Error(

"ACCESS DENIED: "
+
permission

);


}





Logger.log(

"PERMISSION OK: "
+
permission

);



return true;



},








// ===============================
// USER CONTEXT
// ===============================



setCurrentUser(user){



this.currentUser =
user || null;



Logger.log(

"SECURITY USER SET: "
+
(
user?.UserID ||
user?.Name ||
"SYSTEM"
)

);



},








getCurrentUser(){



if(!this.currentUser){



return {


UserID:
"SYSTEM",


Name:
"SYSTEM",


Role:
"SYSTEM",


OrganizationID:
"SYSTEM"



};


}




return this.currentUser;



},








clearUser(){



this.currentUser=null;



Logger.log(

"SECURITY USER CLEARED"

);



},







getCurrentUserId(){



return this.getCurrentUser()
.UserID;



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
this.initialized,



currentUser:
this.currentUser
?
(
this.currentUser.UserID ||
this.currentUser.Name
)
:
"SYSTEM"



}


);


}



};





globalThis.SecurityGuard =
SecurityGuard;