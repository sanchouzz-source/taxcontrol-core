// ============================================================
// RepositoryHealthReport v2.0.0
// TaxControl ERP Core
//
// Enterprise Repository Diagnostic
//
// Checks:
//
// Repository
// EntityRegistry
// EntityMetadata
// SchemaRegistry
// BaseRepository
// RepositoryFactory
// RepositoryRegistry
//
// Compatible:
//
// RepositoryRegistry v2+
// RepositoryFactory v3.1+
// EntityRegistry v2.6+
// SchemaRegistry v4+
// BaseRepository v5.7+
//
// ============================================================


console.log(
"RepositoryHealthReport v2.0.0"
);





const RepositoryHealthReport = {


// ============================================================
// META
// ============================================================


version:"2.0.0",






// ============================================================
// SAFE FACTORY CHECK
// ============================================================


checkFactory(entity){


try{


if(
typeof RepositoryFactory==="undefined"
){

return false;

}



if(
typeof RepositoryFactory.has!=="function"
){

return false;

}



return RepositoryFactory.has(
entity
);



}
catch(e){


Logger.warn(

"Factory check skipped "
+
entity+
": "+
e.message

);



return false;


}


},







// ============================================================
// ENTITY CHECK
// ============================================================


checkEntity(entity){


try{


if(
typeof EntityRegistry==="undefined"
){

return false;

}



if(
typeof EntityRegistry.has==="function"
){

return EntityRegistry.has(
entity
);

}



if(
typeof EntityRegistry.get==="function"
){

return !!EntityRegistry.get(
entity
);

}



return false;



}
catch(e){


return false;


}


},







// ============================================================
// SCHEMA CHECK
// ============================================================


checkSchema(entity){


try{


if(
typeof SchemaRegistry==="undefined"
){

return false;

}



if(
typeof SchemaRegistry.get==="function"
){

return !!SchemaRegistry.get(
entity
);

}



return false;



}
catch(e){


return false;


}


},







// ============================================================
// MAIN RUN
// ============================================================


run(){


const result=[];



if(
typeof RepositoryRegistry==="undefined"
){

throw new Error(
"RepositoryRegistry unavailable"
);

}



const repositories =
RepositoryRegistry.list();





repositories.forEach(entity=>{


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






// ----------------------------
// Metadata
// ----------------------------


try{


if(
repo &&
typeof repo.getMeta==="function"
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


repository:

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






repository:

!!repo,



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

typeof BaseRepository!=="undefined",



factory:

this.checkFactory(
entity
),



registry:true,



error:error || "",




status:

(

repo

&&

!error

&&

typeof BaseRepository!=="undefined"

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

"TOTAL: "
+
summary.total

+
" | OK: "
+
summary.ok

+
" | WARNING: "
+
summary.warning

+
" | READY: "
+
summary.readyPercent
+
"%"

);





report.forEach(r=>{


Logger.log(

[
r.entity,

r.table,

r.status,

"Factory="+r.factory,

"Schema="+r.schema

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
// FULL DETAILS
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

data.summary.readyPercent>=80

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


module:
"RepositoryHealthReport",


status,


...data


};



}



};









// ============================================================
// GLOBAL
// ============================================================


globalThis.RepositoryHealthReport =
RepositoryHealthReport;







Logger.log(

"RepositoryHealthReport READY v"+
RepositoryHealthReport.version

);