function testFinanceFlow(){


    Logger.log(
        "===== FINANCE FLOW TEST ====="
    );


    installSystem();



    const trip =
        TripRepository.create({

            ClientID:"CLI000014",

            LoadingPoint:"Москва",

            UnloadingPoint:"Вологда",

            Cargo:"Finance Test",

            Revenue:200000,

            ActualCost:120000,

            Status:"NEW"

        });



    TripRepository.update(

        trip.TripID,

        {

            Status:"COMPLETED",

            ActualCost:130000

        }

    );


    Logger.log(
        "===== FINANCE TEST COMPLETE ====="
    );

}