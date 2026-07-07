function testClientFullFlow() {

    Logger.log("===== CLIENT FULL FLOW =====");


    const created =
        ClientRepository.create({

            Name: "Flow Test Client",

            INN: "9999999999",

            Phone: "+79999999999",

            Email: "flow@test.local"

        });


    Logger.log(
        "CREATED:"
    );

    Logger.log(
        JSON.stringify(created)
    );


    const loaded =
        ClientRepository.getById(
            created.ClientID
        );


    Logger.log(
        "LOADED:"
    );

    Logger.log(
        JSON.stringify(loaded)
    );


    Logger.log(
        "===== FLOW COMPLETE ====="
    );
}