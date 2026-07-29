// ============================================================
// ClientRepository v3.0.2
// Enterprise Repository
// TaxControl ERP Core
//
// Entity:
// CLIENT
//
// Architecture:
//
// EntityService
//      |
//      v
// RepositoryFactory
//      |
//      v
// ClientRepository
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
//
// ============================================================


console.log(
"ClientRepository v3.0.2"
);





const ClientRepository = {



// ============================================================
// META
// ============================================================


version:"3.0.2",

entity:"CLIENT",

table:"Clients",

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
"ClientRepository: BaseRepository unavailable"
);

}



this.base =
BaseRepository.createRepository(
this.entity
);



this.initialized=true;



Logger.log(
"ClientRepository INIT READY v"+
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
// CLIENT BUSINESS METHODS
// ============================================================



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







findActive(){


return this.findWhere({

Active:true

});


},







findByPhone(phone){


return this.findWhere({

Phone:phone

});


},







findByEmail(email){


return this.findWhere({

Email:email

});


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







// ============================================================
// RESTORE
// ============================================================


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



const base =
this.getBase();



if(
typeof base.exists==="function"
){

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



if(
typeof base.existsBy==="function"
){

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







// ============================================================
// COUNT
// ============================================================


count(filters={},options={}){


const base =
this.getBase();



if(
typeof base.count==="function"
){

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
// PAGINATION
// ============================================================


paginate(
page=1,
limit=50,
filters={},
options={}
){


const base =
this.getBase();



if(
typeof base.paginate==="function"
){

return base.paginate(
page,
limit,
filters,
options
);

}



return {

page,

limit,

data:
this.findAll(
filters,
options
)

};


},







// ============================================================
// BULK
// ============================================================


bulkCreate(items=[],options={}){


if(
!Array.isArray(items)
){

throw new Error(
"ClientRepository.bulkCreate items must array"
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
"ClientRepository.bulkUpdate ids must array"
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
"ClientRepository.transaction callback required"
);

}



const base =
this.getBase();



if(
typeof base.transaction==="function"
){

return base.transaction(
callback
);

}



return callback();


},







// ============================================================
// METADATA
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

idField:"ClientID"


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

"ClientRepository."
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
"ClientRepository: RepositoryFactory unavailable"
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


module:"ClientRepository",

version:this.version,


entity:this.entity,


table:
meta?.table ||
this.table,


idField:
meta?.idField ||
"ClientID",



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
data.layers.baseRepository
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

"ClientRepository",

status,

data

);

}



return {

module:"ClientRepository",

status,

...data

};


}



};







// ============================================================
// GLOBAL
// ============================================================


globalThis.ClientRepository =
ClientRepository;







// ============================================================
// SAFE START
// ============================================================


// Lifecycle is started by RepositoryRegistry.







Logger.log(

"ClientRepository GLOBAL READY v"+
ClientRepository.version

);
