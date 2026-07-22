console.log("ERPEventContract v1.0");


const ERPEventContract = {


version:"1.0.0",


create(params){


return {

id:
params.id ||
IdService?.generate("EVT") ||
("EVT-"+Date.now()),


entity:
params.entity || "",


type:
params.type || "UNKNOWN",


entityId:
params.entityId || "",


before:
params.before || null,


after:
params.after || null,


source:
params.source || "ERP",


user:
params.user || null,


timestamp:
params.timestamp ||
new Date().toISOString()

};


},



validate(event){


const required=[
"id",
"entity",
"type",
"timestamp"
];


for(const field of required){

if(!event[field])
{
return {
valid:false,
error:"Missing "+field
};
}

}


return {
valid:true
};


}


};



globalThis.ERPEventContract =
ERPEventContract;


Logger.log(
"ERPEventContract READY v1.0.0");