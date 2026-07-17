console.log("ClientRepository");


const ClientRepository = {


version:"1.1.0",


table:"Clients",


entity:"CLIENT",



create(data){


return BaseRepository.create(

this.table,

data,

this.entity,

this.entity

);


},




findById(id){


return BaseRepository.findById(

this.table,

id,

this.entity,

this.entity

);


},




findAll(filters={}){


return BaseRepository.findAll(

this.table,

filters,

this.entity,

this.entity

);


},




update(id,data){


return BaseRepository.update(

this.table,

id,

data,

this.entity,

this.entity

);


},




delete(id){


return BaseRepository.delete(

this.table,

id,

this.entity,

this.entity

);


},




restore(id){


return BaseRepository.restore(

this.table,

id,

this.entity,

this.entity

);


},




exists(id){


return BaseRepository.exists(

this.table,

id

);


},




health(){


return HealthContract.create(

"ClientRepository",

"OK",

{

version:this.version,

table:this.table

}

);


}



};



globalThis.ClientRepository =
ClientRepository;


Logger.log(
"ClientRepository READY v1.1.0"
);