console.log("FinanceEngine v1.0");


const FinanceEngine = {


version:"1.0.0",


ready:false,



init(){


    if(this.ready){

        Logger.log(
            "FinanceEngine ALREADY READY"
        );

        return;

    }



    if(!globalThis.EntityService){

        throw new Error(
            "FinanceEngine requires EntityService"
        );

    }



    if(!globalThis.EventBus){

        throw new Error(
            "FinanceEngine requires EventBus"
        );

    }





    EventBus.subscribe(

        "CLIENT_CREATED",

        event=>{

            this.createClientFinanceProfile(
                event
            );

        }

    );





    EventBus.subscribe(

        "TRIP_COMPLETED",

        event=>{

            this.createTripTransaction(
                event
            );

        }

    );




    this.ready=true;



    Logger.log(
        "FinanceEngine READY v"
        +
        this.version
    );


},







/*
====================================
CLIENT FINANCE PROFILE
====================================
*/


createClientFinanceProfile(event){



try{


    const client =
        event.after
        ||
        event.data
        ||
        event.entity
        ||
        event;




    if(!client.ClientID){


        Logger.log(
            "FINANCE CLIENT ID MISSING"
        );


        return null;

    }





    const exists =
        EntityService
        .findAll(

            "CLIENT_FINANCE_PROFILE",

            {

                ClientID:
                    client.ClientID

            }

        );





    if(
        exists &&
        exists.length
    ){


        Logger.log(

            "FINANCE PROFILE EXISTS "
            +
            client.ClientID

        );


        return exists[0];


    }








    const profile = {


        OrganizationID:
            client.OrganizationID
            ||
            this.getOrganizationID(),



        ClientID:
            client.ClientID,



        ClientName:
            client.Name,



        Balance:0,



        CreditLimit:0,



        Currency:"RUB",



        Status:"ACTIVE"



    };







    const result =
        EntityService.create(

            "CLIENT_FINANCE_PROFILE",

            profile

        );







    Logger.log(

        "FINANCE PROFILE CREATED "
        +
        result.FinanceProfileID

    );





    return result;



}
catch(error){



    Logger.error(

        "FINANCE PROFILE ERROR "
        +
        error.message

    );


}



},







/*
====================================
TRIP TRANSACTION
====================================
*/


createTripTransaction(event){



try{


    const trip =
        event.after
        ||
        event.data
        ||
        event;





    if(!trip.TripID){


        return null;

    }






    const revenue =
        Number(
            trip.Revenue || 0
        );




    const cost =
        Number(
            trip.ActualCost || 0
        );





    const transaction = {



        OrganizationID:
            this.getOrganizationID(),



        Type:
            "TRIP_PROFIT",



        Entity:
            "TRIP",



        EntityID:
            trip.TripID,



        Revenue:
            revenue,



        Cost:
            cost,



        Profit:
            revenue-cost,



        Status:
            "POSTED"



    };







    const result =
        EntityService.create(

            "FINANCIAL_TRANSACTION",

            transaction

        );








    EventBus.publish(

        "TRIP_PROFIT_CALCULATED",

        {

            after:result,

            entity:
                "FINANCIAL_TRANSACTION",

            entityId:
                result.TransactionID

        }

    );





    Logger.log(

        "FINANCE TRANSACTION CREATED "
        +
        result.TransactionID

    );




    return result;



}
catch(error){


    Logger.error(

        "FINANCE TRANSACTION ERROR "
        +
        error.message

    );


}



},







/*
====================================
BALANCE OPERATIONS
====================================
*/


addTransaction(
    clientId,
    amount,
    type
){



return EntityService.create(

    "FINANCIAL_TRANSACTION",

    {


        ClientID:
            clientId,


        Amount:
            amount,


        Type:
            type,


        Status:
            "POSTED"


    }


);



},







getOrganizationID(){



if(
globalThis.OrganizationContext
){

    return OrganizationContext.get();

}


return "DEFAULT";



},







health(){


return HealthContract.create(


"FinanceEngine",


this.ready
?
"OK"
:
"NOT_READY",


{


version:this.version


}



);



}



};





globalThis.FinanceEngine =
FinanceEngine;