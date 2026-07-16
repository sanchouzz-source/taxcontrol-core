console.log("ClientRepository");


const ClientRepository = {


version:"1.0.0",


table:"Clients",

entity:"CLIENT",

permission:"CLIENT",



create(data){

return BaseRepository.create(

this.table,

data,

this.entity,

this.permission

);

},




findById(id){


return BaseRepository.findById(

this.table,

id,

this.entity,

this.permission

);


},





findAll(filters={}){


return BaseRepository.findAll(

this.table,

filters,

this.entity,

this.permission

);


},





update(id,data){


return BaseRepository.update(

this.table,

id,

data,

this.entity,

this.permission

);


},





delete(id){


return BaseRepository.delete(

this.table,

id,

this.entity,

this.permission

);


},





restore(id){


return BaseRepository.restore(

this.table,

id,

this.entity,

this.permission

);


}



};



globalThis.ClientRepository =
ClientRepository;



Logger.log(
"ClientRepository READY v1.0.0"
);