console.log("ClientRepository");


const ClientRepository =
BaseRepository.createRepository({

entity:"Client",

table:"Clients",

prefix:"Clients",


permissions:{

CREATE:"CLIENT_CREATE",

READ:"CLIENT_READ",

UPDATE:"CLIENT_UPDATE",

DELETE:"CLIENT_DELETE",

RESTORE:"CLIENT_RESTORE"

},


events:{

CREATED:"CLIENT_CREATED",

UPDATED:"CLIENT_UPDATED",

DELETED:"CLIENT_DELETED",

RESTORED:"CLIENT_RESTORED"

}



});


globalThis.ClientRepository =
ClientRepository;