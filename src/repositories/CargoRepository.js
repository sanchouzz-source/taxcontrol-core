// ============================================================
// CargoRepository v3.0.1
// Enterprise Repository
// TaxControl ERP Core
//
// Entity:
// CARGO
//
// Architecture:
//
// EntityService
//      |
// RepositoryFactory
//      |
// CargoRepository
//      |
// BaseRepository
//      |
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
"CargoRepository v3.0.1"
);





const CargoRepository = {



// ============================================================
// META
// ============================================================


version:"3.0.1",

entity:"CARGO",

table:"Cargoes",


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
"CargoRepository: BaseRepository unavailable"
);

}



this.base =
BaseRepository.createRepository(
this.entity
);



this.initialized=true;



Logger.log(
"CargoRepository INIT READY v"+
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







search(criteria={}){


return this.findAll(
criteria
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



return this.getBase()
.update(
id,
data,
options
);


},







// ============================================================
// DELETE
// ============================================================


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
// EXISTS
// ============================================================


exists(id,options={}){


this.requireId(
id,
"exists"
);



if(this.getBase().exists){

return this.getBase()
.exists(
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


if(
!field
){

throw new Error(
"CargoRepository.existsBy field required"
);

}



if(this.getBase().existsBy){

return this.getBase()
.existsBy(
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


if(this.getBase().count){

return this.getBase()
.count(
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
"CargoRepository.bulkCreate items must array"
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
"CargoRepository.bulkUpdate ids must array"
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
"CargoRepository.transaction callback required"
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

idField:"CargoID"


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

"CargoRepository."
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
"CargoRepository: Factory unavailable"
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


module:"CargoRepository",

version:this.version,


entity:this.entity,


table:
meta?.table ||
this.table,



initialized:
this.initialized,



baseRepository:

typeof BaseRepository!=="undefined"
?
BaseRepository.version
:
null,



factoryRegistered:

typeof RepositoryFactory!=="undefined"
&&
RepositoryFactory.has
?
RepositoryFactory.has(this.entity)
:
false,



registry:

typeof RepositoryRegistry!=="undefined",



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

"CargoRepository",

status,

data

);

}



return {

module:"CargoRepository",

status,

...data

};


}



};







// ============================================================
// GLOBAL
// ============================================================


globalThis.CargoRepository =
CargoRepository;








// ============================================================
// SAFE START
// ============================================================


try{


CargoRepository.init();


CargoRepository.register();



}
catch(e){


Logger.warn(

"CargoRepository deferred: "+
e.message

);


}






Logger.log(

"CargoRepository GLOBAL READY v"+
CargoRepository.version

);