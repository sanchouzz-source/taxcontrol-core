// ============================================================
// DriverRepository v3.0.0
// Enterprise Repository
// TaxControl ERP Core
//
// Entity:
// DRIVER
//
// Architecture:
//
// EntityService
//      |
// RepositoryFactory
//      |
// DriverRepository
//      |
// BaseRepository
//      |
// Database
//
// Compatible:
// EntityRegistry v2.5+
// EntityMetadata v3+
// BaseRepository v5.7+
// RepositoryFactory v3+
// RepositoryRegistry v1.1+
// ============================================================


console.log(
"DriverRepository v3.0.0"
);




const DriverRepository = {



version:"3.0.0",


entity:"DRIVER",


table:"Drivers",


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
"DriverRepository: BaseRepository unavailable"
);

}



this.base =
BaseRepository.createRepository(
this.entity
);



this.initialized=true;



Logger.log(
"DriverRepository READY v"+
this.version
);



return true;


},







// ============================================================
// CRUD
// ============================================================


create(data={}){


return this.base.create(
data
);


},






findById(id,options={}){


this.requireId(
id,
"findById"
);


return this.base.findById(
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


return this.base.findAll(
filters,
options
);


},







findWhere(criteria={},options={}){


return this.base.findWhere(
criteria,
options
);


},







update(id,data={}){


this.requireId(
id,
"update"
);


return this.base.update(
id,
data
);


},







delete(id){


this.requireId(
id,
"delete"
);


return this.base.delete(
id
);


},







restore(id){


this.requireId(
id,
"restore"
);


return this.base.restore(
id
);


},







// ============================================================
// DRIVER BUSINESS METHODS
// ============================================================



findByLicense(number){


return this.findWhere({

LicenseNumber:number

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





findByName(name){


return this.findWhere({

Name:name

});


},







// ============================================================
// EXISTS
// ============================================================


exists(id,options={}){


return !!this.findById(
id,
options
);


},






existsBy(field,value,options={}){


const rows =
this.findWhere({

[field]:value

},options);



return rows.length>0;


},







count(filters={},options={}){


if(this.base.count){

return this.base.count(
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


return this.base.paginate(

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
"DriverRepository.bulkCreate items must array"
);

}



return this.base.bulkCreate(
items,
options
);


},






bulkUpdate(ids=[],data={},options={}){


if(!Array.isArray(ids)){

throw new Error(
"DriverRepository.bulkUpdate ids must array"
);

}



return this.base.bulkUpdate(

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
"DriverRepository.transaction callback required"
);

}



if(this.base.transaction){

return this.base.transaction(
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


return SchemaRegistry.get(
this.entity
);


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

idField:"DriverID"

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

"DriverRepository."+method+
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
"DriverRepository: RepositoryFactory unavailable"
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


return {


module:"DriverRepository",


version:this.version,


entity:this.entity,


table:this.table,


initialized:this.initialized,


baseRepository:
typeof BaseRepository!=="undefined",


registered:
typeof RepositoryFactory!=="undefined"
&&
RepositoryFactory.has
?
RepositoryFactory.has(this.entity)
:false,


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

"DriverRepository",

status,

data

);


}



return {

module:"DriverRepository",

status,

...data

};


}



};







// ============================================================
// GLOBAL
// ============================================================


globalThis.DriverRepository =
DriverRepository;







// ============================================================
// SAFE START
// ============================================================


try{


DriverRepository.init();


DriverRepository.register();



}
catch(e){


Logger.warn(

"DriverRepository deferred "+
e.message

);


}






Logger.log(

"DriverRepository GLOBAL READY v"+
DriverRepository.version

);