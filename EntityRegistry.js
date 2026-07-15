console.log("EntityRegistry");



const EntityRegistry = {


version:"0.5.0",



CLIENT:{


entity:
ENTITY_CLIENT,


table:
ENTITY_CLIENT_TABLE,


idField:
ENTITY_CLIENT_ID,


audit:true,



events:{


created:
EntityEvents.CLIENT.CREATED,


updated:
EntityEvents.CLIENT.UPDATED,


deleted:
EntityEvents.CLIENT.DELETED,


restored:
EntityEvents.CLIENT.RESTORED


},



permissions:{


create:
PERMISSION_CLIENT_CREATE,


update:
PERMISSION_CLIENT_UPDATE,


delete:
PERMISSION_CLIENT_DELETE,


read:
PERMISSION_CLIENT_READ


}



},






TRIP:{


entity:
"TRIP",


table:
"Trips",


idField:
"TripID",



audit:true,



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



permissions:{


create:
"TRIP_CREATE",


update:
"TRIP_UPDATE",


delete:
"TRIP_DELETE",


read:
"TRIP_READ"


}



}



};





globalThis.EntityRegistry =
EntityRegistry;



console.log(
"EntityRegistry READY v"
+
EntityRegistry.version
);