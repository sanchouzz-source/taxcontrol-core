function testClientUpdateFlow(){

    Logger.log(
        "===== CLIENT UPDATE FLOW ====="
    );


    const client =
        ClientRepository.create({

            Name:"Update Test Client",

            INN:"1111111111",

            Phone:"+70000000000"

        });


    Logger.log(
        "CREATED:"
    );

    Logger.log(
        JSON.stringify(client)
    );


    const updated =
        ClientRepository.update(
            client.ClientID,
            {
                Name:"Updated Client Name",
                Phone:"+79999999999"
            }
        );


    Logger.log(
        "UPDATED:"
    );

    Logger.log(
        JSON.stringify(updated)
    );


    const loaded =
        ClientRepository.getById(
            client.ClientID
        );


    Logger.log(
        "LOADED AFTER UPDATE:"
    );

    Logger.log(
        JSON.stringify(loaded)
    );


    Logger.log(
        "===== UPDATE COMPLETE ====="
    );

}