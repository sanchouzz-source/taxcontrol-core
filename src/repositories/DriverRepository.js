console.log("DriverRepository");


const DriverRepository = {

version:"1.0.0",


create(data){

return BaseRepository.create(
"DRIVER",
data
);

},


findById(id){

return BaseRepository.findById(
"DRIVER",
id
);

},


findAll(filters={}){

return BaseRepository.findAll(
"DRIVER",
filters
);

},


update(id,data){

return BaseRepository.update(
"DRIVER",
id,
data
);

},


delete(id){

return BaseRepository.delete(
"DRIVER",
id
);

},


restore(id){

return BaseRepository.restore(
"DRIVER",
id
);

},


exists(id){

return BaseRepository.exists(
"DRIVER",
id
);

}


};


globalThis.DriverRepository=DriverRepository;


Logger.log(
"DriverRepository READY v"+
DriverRepository.version
);