console.log("EntityRegistry");


const EntityRegistry = {


version:"0.3.0",



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


}



};




globalThis.EntityRegistry =
EntityRegistry;




Logger.log(
"EntityRegistry READY v"
+
EntityRegistry.version
);