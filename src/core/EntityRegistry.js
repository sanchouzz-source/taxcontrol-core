console.log("EntityRegistry");


const EntityRegistry = {


version:"0.7.0",


CLIENT:{


entity:"CLIENT",

table:"Clients",

idField:"ClientID",


validator:
ClientValidator,


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

table:"Trips",

idField:"TripID",


validator:
TripValidator,


permissions:{


create:
PERMISSION_TRIP_CREATE,


read:
PERMISSION_TRIP_READ,


update:
PERMISSION_TRIP_UPDATE,


delete:
PERMISSION_TRIP_DELETE


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



}



};



globalThis.EntityRegistry =
EntityRegistry;