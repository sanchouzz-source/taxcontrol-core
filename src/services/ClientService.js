// ============================================================
// ClientService v1.0.0
// TaxControl ERP
//
// Business service for clients
// ============================================================


console.log(
"ClientService v1.0.0"
);



const ClientService = {


version:"1.0.0",


entity:"CLIENT",


initialized:false,



// ============================================================
// INIT
// ============================================================


init(){


if(this.initialized){

return true;

}



Logger.log(
"ClientService INIT"
);



this.initialized=true;



return true;

},




// ============================================================
// CREATE CLIENT
// ============================================================


create(data){



this.validate(data);



const repository =
RepositoryFactory.get(
this.entity
);



const exists =
this.findDuplicate(
data
);



if(exists){

throw new Error(

"Client duplicate found "

+
exists.ClientID

);

}




const client =
repository.create(
data
);




this.publishEvent(
"CLIENT_CREATED",
client
);



this.audit(
"CREATE",
client
);



return client;


},




// ============================================================
// FIND DUPLICATE
// ============================================================


findDuplicate(data){


const repository =
RepositoryFactory.get(
this.entity
);



if(
!data.INN
){

return null;

}



const result =
repository.findBy(

"INN",
data.INN

);



return result || null;


},




// ============================================================
// VALIDATION
// ============================================================


validate(data){


if(
!data.OrganizationID
){

throw new Error(
"OrganizationID required"
);

}



if(
!data.Name
){

throw new Error(
"Client Name required"
);

}



return true;

},




// ============================================================
// EVENTS
// ============================================================


publishEvent(
name,
data
){


if(
EventBus &&
EventBus.publish
){


EventBus.publish(
name,
data
);


}



},




// ============================================================
// AUDIT
// ============================================================


audit(
action,
client
){


if(
typeof AuditRepository==="undefined"
){

return;

}



AuditRepository.create({

Action:
action,


Entity:
this.entity,


EntityID:
client.ClientID,


After:
client,


Source:
"ClientService"


});


},




health(){


return {


module:
"ClientService",


version:
this.version,


status:
this.initialized
?
"OK"
:
"NOT_READY"


};


}


};



globalThis.ClientService =
ClientService;



ClientService.init();