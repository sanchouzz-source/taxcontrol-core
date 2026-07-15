console.log("FinanceEngine");


const FinanceEngine = {


version:"0.3.0",


initialized:false,





health(){


return HealthContract.create(

"FinanceEngine",

this.initialized
?
"OK"
:
"WARNING",

{

version:this.version,


initialized:this.initialized,


dependencies:{


EventBus:
!!globalThis.EventBus,


Database:
!!globalThis.Database,


IdService:
!!globalThis.IdService


}

}

);


},







init(){



if(this.initialized){


Logger.log(

"FinanceEngine ALREADY READY"

);


return;


}






if(!globalThis.EventBus){


throw new Error(

"FinanceEngine: EventBus missing"

);


}





EventBus.on(

"TRIP_COMPLETED",

trip=>{


this.calculateTripProfit(trip);


}

);







EventBus.on(

"CLIENT_CREATED",

client=>{


this.initClientFinance(client);


}

);






this.initialized=true;



Logger.log(

"FinanceEngine READY v"
+
this.version

);


},







calculateTripProfit(trip){



if(!trip){


Logger.log(

"FINANCE EMPTY TRIP"

);


return null;


}






const revenue = Number(

trip.Revenue || 0

);





const cost = Number(

trip.ActualCost || 0

);





const profit =
revenue - cost;







const transaction={



TransactionID:

IdService.generate(
"FIN"
),



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

profit,



CreatedAt:

new Date()
.toISOString()



};







Database.insert(

"FinancialTransactions",

transaction

);








EventBus.emit(

"TRIP_PROFIT_CALCULATED",

{

transaction,

profit

}

);






Logger.log(

"FINANCE CREATED: "
+
transaction.TransactionID

);




return transaction;



},







initClientFinance(client){



if(!client){


Logger.log(

"FINANCE CLIENT EMPTY"

);


return null;


}






const profile={



FinanceProfileID:

IdService.generate(
"FP"
),



OrganizationID:

client.OrganizationID
||
this.getOrganizationID(),



ClientID:

client.ClientID,



ClientName:

client.Name,



Balance:

0,



CreditLimit:

0,



Status:

"ACTIVE",



CreatedAt:

new Date()
.toISOString()



};







Database.insert(

"ClientFinanceProfiles",

profile

);








Logger.log(

"FINANCE PROFILE CREATED: "
+
profile.FinanceProfileID

);





return profile;



},








getOrganizationID(){



if(

globalThis.OrganizationContext

){



return OrganizationContext.get();


}





return "DEFAULT";


}





};






globalThis.FinanceEngine =
FinanceEngine;