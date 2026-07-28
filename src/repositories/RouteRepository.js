// ============================================================
// RouteRepository v3.0.2
// Enterprise Repository
// TaxControl ERP Core
//
// Entity:
// ROUTE
//
// Architecture:
//
// EntityService
//      |
//      v
// RepositoryFactory
//      |
//      v
// RouteRepository
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
"RouteRepository v3.0.2"
);



const RouteRepository = {


version:"3.0.2",

entity:"ROUTE",

table:"Routes",


initialized:false,

base:null,

auditReady:true,







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
"RouteRepository: BaseRepository unavailable"
);

}



this.base =
BaseRepository.createRepository(
this.entity
);



this.initialized=true;



Logger.log(
"RouteRepository READY v"+
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
// CRUD
// ============================================================


create(data={},options={}){


return this.getBase()
.create(
data,
options
);


},





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





getById(id,options={}){


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



if(base.findWhere){

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
// ROUTE BUSINESS
// ============================================================


findByCode(code){


return this.findWhere({

Code:code

});


},





findActive(){


return this.findWhere({

Active:true

});


},





findByDirection(from,to){


return this.findWhere({

From:from,

To:to

});


},





findByCity(city){


return this.findWhere({

City:city

});


},







// ============================================================
// UPDATE DELETE
// ============================================================


update(id,data={},options={}){


this.requireId(
id,
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
// EXISTS COUNT
// ============================================================


exists(id,options={}){


this.requireId(
id,
"exists"
);



const base =
this.getBase();



if(base.exists){

return base.exists(
id,
options
);

}



return !!this.findById(
id,
options
);


},





existsBy(field,value,options={}){


const base =
this.getBase();



if(base.existsBy){

return base.existsBy(
field,
value,
options
);

}



return this.findWhere(
{
[field]:value
},
options
)
.length>0;


},





count(filters={},options={}){


const base =
this.getBase();



if(base.count){

return base.count(
filters,
options
);

}



return this.findAll(
filters,
options
)
.length;


},







// ============================================================
// BULK
// ============================================================


bulkCreate(items=[],options={}){


if(!Array.isArray(items)){

throw new Error(
"RouteRepository.bulkCreate items must array"
);

}



return this.getBase()
.bulkCreate(
items,
options
);


},





bulkUpdate(ids=[],data={},options={}){


if(!Array.isArray(ids)){

throw new Error(
"RouteRepository.bulkUpdate ids must array"
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
"RouteRepository.transaction callback required"
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
typeof SchemaRegistry!=="undefined"
&&
SchemaRegistry.get
){


const schema =
SchemaRegistry.get(
this.entity
);


if(schema){

return schema;

}

}





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

idField:"RouteID"


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

"RouteRepository."
+
method+
": id required"

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

Logger.warn(
"RouteRepository Factory unavailable"
);


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


module:"RouteRepository",

version:this.version,


entity:this.entity,


table:
meta?.table ||
this.table,


idField:
meta?.idField ||
"RouteID",



initialized:
this.initialized,


auditReady:
this.auditReady,



layers:{


schema:
typeof SchemaRegistry!=="undefined",


metadata:
typeof EntityRegistry!=="undefined",


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
data.layers.schema
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

"RouteRepository",

status,

data

);

}



return {

module:"RouteRepository",

status,

...data

};


}



};







// ============================================================
// GLOBAL
// ============================================================


globalThis.RouteRepository =
RouteRepository;







// ============================================================
// SAFE BOOT
// ============================================================


try{


RouteRepository.init();


RouteRepository.register();


}
catch(e){


Logger.warn(

"RouteRepository deferred: "+
e.message

);


}





Logger.log(

"RouteRepository GLOBAL READY v"+
RouteRepository.version

);