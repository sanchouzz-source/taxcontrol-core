EventBus.subscribe(
 "TRANSPORT_ORDER_CREATED",
 AuditEventHandler.handle
);


EventBus.subscribe(
 "TRANSPORT_ORDER_CREATED",
 TripEventHandler.handle
);


EventBus.subscribe(
 "TRANSPORT_ORDER_CREATED",
 KPIEngine.handle
);