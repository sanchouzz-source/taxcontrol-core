console.log("testAuditCRUD");


function testAuditCRUD(){


    console.log("========== AUDIT CRUD TEST START ==========");



    //
    // 1. INIT SYSTEM
    //

    if(typeof SystemInit !== "undefined"){

        SystemInit.init();

    } else {

        console.log(
            "SystemInit not found. Continue..."
        );

    }



    //
    // CREATE
    //

    console.log(
        "===== STEP 1: CREATE CLIENT ====="
    );


    const created =
    ClientRepository.create({

        Name:"Audit CRUD Test",

        INN:"7777777777",

        Phone:"+79991112233",

        Email:"crud@test.ru"

    });



    const clientId =
        created.ClientID;



    console.log(
        "CREATED CLIENT:",
        clientId
    );



    //
    // UPDATE
    //

    console.log(
        "===== STEP 2: UPDATE CLIENT ====="
    );



    const updated =
    ClientRepository.update(

        clientId,

        {

            Phone:"+79990000000",

            Email:"updated@test.ru"

        }

    );



    console.log(
        "UPDATED CLIENT:",
        JSON.stringify(updated)
    );





    //
    // DELETE
    //

    console.log(
        "===== STEP 3: DELETE CLIENT ====="
    );



    const deleted =
    ClientRepository.delete(
        clientId
    );



    console.log(
        "DELETED CLIENT:",
        JSON.stringify(deleted)
    );






    //
    // RESTORE
    //

    console.log(
        "===== STEP 4: RESTORE CLIENT ====="
    );



    const restored =
    ClientRepository.restore(
        clientId
    );



    console.log(
        "RESTORED CLIENT:",
        JSON.stringify(restored)
    );





    //
    // FINAL STATE
    //

    console.log(
        "===== FINAL CLIENT STATE ====="
    );



    const finalClient =
        ClientRepository.getById(
            clientId
        );



    console.log(
        JSON.stringify(
            finalClient,
            null,
            2
        )
    );




    //
    // AUDIT HISTORY
    //

    console.log(
        "===== AUDIT HISTORY ====="
    );



    const audit =
    Database.query(
        "AuditLog",
        {

            EntityID:clientId

        }
    );



    console.log(
        JSON.stringify(
            audit,
            null,
            2
        )
    );



    console.log(
        "========== AUDIT CRUD TEST COMPLETE =========="
    );



    return {

        ClientID:clientId,

        FinalState:finalClient,

        AuditRecords:audit.length

    };


}