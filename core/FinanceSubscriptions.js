// ============================================================
// FinanceSubscriptions v2.0.0
// Finance Event Subscriber
// TaxControl ERP Core
//
// Compatible:
// EventBus v2.x
// FinanceEngine
// HealthService v2+
// ModuleRegistry
// ============================================================


console.log("FinanceSubscriptions v2.0.0");



const FinanceSubscriptions = {


version:"2.0.0",


ready:false,


registered:false,


subscriptions:[],


stats:{


received:0,


processed:0,


failed:0


},







// ============================================================
// INIT
// ============================================================


init(){


if(this.ready){

Logger.debug(
"FinanceSubscriptions already READY"
);

return true;

}



if(
typeof EventBus==="undefined"
){

throw new Error(
"EventBus unavailable for FinanceSubscriptions"
);

}



if(
typeof FinanceEngine==="undefined"
){

throw new Error(
"FinanceEngine unavailable"
);

}



this.register();



this.ready=true;



Logger.log(
"FinanceSubscriptions READY v"+
this.version
);



return true;


},







// ============================================================
// REGISTER
// ============================================================


register(){


if(this.registered){

return;

}



this.subscribe(

"TRANSPORT_ORDER_CREATED",

FinanceEngine.onTransportOrderCreated,

"Finance_TransportOrderCreated"

);



this.subscribe(

"TRANSPORT_ORDER_UPDATED",

FinanceEngine.onTransportOrderUpdated,

"Finance_TransportOrderUpdated"

);



this.subscribe(

"PAYMENT_RECEIVED",

FinanceEngine.onPaymentReceived,

"Finance_PaymentReceived"

);



this.subscribe(

"EXPENSE_CREATED",

FinanceEngine.onExpenseCreated,

"Finance_ExpenseCreated"

);



this.registered=true;



},







// ============================================================
// SUBSCRIBE WRAPPER
// ============================================================


subscribe(event,handler,name){



if(
!event ||
typeof handler!=="function"
){

Logger.warn(
"Finance subscription skipped "+event
);


return false;

}



EventBus.subscribe(

event,

payload=>{


try{


this.stats.received++;


handler.call(
FinanceEngine,
payload
);


this.stats.processed++;


}
catch(e){


this.stats.failed++;


Logger.error(

"Finance event error "+
event+
": "+
e.message

);


}

},

{


name,

module:
"FinanceSubscriptions"

}


);




this.subscriptions.push({

event,

name,

status:"ACTIVE",

createdAt:
new Date().toISOString()

});



Logger.log(
"Finance SUBSCRIBED "+event
);



return true;


},







// ============================================================
// RESET
// ============================================================


reset(){



if(
typeof EventBus!=="undefined"
&&
EventBus.unsubscribe
){

this.subscriptions.forEach(item=>{


EventBus.unsubscribe(
item.event,
item.name
);


});


}



this.subscriptions=[];

this.registered=false;

this.ready=false;



},







// ============================================================
// HEALTH
// ============================================================


health(){


return HealthContract.create(

"FinanceSubscriptions",

this.ready
?
"OK"
:
"WARNING",

{


version:this.version,


subscriptions:
this.subscriptions.length,


events:
this.subscriptions.map(
x=>x.event
),


stats:this.stats


}


);


}



};





globalThis.FinanceSubscriptions =
FinanceSubscriptions;



Logger.log(
"FinanceSubscriptions READY v"+
FinanceSubscriptions.version
);