function testClientRead() {

    Logger.log("===== CLIENT READ TEST =====");


    const client =
        ClientRepository.getById(
            "CLI000002"
        );


    Logger.log(
        JSON.stringify(client)
    );


    Logger.log(
        "===== READ COMPLETE ====="
    );
}