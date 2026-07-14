console.log("EntityRegistry");



const EntityRegistry = {



CLIENT:{


entity:
"CLIENT",



table:
"Clients",



idField:
"ClientID",



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




console.log(
"EntityRegistry READY"
);