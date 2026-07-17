console.log("ClientRepository");


const ClientRepository = {


version:"1.0.0",


table:"Clients",



create(data){

return BaseRepository.create(
this.table,
data,
"CLIENT",
"CLIENT"
);

},



findById(id){

return BaseRepository.findById(
this.table,
id,
"CLIENT",
"CLIENT"
);

},



findAll(filters={}){

return BaseRepository.findAll(
this.table,
filters,
"CLIENT",
"CLIENT"
);

},



update(id,data){

return BaseRepository.update(
this.table,
id,
data,
"CLIENT",
"CLIENT"
);

},



delete(id){

return BaseRepository.delete(
this.table,
id,
"CLIENT",
"CLIENT"
);

},



restore(id){

return BaseRepository.restore(
this.table,
id,
"CLIENT",
"CLIENT"
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
version:this.version
}

);


}



};



globalThis.ClientRepository=
ClientRepository;


Logger.log(
"ClientRepository READY v1.0.0"
);