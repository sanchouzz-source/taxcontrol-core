// ============================================================
// RepositoryHealthReport v1.0.0
// TaxControl ERP Core
//
// System diagnostic
//
// Checks:
//
// Repository
// Entity
// Metadata
// Schema
// Factory
// BaseRepository
//
// ============================================================


console.log(
"RepositoryHealthReport v1.0.0"
);



const RepositoryHealthReport = {



version:"1.0.0",




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


const repo =
RepositoryRegistry.get(
entity
);



let meta=null;

let schema=null;

let error=null;



try{


if(
repo.getMeta
){

meta =
repo.getMeta();

}


}
catch(e){

error=e.message;

}



try{


if(
typeof SchemaRegistry!=="undefined"
&&
SchemaRegistry.get
){

schema =
SchemaRegistry.get(
entity
);

}


}
catch(e){}



result.push({


repository:
repo.constructor?.name ||
entity,


entity,


version:
repo.version || "-",



table:

meta?.table ||
repo.table ||
"-",



metadata:
!!meta,


schema:
!!schema,



baseRepository:
typeof BaseRepository!=="undefined",



factory:

typeof RepositoryFactory!=="undefined"
&&
RepositoryFactory.has
?

RepositoryFactory.has(entity)

:

false,



registry:true,



status:

(
!error
&&
meta
&&
typeof BaseRepository!=="undefined"

)

?

"OK"

:

"WARNING",



error:error || ""


});


});



return result;


},







print(){


const report =
this.run();



Logger.log(
"=============================="
);



Logger.log(
"REPOSITORY HEALTH REPORT"
);



Logger.log(
"=============================="
);



report.forEach(r=>{


Logger.log(

[
r.entity,

r.table,

r.status

]
.join(
" | "
)

);


});



return report;


},







health(){


return HealthContract.create(

"RepositoryHealthReport",

"OK",

{

version:this.version,

repositories:
RepositoryRegistry.count()

}

);


}



};





globalThis.RepositoryHealthReport =
RepositoryHealthReport;




Logger.log(
"RepositoryHealthReport READY v"+
RepositoryHealthReport.version
);