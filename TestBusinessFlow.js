function testClientFlow() {

    Logger.log("===== CLIENT FLOW TEST =====");


    const client = {

        Name: "ERP Test Client",

        INN: "1234567890",

        Phone: "+79990000000",

        Email: "test@erp.local"

    };


    const result =
        ClientRepository.create(client);


    Logger.log(
        "Created client:"
    );

    Logger.log(
        JSON.stringify(result)
    );


    Logger.log(
        "===== TEST COMPLETE ====="
    );
}