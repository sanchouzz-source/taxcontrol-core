console.log("EntityRegistry");



const EntityRegistry = {


version:"0.6.0",




CLIENT:{


version:"0.1.0",


entity:
EntityConstants.CLIENT,


table:
EntityConstants.TABLES.CLIENT,


idField:
EntityConstants.IDS.CLIENT,


metadata:
EntityMetadata.CLIENT,


audit:true,


softDelete:true,


timestamps:true,



events:{


created:
EntityEvents.CLIENT.CREATED,


updated:
EntityEvents.CLIENT.UPDATED,


deleted:
EntityEvents.CLIENT.DELETED,


restored:
EntityEvents.CLIENT.RESTORED


}



},






TRIP:{


version:"0.1.0",


entity:
EntityConstants.TRIP,


table:
EntityConstants.TABLES.TRIP,


idField:
EntityConstants.IDS.TRIP,


metadata:
EntityMetadata.TRIP,


audit:true,


softDelete:true,


timestamps:true,



events:{


created:
EntityEvents.TRIP.CREATED,


updated:
EntityEvents.TRIP.UPDATED,


deleted:
EntityEvents.TRIP.DELETED,


restored:
EntityEvents.TRIP.RESTORED


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