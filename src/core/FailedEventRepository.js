console.log("FailedEventRepository v1.0");


const FailedEventRepository={


version:"1.0.0",


save(event,error){


const record={


id:event.id,


entity:event.entity,


type:event.type,


payload:event,


error:error.message,


attempts:0,


status:"FAILED",


createdAt:
new Date().toISOString()


};



Logger.error(
"FAILED EVENT SAVED "+
JSON.stringify(record)
);



if(
typeof Database!=="undefined" &&
Database.insert
){

Database.insert(
"FailedEvents",
record
);

}



return record;


},




getPending(){


if(
typeof Database!=="undefined" &&
Database.query
){

return Database.query(
"FailedEvents",
{
status:"FAILED"
}
);

}


return [];

},



health(){

return HealthContract.create(
"FailedEventRepository",
"OK",
{
version:this.version
});

}


};



globalThis.FailedEventRepository =
FailedEventRepository;


Logger.log(
"FailedEventRepository READY v1.0.0"
);