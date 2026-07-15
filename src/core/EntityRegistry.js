console.log("EntityRegistry");


const EntityRegistry = {


version:"0.9.0",







CLIENT:{


entity:"CLIENT",


module:"core",


table:"Clients",


idField:"ClientID",


audit:true,


softDelete:true,


timestamps:true,



get validator(){

    return globalThis.ClientValidator;

},





permissions:{


create:
PERMISSION_CLIENT_CREATE,


read:
PERMISSION_CLIENT_READ,


update:
PERMISSION_CLIENT_UPDATE,


delete:
PERMISSION_CLIENT_DELETE,


restore:
PERMISSION_CLIENT_RESTORE


},





events:{


created:
"CLIENT_CREATED",


updated:
"CLIENT_UPDATED",


deleted:
"CLIENT_DELETED",


restored:
"CLIENT_RESTORED"


}



},










TRIP:{


entity:"TRIP",


module:"core",


table:"Trips",


idField:"TripID",


audit:true,


softDelete:true,


timestamps:true,



get validator(){

    return globalThis.TripValidator;

},





permissions:{


create:
PERMISSION_TRIP_CREATE,


read:
PERMISSION_TRIP_READ,


update:
PERMISSION_TRIP_UPDATE,


delete:
PERMISSION_TRIP_DELETE,


restore:
PERMISSION_TRIP_RESTORE


},






events:{


created:
"TRIP_CREATED",


updated:
"TRIP_UPDATED",


deleted:
"TRIP_DELETED",


restored:
"TRIP_RESTORED"


}



},










CLIENT_FINANCE_PROFILE:{


entity:"CLIENT_FINANCE_PROFILE",


module:"finance",


table:"ClientFinanceProfiles",


idField:"FinanceProfileID",


audit:true,


softDelete:false,


timestamps:true,



permissions:{


create:
PERMISSION_CLIENT_CREATE,


read:
PERMISSION_CLIENT_READ,


update:
PERMISSION_CLIENT_UPDATE,


delete:
PERMISSION_CLIENT_DELETE


},





events:{


created:
"CLIENT_FINANCE_PROFILE_CREATED",


updated:
"CLIENT_FINANCE_PROFILE_UPDATED",


deleted:
"CLIENT_FINANCE_PROFILE_DELETED"


}



}







};






globalThis.EntityRegistry =
EntityRegistry;