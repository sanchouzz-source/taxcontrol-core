function testTransportOrderEventLifecycle() {

  Logger.log("===== TRANSPORT ORDER EVENT LIFECYCLE START =====");


  const events = [];


  const handler = event => {

    Logger.log(
      "EVENT RECEIVED " + event
    );

    events.push(event);

  };


  EventBus.subscribe(
    "TRANSPORT_ORDER_CREATED",
    handler,
    {name:"Lifecycle_CREATE"}
  );

  EventBus.subscribe(
    "TRANSPORT_ORDER_UPDATED",
    handler,
    {name:"Lifecycle_UPDATE"}
  );

  EventBus.subscribe(
    "TRANSPORT_ORDER_DELETED",
    handler,
    {name:"Lifecycle_DELETE"}
  );

  EventBus.subscribe(
    "TRANSPORT_ORDER_RESTORED",
    handler,
    {name:"Lifecycle_RESTORE"}
  );


  const order = EntityService.create(
    "TRANSPORT_ORDER",
    {
      OrganizationID:"ORG000001",
      ClientID:"CLI000040",
      OrderNumber:"ORD-TEST",
      LoadingAddress:"Вологда",
      DeliveryAddress:"Москва",
      CargoWeight:20000,
      Status:"NEW"
    }
  );


  EntityService.update(
    "TRANSPORT_ORDER",
    order.TransportOrderID,
    {
      Status:"LOADED"
    }
  );


  EntityService.delete(
    "TRANSPORT_ORDER",
    order.TransportOrderID
  );


  EntityService.restore(
    "TRANSPORT_ORDER",
    order.TransportOrderID
  );


  if(events.length !== 4){

    throw new Error(
      "EVENT COUNT FAILED " + events.length
    );

  }


  Logger.log(
    "EVENTS OK " + JSON.stringify(events)
  );


  Logger.log(
    "===== TRANSPORT ORDER EVENT LIFECYCLE PASS ====="
  );
}