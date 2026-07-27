// ============================================================
// TestEntityLifecycleMatrix v2.2.0
// ERP Entity Lifecycle Enterprise Test
// TaxControl ERP
//
// Compatible:
//
// SystemInit v2.5+
// RepositoryFactory v2.6+
// BaseRepository v5+
// EntityService v5+
// EntityValidator v1+
// EventBus v2+
// AuditLog v2+
// Versioning
// ============================================================


console.log("TestEntityLifecycleMatrix v2.2");



const TestEntityLifecycleMatrix = {


version:"2.2.0",




// ============================================================
// RUN
// ============================================================


run(options={}){


Logger.log(
"========== ENTITY LIFECYCLE MATRIX v2.2 START =========="
);



const result={


version:this.version,


timestamp:
new Date().toISOString(),



tests:{},



summary:{

total:0,

passed:0,

failed:0

}


};



const tests=[


["SYSTEM",this.testSystemEntity],


["CLIENT",this.testClient],


["TRIP",this.testTrip],


["KPI",this.testKPI],


["AUDIT",this.testAudit],


["VERSION",this.testVersion],


["EVENTS",this.testEvents],


["VALIDATION",this.testValidation],


["SERVICE_HEALTH",this.testServiceHealth]



];





tests.forEach(item=>{


const name=item[0];


const fn=item[1];



result.tests[name]=
this.execute(
name,
()=>fn.call(this)
);



});




Object.values(result.tests)
.forEach(t=>{


result.summary.total++;


if(t.status==="PASS"){

result.summary.passed++;

}
else{

result.summary.failed++;

}


});





Logger.log(
JSON.stringify(
result,
null,
2
)
);



Logger.log(
"========== ENTITY MATRIX COMPLETE =========="
);



return result;


},







// ============================================================
// EXECUTOR
// ============================================================


execute(name,fn){


const start=Date.now();


try{


return {


status:"PASS",

duration:
Date.now()-start,


result:
fn()


};


}
catch(e){


Logger.error(
name+
" FAILED "+
e.message
);



return {


status:"FAIL",

duration:
Date.now()-start,


error:e.message


};


}


},







// ============================================================
// HELPERS
// ============================================================


org(){


if(
typeof OrganizationContext!=="undefined"
&&
OrganizationContext.get
){

return OrganizationContext.get();

}


return "SYSTEM";


},







repoInfo(entity){


const repo =
RepositoryFactory.get(entity);



const meta =
RepositoryFactory.metadata?.[entity];



return {


exists:!!repo,


type:
meta?.type ||
"UNKNOWN",


version:
repo.version ||
"unknown"


};


},







// ============================================================
// SYSTEM ENTITY
// ============================================================


testSystemEntity(){


const entity=
"__TEST_DATABASE";



const created =
EntityService.create(
entity,
{

value:
"matrix-test"

}
);



const found =
EntityService.findById(
entity,
created.id
);



if(!found){

throw new Error(
"SYSTEM READ FAILED"
);

}



EntityService.delete(
entity,
created.id
);



return {


entity,


repository:
this.repoInfo(entity),


crud:"CREATE READ DELETE OK"


};


},







// ============================================================
// CLIENT
// ============================================================


testClient(){



const client =
EntityService.create(

"CLIENT",

{


OrganizationID:
this.org(),


Name:
"Matrix Client",


INN:
"7777777777",


Phone:
"+79990000001",


Email:
"matrix@test.ru",


Status:
"ACTIVE"


}

);




const read =
EntityService.findById(

"CLIENT",

client.ClientID

);



if(!read){

throw new Error(
"CLIENT READ FAILED"
);

}





EntityService.update(

"CLIENT",

client.ClientID,

{

Status:
"UPDATED"

}

);





EntityService.delete(

"CLIENT",

client.ClientID

);





EntityService.restore(

"CLIENT",

client.ClientID

);





const restored =
EntityService.findById(

"CLIENT",

client.ClientID

);



if(!restored){

throw new Error(
"CLIENT RESTORE FAILED"
);

}




return {


id:
client.ClientID,


repository:
this.repoInfo("CLIENT"),


lifecycle:
"FULL"


};


},







// ============================================================
// TRIP
// ============================================================


testTrip(){


const trip =
EntityService.create(

"TRIP",

{


OrganizationID:
this.org(),


Status:
"NEW",


Revenue:
10000,


ActualCost:
7000


}

);





const found =
EntityService.findById(

"TRIP",

trip.TripID

);



if(!found){

throw new Error(
"TRIP READ FAILED"
);

}





EntityService.update(

"TRIP",

trip.TripID,

{

Status:
"COMPLETED"

}

);





return {


id:
trip.TripID,


repository:
this.repoInfo("TRIP")


};


},







// ============================================================
// KPI
// ============================================================


testKPI(){


const kpi =
EntityService.create(

"KPI",

{

Name:
"MATRIX KPI",

Value:
100

}

);




const found =
EntityService.findById(

"KPI",

kpi.KPIID

);



if(!found){

throw new Error(
"KPI READ FAILED"
);

}



return {


id:
kpi.KPIID,


repository:
this.repoInfo("KPI")


};


},







// ============================================================
// AUDIT
// ============================================================


testAudit(){


if(
typeof AuditLog==="undefined"
){

return {
status:"SKIPPED"
};

}



if(
typeof AuditLog.write!=="function"
){

throw new Error(
"AuditLog.write missing"
);

}



return {


audit:
"READY"


};


},







// ============================================================
// VERSION
// ============================================================


testVersion(){


if(
typeof Versioning==="undefined"
){

return {
status:"SKIPPED"
};

}



return {


versioning:
"READY"


};


},







// ============================================================
// EVENTS
// ============================================================


testEvents(){


if(
typeof EventBus==="undefined"
){

throw new Error(
"EventBus missing"
);

}



return {


ready:
EventBus.ready===true,


version:
EventBus.version


};


},







// ============================================================
// VALIDATION
// ============================================================


testValidation(){


if(
typeof EntityValidator==="undefined"
){

return {


validation:
"SKIPPED"


};

}



let blocked=false;



try{


EntityService.create(

"TRIP",

{


OrganizationID:
this.org(),


UnknownField:
"BAD"


}

);



}
catch(e){


blocked=true;


}



if(!blocked){


throw new Error(
"EntityValidator does not block invalid fields"
);


}



return {


validation:
"OK"


};


},







// ============================================================
// SERVICE HEALTH
// ============================================================


testServiceHealth(){


if(
typeof EntityService==="undefined"
){

throw new Error(
"EntityService missing"
);

}



const health =
EntityService.health();



return {


status:
health.status,


version:
health.details?.version ||
EntityService.version


};


}



};





globalThis.TestEntityLifecycleMatrix =
TestEntityLifecycleMatrix;



globalThis.testEntityLifecycleMatrix =
function(){

return TestEntityLifecycleMatrix.run();

};



Logger.log(
"TestEntityLifecycleMatrix READY v"+
TestEntityLifecycleMatrix.version
);