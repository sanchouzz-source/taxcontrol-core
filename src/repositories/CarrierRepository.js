// ============================================================
// CarrierRepository v3.0.2
// Enterprise Repository
// TaxControl ERP Core
//
// Entity:
// CARRIER
//
// Compatible:
// EntityMetadata v3+
// EntityRegistry v2.5+
// SchemaManager v4.2+
// BaseRepository v5.7+
// RepositoryFactory v3+
// RepositoryRegistry v1.1+
// ============================================================


console.log(
"CarrierRepository v3.0.2"
);



const CarrierRepository = {


version:"3.0.2",

entity:"CARRIER",

table:"Carriers",


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
"CarrierRepository: BaseRepository unavailable"
);

}



this.base =
BaseRepository.createRepository(
this.entity
);



this.initialized=true;



Logger.log(
"CarrierRepository READY v"+
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



if(
base.findWhere
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
// BUSINESS
// ============================================================


findActive(){


return this.findWhere({

Active:true

});


},




findByINN(inn){


return this.findWhere({

INN:inn

});


},




findByName(name){


return this.findWhere({

Name:name

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
// EXISTS
// ============================================================


exists(id,options={}){


this.requireId(
id,
"exists"
);



if(
this.getBase().exists
){

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
this.getBase().existsBy
){

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

idField:"CarrierID"

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

"CarrierRepository."
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
"CarrierRepository factory unavailable"
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


module:"CarrierRepository",

version:this.version,


entity:this.entity,


table:
meta?.table ||
this.table,


initialized:
this.initialized,


auditReady:this.auditReady,



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

"CarrierRepository",

status,

data

);

}



return {

module:"CarrierRepository",

status,

...data

};


}



};







globalThis.CarrierRepository =
CarrierRepository;







// ============================================================
// SAFE BOOT
// ============================================================


try{


CarrierRepository.init();


CarrierRepository.register();


}
catch(e){


Logger.warn(

"CarrierRepository deferred: "+
e.message

);


}






Logger.log(

"CarrierRepository GLOBAL READY v"+
CarrierRepository.version

);