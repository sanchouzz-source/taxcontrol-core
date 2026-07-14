console.log("ClientRepository");


const ClientRepository = {


version:"0.2.0",



create(data){


SecurityGuard.check(
"CLIENT_CREATE"
);


data =
ClientValidator.validate(
data
);



if(!data.ClientID){

data.ClientID =
IdService.generate(
"Clients"
);

}



data.OrganizationID =
OrganizationContext.get();


const result =
Database.insert(
"Clients",
data
);



AuditLog.write(
"CREATE",
"CLIENT",
null,
result
);



EventBus.emit(
"CLIENT_CREATED",
result
);



return result;


},





update(clientId,data){


SecurityGuard.check(
"CLIENT_UPDATE"
);



const existing =
Database.find(
"Clients",
clientId
);



if(!existing){


throw new Error(
"Client not found: "
+
clientId
);


}




Versioning.save(
"CLIENT",
clientId,
existing
);




const merged = {


...existing,

...data


};





const validated =
ClientValidator.validate(
merged
);




validated.OrganizationID =
OrganizationContext.get();



validated.ClientID =
clientId;





const updated =
Database.update(
"Clients",
clientId,
validated
);



EventBus.emit(
"CLIENT_UPDATED",
updated
);




return updated;


},






getById(id){


SecurityGuard.check(
"CLIENT_READ"
);



return Database.find(
"Clients",
id
);


},






list(){


SecurityGuard.check(
"CLIENT_READ"
);



return Database.query(
"Clients",
{Deleted:false}
);


},

restore(clientId) {

    SecurityGuard.check("CLIENT_UPDATE");


    const existing =
        Database.find(
            "Clients",
            clientId
        );


    if(!existing){

        throw new Error(
            "Client not found"
        );

    }



    if(
        existing.Deleted !== true &&
        existing.Deleted !== "true"
    ){

        return existing;

    }



    Versioning.save(
        "CLIENT",
        clientId,
        existing
    );



    const restored =
    Database.update(
        "Clients",
        clientId,
        {

            Deleted:false

        }
    );




    EventBus.emit(
        "CLIENT_RESTORED",
        restored
    );



    return restored;


},




delete(clientId){


SecurityGuard.check(
"CLIENT_DELETE"
);



const existing =
Database.find(
"Clients",
clientId
);



if(!existing){


throw new Error(
"Client not found: "
+
clientId
);


}





Versioning.save(
"CLIENT",
clientId,
existing
);





const deleted =
Database.update(
"Clients",
clientId,
{

Deleted:true

}

);



EventBus.emit(
"CLIENT_DELETED",
deleted
);



return deleted;


},






health(){


return HealthContract.create(

"ClientRepository",

"OK",

{

version:this.version,

dependencies:{

Database:!!Database,

EventBus:!!EventBus,

SecurityGuard:!!SecurityGuard

}

}

);


}





};



globalThis.ClientRepository =
ClientRepository;