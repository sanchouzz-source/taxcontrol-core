function checkDuplicateClients(){

    const clients =
        Database.query("Clients",{});


    const map = {};


    clients.forEach(c=>{

        if(map[c.ClientID]){
            Logger.log(
              "DUPLICATE: " + c.ClientID
            );
        }

        map[c.ClientID]=true;

    });

}