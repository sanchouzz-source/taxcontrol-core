console.log("TripValidator");



const TripValidator = {



version:"0.1.0",





validate(data){


if(!data){

throw new Error(
"Trip data required"
);

}




return {


...data,


Status:
data.Status || "NEW",



CreatedAt:
data.CreatedAt ||
new Date().toISOString(),



UpdatedAt:
new Date().toISOString()



};


},





health(){


return HealthContract.create(

"TripValidator",

"OK",

{

version:this.version

}

);


}



};




globalThis.TripValidator =
TripValidator;