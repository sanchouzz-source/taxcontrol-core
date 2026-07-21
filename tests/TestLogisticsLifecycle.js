function testLogisticsLifecycle() {
  Logger.log("===== LOGISTICS TEST START =====");

  // CREATE
  const order = EntityService.create("TRANSPORT_ORDER", {
    OrganizationID: "ORG000001",
    ClientID: "CLI000040",
    OrderNumber: "ORD-001",
    LoadingAddress: "Вологда",
    DeliveryAddress: "Москва",
    CargoWeight: 20000,
    Status: "NEW"
  });

  Logger.log("ORDER CREATED " + order.TransportOrderID);

  // READ
  const found = EntityService.findById("TRANSPORT_ORDER", order.TransportOrderID);
  if (!found) throw new Error("READ FAILED");
  Logger.log("ORDER READ OK");

  // UPDATE
  EntityService.update("TRANSPORT_ORDER", order.TransportOrderID, {
    Status: "LOADED"
  });
  Logger.log("ORDER UPDATE OK");

  // DELETE
  EntityService.delete("TRANSPORT_ORDER", order.TransportOrderID);
  Logger.log("ORDER DELETE OK");

  // RESTORE
  EntityService.restore("TRANSPORT_ORDER", order.TransportOrderID);
  Logger.log("ORDER RESTORE OK");

  Logger.log("===== LOGISTICS TEST PASS =====");
}