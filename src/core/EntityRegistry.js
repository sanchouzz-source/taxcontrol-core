console.log("EntityRegistry");



const EntityRegistry = {


version:"0.6.0",




CLIENT:{


entity:"CLIENT",


table:"Clients",


idField:"ClientID",



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



validator:
ClientValidator,



events:{


created:
"CLIENT_CREATED",


updated:
"CLIENT_UPDATED",


deleted:
"CLIENT_DELETED",


restored:
"CLIENT_RESTORED"


},



audit:true


},


TRIP:{


entity:"TRIP",


table:"Trips",


idField:"TripID",



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



validator:
TripValidator,



events:{


created:
"TRIP_CREATED",


updated:
"TRIP_UPDATED",


deleted:
"TRIP_DELETED",


restored:
"TRIP_RESTORED"


},



audit:true


}



};






globalThis.EntityRegistry =
EntityRegistry;



console.log(
"EntityRegistry READY v"
+
EntityRegistry.version
);