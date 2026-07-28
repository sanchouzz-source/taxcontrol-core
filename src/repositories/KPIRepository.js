// ============================================================
// KPIRepository v3.0.0
// Enterprise Repository
// TaxControl ERP Core
//
// Entity:
// KPI
//
// Architecture:
//
// KPIEngine
//      |
//      v
// KPIRepository
//      |
//      v
// BaseRepository
//      |
//      v
// Database
//
// Compatible:
//
// EntityMetadata v3+
// EntityRegistry v2.5+
// SchemaManager v4.2+
// BaseRepository v5.7+
// RepositoryFactory v3+
// RepositoryRegistry v1.1+
// ============================================================


console.log(
"KPIRepository v3.0.0"
);





const KPIRepository = {


// ============================================================
// META
// ============================================================


version:"3.0.0",

entity:"KPI",

table:"KPIMetrics",

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
typeof BaseRepository==="undefined"
){

throw new Error(
"KPIRepository: BaseRepository unavailable"
);

}



this.base =
BaseRepository.createRepository(
this.entity
);



this.initialized=true;



Logger.log(
"KPIRepository INIT READY v"+
this.version
);



return true;


},







// ============================================================
// BASE
// ============================================================


getBase(){


if(!this.initialized){

this.init();

}


return this.base;


},







// ============================================================
// CREATE
// ============================================================


create(data={},options={}){


this.requireObject(
data,
"create"
);



return this.getBase()
.create(
data,
options
);


},







// ============================================================
// READ
// ============================================================


findById(id,options={}){


this.requireId(
id,
"findById"
);



return this.getBase()
.findById(
id,
options
);


},







get(id,options={}){


return this.findById(
id,
options
);


},







findAll(filters={},options={}){


return this.getBase()
.findAll(
filters,
options
);


},







findWhere(criteria={},options={}){


const base =
this.getBase();



if(
typeof base.findWhere==="function"
){

return base.findWhere(
criteria,
options
);

}



return this.findAll(
criteria,
options
);


},







// ============================================================
// KPI BUSINESS METHODS
// ============================================================



findByOrganization(orgId){


return this.findWhere({

OrganizationID:orgId

});


},







findByPeriod(
period
){


return this.findWhere({

Period:period

});


},







findByMetric(
metric
){


return this.findWhere({

Metric:metric

});


},







getCurrent(
organizationId,
metric
){


const rows =
this.findWhere({

OrganizationID:organizationId,

Metric:metric

});



if(!rows.length){

return null;

}



return rows[0];


},







saveMetric(
data={}
){


if(
!data.OrganizationID
){

throw new Error(
"KPIRepository.saveMetric OrganizationID required"
);

}



if(
!data.Metric
){

throw new Error(
"KPIRepository.saveMetric Metric required"
);

}



const current =
this.getCurrent(

data.OrganizationID,

data.Metric

);



if(current){


return this.update(

current.ID,

data

);


}



return this.create(
data
);


},







// ============================================================
// UPDATE
// ============================================================


update(id,data={},options={}){


this.requireId(
id,
"update"
);



this.requireObject(
data,
"update"
);



return this.getBase()
.update(
id,
data,
options
);


},







delete(id,options={}){


this.requireId(
id,
"delete"
);



return this.getBase()
.delete(
id,
options
);


},







restore(id,options={}){


this.requireId(
id,
"restore"
);



return this.getBase()
.restore(
id,
options
);


},







// ============================================================
// COMMON
// ============================================================


exists(id,options={}){


this.requireId(
id,
"exists"
);



return this.getBase()
.exists(
id,
options
);


},







existsBy(field,value,options={}){


return this.getBase()
.existsBy(
field,
value,
options
);


},







count(filters={},options={}){


if(
this.getBase().count
){

return this.getBase()
.count(
filters,
options
);

}



return this.findAll(
filters,
options
).length;


},







paginate(
page=1,
limit=50,
filters={},
options={}
){


return this.getBase()
.paginate(
page,
limit,
filters,
options
);


},







// ============================================================
// BULK
// ============================================================


bulkCreate(items=[],options={}){


if(
!Array.isArray(items)
){

throw new Error(
"KPIRepository.bulkCreate items must array"
);

}



return this.getBase()
.bulkCreate(
items,
options
);


},







bulkUpdate(ids=[],data={},options={}){


if(
!Array.isArray(ids)
){

throw new Error(
"KPIRepository.bulkUpdate ids must array"
);

}



return this.getBase()
.bulkUpdate(
ids,
data,
options
);


},







// ============================================================
// TRANSACTION
// ============================================================


transaction(callback){


if(
typeof callback!=="function"
){

throw new Error(
"KPIRepository.transaction callback required"
);

}



const base =
this.getBase();



if(base.transaction){

return base.transaction(
callback
);

}



return callback();


},







// ============================================================
// META
// ============================================================


getMeta(){


if(
typeof EntityRegistry!=="undefined"
&&
EntityRegistry.get
){

return EntityRegistry.get(
this.entity
);

}



return {

entity:this.entity,

table:this.table,

idField:"KPIID"

};


},







// ============================================================
// VALIDATION
// ============================================================


requireId(id,method){


if(
id===undefined ||
id===null ||
id===""
){

throw new Error(

"KPIRepository."
+
method+
": id required"

);

}


},







requireObject(obj,method){


if(
!obj ||
typeof obj!=="object" ||
Array.isArray(obj)
){

throw new Error(

"KPIRepository."
+
method+
": object required"

);

}


},







// ============================================================
// REGISTER
// ============================================================


register(){


if(
typeof RepositoryFactory==="undefined"
){

return false;

}



RepositoryFactory.register(

this.entity,

this,

{
force:true
}

);



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


},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){


let meta=null;


try{

meta=this.getMeta();

}
catch(e){}



return {


module:
"KPIRepository",


version:
this.version,


entity:
this.entity,


table:
meta?.table ||
this.table,


initialized:
this.initialized,



layers:{


metadata:
!!meta,


baseRepository:
typeof BaseRepository!=="undefined",


factory:
typeof RepositoryFactory!=="undefined",


registry:
typeof RepositoryRegistry!=="undefined"


},



registered:

typeof RepositoryFactory!=="undefined"
&&
RepositoryFactory.has
?
RepositoryFactory.has(this.entity)
:
false,



timestamp:
new Date()
.toISOString()


};


},







// ============================================================
// HEALTH
// ============================================================


health(){


const data =
this.diagnostics();



const status =
data.layers.baseRepository &&
data.layers.metadata

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

"KPIRepository",

status,

data

);

}



return {

module:"KPIRepository",

status,

...data

};


}



};









// ============================================================
// GLOBAL
// ============================================================


globalThis.KPIRepository =
KPIRepository;









// ============================================================
// SAFE START
// ============================================================


try{


KPIRepository.init();


KPIRepository.register();


}
catch(e){


Logger.warn(

"KPIRepository deferred: "+
e.message

);


}







Logger.log(

"KPIRepository GLOBAL READY v"+
KPIRepository.version

);