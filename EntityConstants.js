console.log("EntityConstants");


const EntityConstants = {


version:"0.3.0",



ENTITY_NAMES:{


CLIENT:"CLIENT"


},



ENTITY_TABLES:{


CLIENT:"Clients"


},



ENTITY_ID_FIELDS:{


CLIENT:"ClientID"


},



ENTITY_CLIENT_TABLE:"Clients",



ACTIONS:{


CREATE:"CREATE",
UPDATE:"UPDATE",
DELETE:"DELETE",
RESTORE:"RESTORE"


},



PERMISSIONS:{


CLIENT_CREATE:"CLIENT_CREATE",
CLIENT_UPDATE:"CLIENT_UPDATE",
CLIENT_DELETE:"CLIENT_DELETE",
CLIENT_READ:"CLIENT_READ"


}



};





globalThis.EntityConstants =
EntityConstants;



globalThis.ENTITY_NAMES =
EntityConstants.ENTITY_NAMES;



globalThis.ENTITY_TABLES =
EntityConstants.ENTITY_TABLES;



globalThis.ENTITY_ID_FIELDS =
EntityConstants.ENTITY_ID_FIELDS;



globalThis.ENTITY_CLIENT =
EntityConstants.ENTITY_NAMES.CLIENT;



globalThis.ENTITY_CLIENT_TABLE =
EntityConstants.ENTITY_TABLES.CLIENT;



globalThis.ENTITY_CLIENT_ID =
EntityConstants.ENTITY_ID_FIELDS.CLIENT;



globalThis.ACTION_CREATE =
EntityConstants.ACTIONS.CREATE;


globalThis.ACTION_UPDATE =
EntityConstants.ACTIONS.UPDATE;


globalThis.ACTION_DELETE =
EntityConstants.ACTION_DELETE;


globalThis.ACTION_RESTORE =
EntityConstants.ACTIONS.RESTORE;



globalThis.PERMISSION_CLIENT_CREATE =
EntityConstants.PERMISSIONS.CLIENT_CREATE;


globalThis.PERMISSION_CLIENT_UPDATE =
EntityConstants.PERMISSIONS.CLIENT_UPDATE;


globalThis.PERMISSION_CLIENT_DELETE =
EntityConstants.PERMISSIONS.CLIENT_DELETE;


globalThis.PERMISSION_CLIENT_READ =
EntityConstants.PERMISSIONS.CLIENT_READ;



Logger.log(
"EntityConstants READY v"
+
EntityConstants.version
);