console.log("EntityService");


const EntityService = {


version:"4.0.1",


ready:false,



init(){


this.ready=true;


Logger.log(
"EntityService READY v"
+
this.version
);


return true;


},




resolve(entity){


return EntityRegistry.resolve(entity);


},




getMeta(entity){


return EntityRegistry.get(
this.resolve(entity)
);


},




getRepository(entity){


const name =
this.resolve(entity);



const repo =
RepositoryFactory.get(name);



if(!repo){


throw new Error(
"No repository registered for "
+
name
);


}



return repo;


},




checkPermission(meta,action){


if(
typeof SecurityGuard==="undefined"
){

return;

}



const permission =
meta.permissions?.[action];



if(permission){


SecurityGuard.check(
permission
);


}


},





create(entity,data={}){


entity=this.resolve(entity);



const meta =
this.getMeta(entity);



this.checkPermission(
meta,
"create"
);




if(
meta.idField
&&
!data[meta.idField]
){


data[meta.idField]
=
IdService.generate(entity);


}





/*
Repository:
- save data
- emit CREATED event
- audit
*/


return this.getRepository(entity)
.create(data);


},





update(entity,id,data){


entity=this.resolve(entity);



const meta =
this.getMeta(entity);



this.checkPermission(
meta,
"update"
);




const before =
this.findById(
entity,
id
);




if(!before){


throw new Error(
entity+
" not found: "
+
id
);


}





/*
Repository:
- version save
- update
- emit UPDATED
*/


return this.getRepository(entity)
.update(
id,
data
);


},





findById(entity,id){


return this.getRepository(entity)
.findById(id);


},





findAll(entity){


return this.getRepository(entity)
.findAll();


},





findWhere(entity,criteria={}){


const repo =
this.getRepository(entity);



if(repo.findWhere){


return repo.findWhere(criteria);


}





const rows =
repo.findAll();



return rows.filter(item=>{


return Object.keys(criteria)
.every(
key =>
item[key]===criteria[key]
);


});


},





exists(entity,id){


return !!this.findById(
entity,
id
);


},





count(entity,criteria={}){


return this.findWhere(
entity,
criteria
)
.length;


},





delete(entity,id){


entity=this.resolve(entity);



const meta =
this.getMeta(entity);



this.checkPermission(
meta,
"delete"
);





const before =
this.findById(
entity,
id
);



if(!before){


throw new Error(
entity+
" not found: "
+
id
);


}




/*
Repository:
- soft delete
- emit DELETED
- audit
*/


return this.getRepository(entity)
.delete(id);


},





restore(entity,id){


entity=this.resolve(entity);



const meta =
this.getMeta(entity);



this.checkPermission(
meta,
"restore"
);





/*
Repository:
- Deleted=false
- emit RESTORED
- audit
*/


return this.getRepository(entity)
.restore(id);


},





bulkCreate(entity,list=[]){


return list.map(item=>{


return this.create(
entity,
item
);


});


},





bulkUpdate(entity,ids,data){


return ids.map(id=>{


return this.update(
entity,
id,
data
);


});


},





transaction(callback){


if(
typeof TransactionManager!=="undefined"
&&
TransactionManager.run
){


return TransactionManager.run(
callback
);


}



return callback();


},





health(){


return HealthContract.create(

"EntityService",

this.ready
?
"OK"
:
"WARNING",

{


version:this.version,


architecture:

"Repository Driven Lifecycle",



features:[


"CRUD",


"SEARCH",


"BULK",


"SOFT_DELETE",


"RESTORE",


"EVENTBUS",


"TRANSACTION_READY"


]


}


);


}



};





globalThis.EntityService =
EntityService;