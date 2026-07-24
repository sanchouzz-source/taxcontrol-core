console.log("TransportOrderBusinessHandler v1.0");


const TransportOrderBusinessHandler = {

version:"1.0.0",

ready:false,


init(){

 EventBus.subscribe(
   "TRANSPORT_ORDER_CREATED",
   this.created.bind(this),
   {
    name:"TransportOrderBusiness_CREATED"
   }
 );


 this.ready=true;

 Logger.info(
 "TransportOrderBusinessHandler READY"
 );

},


created(event){

 const order =
 event.payload || event.data;


 Logger.info(
 `BUSINESS LOGIC TRANSPORT ORDER CREATED ${order.TransportOrderID}`
 );


 // здесь:
 // CRM
 // KPI
 // финансы
 // уведомления
 // аналитика


}


};


globalThis.TransportOrderBusinessHandler =
TransportOrderBusinessHandler;