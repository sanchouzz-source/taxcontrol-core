console.log("EntityRegistry");


const EntityRegistry = {


CLIENT:{


entity:
ENTITY_NAMES.CLIENT,


table:
ENTITY_TABLES.CLIENT,


idField:
ENTITY_ID_FIELDS.CLIENT,



events:
EntityEvents.CLIENT,



audit:true



}



};



globalThis.EntityRegistry =
EntityRegistry;