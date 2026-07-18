console.log("FinanceEngine");


const FinanceEngine={


version:"1.0.1",


ready:false,





init(){


if(this.ready){

return;

}



EventBus.subscribe(

"CLIENT_CREATED",

client=>{


this.createProfile(client);

}


);



EventBus.subscribe(

"TRIP_COMPLETED",

trip=>{


this.createTransaction(trip);


}


);



this.ready=true;



Logger.log(
"FinanceEngine READY v"
+
this.version
);


},







createProfile(client){


try{


return EntityService.create(

"CLIENT_FINANCE_PROFILE",

{


OrganizationID:
client.OrganizationID,


ClientID:
client.ClientID,


ClientName:
client.Name,


Balance:0,


CreditLimit:0,


Status:"ACTIVE"


}


);



}
catch(e){


Logger.error(
"FINANCE PROFILE ERROR "
+
e.message
);


}



},







createTransaction(trip){


return EntityService.create(

"FINANCIAL_TRANSACTION",

{


OrganizationID:
trip.OrganizationID,


Type:
"TRIP_PROFIT",


Entity:
"TRIP",


EntityID:
trip.TripID,


Revenue:
Number(trip.Revenue||0),


Cost:
Number(trip.ActualCost||0),


Profit:
Number(trip.Revenue||0)
-
Number(trip.ActualCost||0)


}


);


}






};



globalThis.FinanceEngine =
FinanceEngine;