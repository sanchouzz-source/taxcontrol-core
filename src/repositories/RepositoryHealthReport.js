// ============================================================
// RepositoryHealthReport v2.1.0
// TaxControl ERP Core
//
// Enterprise Repository Diagnostic
//
// Compatible:
//
// RepositoryRegistry v2.1+
// RepositoryFactory v3.1+
// EntityRegistry v2.6+
// SchemaRegistry v4+
// BaseRepository v5.7+
//
// ============================================================


console.log(
"RepositoryHealthReport v2.1.0"
);



const RepositoryHealthReport = {


version:"2.1.0",







// ============================================================
// CHECK HELPERS
// ============================================================


checkFactory(entity){


try{


return (

typeof RepositoryFactory!=="undefined"

&&

typeof RepositoryFactory.has==="function"

&&

RepositoryFactory.has(entity)

);


}
catch(e){

return false;

}


},







checkEntity(entity){


try{


if(
typeof EntityRegistry==="undefined"
){

return false;

}



if(
EntityRegistry.has
){

return EntityRegistry.has(entity);

}



return !!EntityRegistry.get?.(entity);



}
catch(e){

return false;

}


},







checkSchema(entity){


try{


if(
typeof SchemaRegistry==="undefined"
){

return false;

}



return !!SchemaRegistry.get?.(
entity
);



}
catch(e){

return false;

}


},







checkRepositoryRegistry(entity){


try{


return (

typeof RepositoryRegistry!=="undefined"

&&

RepositoryRegistry.has(entity)

);



}
catch(e){

return false;

}


},







checkBaseRepository(){


return (

typeof BaseRepository!=="undefined"

);


},







// ============================================================
// RUN
// ============================================================


run(){


if(
typeof RepositoryRegistry==="undefined"
){

throw new Error(
"RepositoryRegistry unavailable"
);

}



const result=[];



RepositoryRegistry.list()
.forEach(entity=>{


let repo=null;

let meta=null;

let error=null;



try{


repo =
RepositoryRegistry.get(
entity
);


}
catch(e){


error=e.message;


}







try{


if(
repo?.getMeta
){

meta =
repo.getMeta();

}


}
catch(e){


error =
error ||
e.message;


}







const item={


repositoryName:

repo?.constructor?.name
||
entity,



entity,


version:

repo?.version
||
"-",




table:

meta?.table
||
repo?.table
||
"-",




idField:

meta?.idField
||
"-",





repositoryLoaded:

!!repo,



repositoryRegistry:

this.checkRepositoryRegistry(
entity
),



entityRegistry:

this.checkEntity(
entity
),




metadata:

!!meta,




schema:

this.checkSchema(
entity
),




baseRepository:

this.checkBaseRepository(),




factory:

this.checkFactory(
entity
),




error:error||"",





status:

(

repo

&&

!error

&&

this.checkBaseRepository()

)

?

"OK"

:

"WARNING"



};





result.push(
item
);



});



return result;


},







// ============================================================
// SUMMARY
// ============================================================


summary(report=[]){


const total =
report.length;


const ok =
report.filter(
x=>
x.status==="OK"
)
.length;



return {


total,


ok,


warning:
total-ok,



readyPercent:

total

?

Math.round(
ok/total*100
)

:

0



};


},







// ============================================================
// ARCHITECTURE READINESS
// ============================================================


readiness(){



return {


repositoryLayer:

typeof RepositoryRegistry!=="undefined"
&&
RepositoryRegistry.count()>0,



factoryLayer:

typeof RepositoryFactory!=="undefined",



schemaLayer:

typeof SchemaRegistry!=="undefined",



serviceLayer:

typeof EntityService!=="undefined",



eventLayer:

typeof EventBus!=="undefined",



mobileReady:

typeof ApiGateway!=="undefined"



};


},







// ============================================================
// PRINT
// ============================================================


print(){


const report =
this.run();



const summary =
this.summary(
report
);



Logger.log(
"================================"
);



Logger.log(
"REPOSITORY HEALTH REPORT v"+
this.version
);



Logger.log(
"================================"
);



Logger.log(

"TOTAL="+
summary.total+

" OK="+
summary.ok+

" WARNING="+
summary.warning+

" READY="+
summary.readyPercent+
"%"

);





report.forEach(r=>{


Logger.log(

[
r.entity,

r.table,

r.status,

"Factory="+r.factory,

"Schema="+r.schema,

"Registry="+r.repositoryRegistry

]
.join(
" | "
)

);



if(r.error){

Logger.warn(
r.entity+
": "+
r.error
);

}



});



return report;


},







// ============================================================
// DETAILS
// ============================================================


details(){


const report =
this.run();



return {


version:this.version,


summary:
this.summary(
report
),



readiness:
this.readiness(),



repositories:
report



};


},







// ============================================================
// HEALTH
// ============================================================


health(){


const data =
this.details();



const status =

data.summary.readyPercent>=90

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

"RepositoryHealthReport",

status,

data

);


}



return {


module:"RepositoryHealthReport",

status,

...data


};



}



};








globalThis.RepositoryHealthReport =
RepositoryHealthReport;







Logger.log(

"RepositoryHealthReport READY v"+
RepositoryHealthReport.version

);