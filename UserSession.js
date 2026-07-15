console.log("UserSession");


const UserSession = {


version:"0.1.0",


current:null,



login(user){


this.current={


    UserID:user.UserID,

    OrganizationID:
        user.OrganizationID,


    Role:
        user.Role,


    LoginAt:
        new Date()
        .toISOString()


};



Logger.log(

"SESSION LOGIN "
+
this.current.UserID
+
" "
+
this.current.Role

);


},





logout(){


Logger.log(
"SESSION LOGOUT "
+
(this.current?.UserID || "")
);


this.current=null;


},





getUser(){


return this.current;


},





getRole(){


return this.current
?
this.current.Role
:
null;


},





isAuthenticated(){


return !!this.current;


},





health(){


return HealthContract.create(

"UserSession",

this.current
?
"OK"
:
"WARNING",

{

version:this.version,

authenticated:
!!this.current

}

);


}



};



globalThis.UserSession =
UserSession;