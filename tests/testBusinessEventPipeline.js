function testBusinessEventPipeline(){


 Logger.log(
 "===== BUSINESS PIPELINE TEST START ====="
 );



 const event={

   entity:"TRANSPORT_ORDER",

   action:"CREATED",

   data:{
     TransportOrderID:"TO-TEST"
   },

   timestamp:new Date()

 };



 BusinessEventProcessor.process(event);



 Logger.log(
 "===== BUSINESS PIPELINE TEST PASS ====="
 );


}