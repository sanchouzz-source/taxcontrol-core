console.log("EntityEvents");



const EntityEvents = {



version:"0.6.0",




/*
=====================================
CLIENT
=====================================
*/


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







/*
=====================================
TRIP
=====================================
*/


TRIP:{


CREATED:
"TRIP_CREATED",

UPDATED:
"TRIP_UPDATED",

DELETED:
"TRIP_DELETED",

RESTORED:
"TRIP_RESTORED"


},







/*
=====================================
TRANSPORT ORDER
=====================================
*/


TRANSPORT_ORDER:{


CREATED:
"TRANSPORT_ORDER_CREATED",

UPDATED:
"TRANSPORT_ORDER_UPDATED",

DELETED:
"TRANSPORT_ORDER_DELETED",

RESTORED:
"TRANSPORT_ORDER_RESTORED"


},







/*
=====================================
CARRIER
=====================================
*/


CARRIER:{


CREATED:
"CARRIER_CREATED",

UPDATED:
"CARRIER_UPDATED",

DELETED:
"CARRIER_DELETED",

RESTORED:
"CARRIER_RESTORED"


},







/*
=====================================
DRIVER
=====================================
*/


DRIVER:{


CREATED:
"DRIVER_CREATED",

UPDATED:
"DRIVER_UPDATED",

DELETED:
"DRIVER_DELETED",

RESTORED:
"DRIVER_RESTORED"


},







/*
=====================================
VEHICLE
=====================================
*/


VEHICLE:{


CREATED:
"VEHICLE_CREATED",

UPDATED:
"VEHICLE_UPDATED",

DELETED:
"VEHICLE_DELETED",

RESTORED:
"VEHICLE_RESTORED"


},







/*
=====================================
ROUTE
=====================================
*/


ROUTE:{


CREATED:
"ROUTE_CREATED",

UPDATED:
"ROUTE_UPDATED",

DELETED:
"ROUTE_DELETED",

RESTORED:
"ROUTE_RESTORED"


},







/*
=====================================
CARGO
=====================================
*/


CARGO:{


CREATED:
"CARGO_CREATED",

UPDATED:
"CARGO_UPDATED",

DELETED:
"CARGO_DELETED",

RESTORED:
"CARGO_RESTORED"


},







/*
=====================================
HELPERS
=====================================
*/


list(){


return [

"CLIENT",

"TRIP",

"TRANSPORT_ORDER",

"CARRIER",

"DRIVER",

"VEHICLE",

"ROUTE",

"CARGO"


];


},






all(){


const events=[];


this.list()
.forEach(entity=>{


    const group=this[entity];


    Object.keys(group)
    .forEach(action=>{


        events.push(
            group[action]
        );


    });


});


return events;


},







lifecycle(entity){


if(!this[entity]){


    return [];

}


return Object.values(
    this[entity]
);


}





};







globalThis.EntityEvents =
EntityEvents;





Logger.log(
"EntityEvents READY v"
+
EntityEvents.version
);