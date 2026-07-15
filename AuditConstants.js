console.log("AuditConstants");



const AuditConstants={


version:"0.2.0",




ACTION:{


CREATE:"CREATE",

READ:"READ",

UPDATE:"UPDATE",

DELETE:"DELETE",

RESTORE:"RESTORE"


},





ENTITY:{


CLIENT:"CLIENT",

TRIP:"TRIP",

FINANCE:"FINANCE",

DOCUMENT:"DOCUMENT",

USER:"USER"


},







EVENT:{



CLIENT_CREATED:
"CLIENT_CREATED",


CLIENT_UPDATED:
"CLIENT_UPDATED",


CLIENT_DELETED:
"CLIENT_DELETED",


CLIENT_RESTORED:
"CLIENT_RESTORED",





TRIP_CREATED:
"TRIP_CREATED",


TRIP_UPDATED:
"TRIP_UPDATED",


TRIP_DELETED:
"TRIP_DELETED",


TRIP_RESTORED:
"TRIP_RESTORED"



},







AUDIT_TYPES:{


SYSTEM:
"SYSTEM",


USER:
"USER",


SECURITY:
"SECURITY",


DATA:
"DATA"


},








createRecord(

action,
entity,
before,
after

){


return {


Action:action,


Entity:entity,


Before:
before || null,


After:
after || null,


Timestamp:
new Date()


};


},







health(){


return HealthContract.create(

"AuditConstants",

"OK",

{

version:this.version,

actions:
Object.keys(
this.ACTION
).length,


entities:
Object.keys(
this.ENTITY
).length


}

);


}




};




globalThis.AuditConstants =
AuditConstants;