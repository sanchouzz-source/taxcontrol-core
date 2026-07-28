// ============================================================
// ClientFinanceProfileRepository v3.0.0
// Enterprise Repository
// TaxControl ERP Core
//
// Entity:
// CLIENT_FINANCE_PROFILE
//
// Architecture:
//
// EntityService
//      |
//      v
// RepositoryFactory
//      |
//      v
// ClientFinanceProfileRepository
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
"ClientFinanceProfileRepository v3.0.0"
);





const ClientFinanceProfileRepository = {


// ============================================================
// META
// ============================================================


version:"3.0.0",

entity:"CLIENT_FINANCE_PROFILE",

table:"ClientFinanceProfiles",

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
"ClientFinanceProfileRepository: BaseRepository unavailable"
);

}



this.base =
BaseRepository.createRepository(
this.entity
);



this.initialized=true;



Logger.log(
"ClientFinanceProfileRepository INIT READY v"+
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
// FINANCE BUSINESS METHODS
// ============================================================


// профиль клиента

findByClient(clientId){


return this.findWhere({

ClientID:clientId

});


},







getBalance(clientId){


const profiles =
this.findByClient(
clientId
);



if(!profiles.length){

return 0;

}



return Number(
profiles[0].Balance || 0
);


},







updateBalance(
clientId,
amount
){


const profiles =
this.findByClient(
clientId
);



if(!profiles.length){

throw new Error(

"ClientFinanceProfile not found CLIENT="+
clientId

);

}



const profile =
profiles[0];



const newBalance =

Number(profile.Balance || 0)

+

Number(amount);





return this.update(

profile.FinanceProfileID,

{

Balance:newBalance

}

);


},







increaseDebt(
clientId,
amount
){


return this.updateBalance(

clientId,

Math.abs(
Number(amount)
)

);


},







decreaseDebt(
clientId,
amount
){


return this.updateBalance(

clientId,

- Math.abs(
Number(amount)
)

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
typeof this.getBase().count==="function"
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


if(!Array.isArray(items)){

throw new Error(
"ClientFinanceProfileRepository.bulkCreate items must array"
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
"ClientFinanceProfileRepository.bulkUpdate ids must array"
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
"ClientFinanceProfileRepository.transaction callback required"
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


idField:"FinanceProfileID"


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

"ClientFinanceProfileRepository."
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
"ClientFinanceProfileRepository",


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
new Date().toISOString()


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
&&
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

"ClientFinanceProfileRepository",

status,

data

);

}



return {

module:
"ClientFinanceProfileRepository",

status,

...data

};


}



};









// ============================================================
// GLOBAL
// ============================================================


globalThis.ClientFinanceProfileRepository =
ClientFinanceProfileRepository;









// ============================================================
// SAFE START
// ============================================================


try{


ClientFinanceProfileRepository.init();


ClientFinanceProfileRepository.register();


}
catch(e){


Logger.warn(

"ClientFinanceProfileRepository deferred: "+
e.message

);


}







Logger.log(

"ClientFinanceProfileRepository GLOBAL READY v"+
ClientFinanceProfileRepository.version

);