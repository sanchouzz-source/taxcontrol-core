function testEventFlow(){

    Logger.log(
        "===== EVENT FLOW TEST ====="
    );


    EventBus.on(
        "CLIENT_CREATED",
        function(client){

            Logger.log(
                "EVENT RECEIVED CLIENT_CREATED: "
                + client.ClientID
            );

        }
    );


    EventBus.on(
        "CLIENT_UPDATED",
        function(client){

            Logger.log(
                "EVENT RECEIVED CLIENT_UPDATED: "
                + client.ClientID
            );

        }
    );


    const client =
        ClientRepository.create({

            Name:"Event Test Client",

            INN:"3333333333",

            Phone:"+73333333333"

        });


    ClientRepository.update(
        client.ClientID,
        {
            Name:"Event Updated Client"
        }
    );


    Logger.log(
        "===== EVENT TEST COMPLETE ====="
    );

}