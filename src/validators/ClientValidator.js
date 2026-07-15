console.log("ClientValidator");



const ClientValidator = {



version:"0.1.0",



validate(data){


if(!data){

throw new Error(
"Client data required"
);

}



if(!data.Name){


throw new Error(
"Client Name required"
);


}



return {


...data,


Name:
String(data.Name).trim(),



INN:
data.INN || "",



Phone:
data.Phone || "",



Email:
data.Email || "",



Address:
data.Address || "",



ManagerID:
data.ManagerID || "",



Rating:
data.Rating || "",



Status:
data.Status || "ACTIVE",



Deleted:
data.Deleted || false,



UpdatedAt:
new Date().toISOString()



};


},





health(){


return HealthContract.create(

"ClientValidator",

"OK",

{

version:this.version

}

);


}



};




globalThis.ClientValidator =
ClientValidator;