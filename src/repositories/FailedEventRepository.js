// ============================================================
// FailedEventRepository v2.0.0
// Enterprise System Repository
// TaxControl ERP Core
//
// System Repository:
//
// Failed Events Storage
//
// Rules:
//
// - Append errors
// - Retry support
// - Status tracking
// - No hard delete
//
// Compatible:
//
// EntityMetadata v3+
// EntityRegistry v2.5+
// BaseRepository v5.7+
// RepositoryFactory v3+
// RepositoryRegistry v1.1+
// EventRetryQueue
// ============================================================


console.log(
"FailedEventRepository v2.0.0"
);





const FailedEventRepository = {


// ============================================================
// META
// ============================================================


version:"2.0.0",

entity:"FAILED_EVENT",

table:"FailedEvents",

initialized:false,

base:null,







// ============================================================
// INIT
// ============================================================


init(){


if(this.initialized){

return true;

}



if(
typeof BaseRepository!=="undefined"
){

this.base =
BaseRepository.createRepository(
this.entity
);

}



this.register();


this.initialized=true;



Logger.log(
"FailedEventRepository READY v"+
this.version
);



return true;


},







// ============================================================
// REGISTER
// ============================================================


register(){


try{


if(
typeof RepositoryFactory!=="undefined"
&&
RepositoryFactory.register
){


RepositoryFactory.register(

this.entity,

this,

{
force:true
}

);


}



if(
typeof RepositoryRegistry!=="undefined"
&&
RepositoryRegistry.register
){


RepositoryRegistry.register(

this.entity,

this

);


}



return true;


}
catch(e){


Logger.warn(
"FailedEventRepository register deferred "+
e.message
);


return false;


}


},







// ============================================================
// SAVE FAILED EVENT
// ============================================================


save(event,error){


if(!event){

throw new Error(
"FailedEventRepository.save event required"
);

}



const record={


ID:
event.id ||
IdService.generate(
this.entity
),



EventID:
event.id || "",



Entity:
event.entity || "",



Type:
event.type || "",



Payload:
JSON.stringify(
event
),



Error:

error && error.message
?
error.message
:
String(error),



Attempts:0,


Status:"FAILED",



CreatedAt:
new Date().toISOString(),



UpdatedAt:
new Date().toISOString()


};





if(
typeof Database!=="undefined"
&&
Database.insert
){


Database.insert(

this.table,

record

);


}
else
if(
this.base
&&
this.base.create
){


this.base.create(
record
);


}
else{


throw new Error(
"FailedEventRepository storage unavailable"
);

}






Logger.error(

"FAILED EVENT SAVED "+
record.EventID

);





return record;


},







// ============================================================
// FIND
// ============================================================


findAll(filters={}){


if(this.base){

return this.base.findAll(
filters
);

}



if(
Database.query
){

return Database.query(
this.table,
filters
);

}



return [];

},







getPending(){


return this.findAll({

Status:"FAILED"

});


},







findRetryable(
maxAttempts=5
){


const events =
this.getPending();



return events.filter(

e=>

Number(
e.Attempts || 0
)
<
maxAttempts

);


},







// ============================================================
// RETRY SUPPORT
// ============================================================


increaseAttempts(id){


return this.updateStatus(

id,

{

Attempts:
{
increment:1
},

Status:"RETRY",

UpdatedAt:
new Date().toISOString()

}

);


},







markCompleted(id){


return this.updateStatus(

id,

{

Status:"DONE",

UpdatedAt:
new Date().toISOString()

}

);


},







markFailed(id,error){


return this.updateStatus(

id,

{

Status:"FAILED",

Error:
error.message ||
String(error),

UpdatedAt:
new Date().toISOString()

}

);


},







updateStatus(id,data){


if(
this.base
&&
this.base.update
){

return this.base.update(
id,
data
);

}



if(
Database.update
){

return Database.update(

this.table,

id,

data

);

}



return null;


},







// ============================================================
// CLEANUP
// ============================================================


archiveCompleted(){


return this.findAll({

Status:"DONE"

});


},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){


return {


module:
"FailedEventRepository",


version:
this.version,


entity:
this.entity,


table:
this.table,


initialized:
this.initialized,


baseRepository:
typeof BaseRepository!=="undefined",



factory:

typeof RepositoryFactory!=="undefined"
&&
RepositoryFactory.has
?
RepositoryFactory.has(
this.entity
)
:
false,



timestamp:
new Date().toISOString()


};


},







// ============================================================
// HEALTH
// ============================================================


health(){


const data =
this.diagnostics();



const status =
data.baseRepository
?
"OK"
:
"WARNING";




if(
typeof HealthContract!=="undefined"
&&
HealthContract.create
){

return HealthContract.create(

"FailedEventRepository",

status,

data

);

}



return {

module:
"FailedEventRepository",

status,

...data

};


}



};









// ============================================================
// GLOBAL
// ============================================================


globalThis.FailedEventRepository =
FailedEventRepository;







// ============================================================
// SAFE START
// ============================================================


try{


FailedEventRepository.init();


}
catch(e){


Logger.warn(

"FailedEventRepository deferred "+
e.message

);


}







Logger.log(

"FailedEventRepository GLOBAL READY v"+
FailedEventRepository.version

);