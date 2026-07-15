console.log("EntityEvents");



const EntityEvents = {



version:"0.4.0",




CLIENT:{


CREATED:
"CLIENT_CREATED",


UPDATED:
"CLIENT_UPDATED",


DELETED:
"CLIENT_DELETED",


RESTORED:
"CLIENT_RESTORED"


},





TRIP:{


CREATED:
"TRIP_CREATED",


UPDATED:
"TRIP_UPDATED",


DELETED:
"TRIP_DELETED",


RESTORED:
"TRIP_RESTORED"


}



};





globalThis.EntityEvents =
EntityEvents;



console.log(
"EntityEvents READY v"
+
EntityEvents.version
);