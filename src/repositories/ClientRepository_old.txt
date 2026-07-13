console.log("ClientRepository");


const ClientRepository = {


version:"0.2.0",



create(client){


const result =
Database.insert(
"Clients",
client
);



EventBus.emit(
"CLIENT_CREATED",
result
);



return result;


},




find(id){


return Database.find(
"Clients",
id
);


},




list(){


return Database.query(
"Clients"
);


},





update(id,data){



const sheet =
Database.getSheetOrThrow(
"Clients"
);



const values =
sheet
.getDataRange()
.getValues();



const headers =
values[0];



const idField =
SchemaRegistry
.getIdField(
"Clients"
);



const idIndex =
headers.indexOf(
idField
);



for(
let i=1;
i<values.length;
i++
){


if(
String(values[i][idIndex])
===
String(id)
){



Object.keys(data)
.forEach(key=>{


const col =
headers.indexOf(key);



if(col>=0){


sheet
.getRange(
i+1,
col+1
)
.setValue(
data[key]
);


}


});



return this.find(id);


}


}



return null;


},




delete(id){


return this.update(
id,
{
Deleted:true
}
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



globalThis.ClientRepository =
ClientRepository;