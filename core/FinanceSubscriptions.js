const FinanceSubscriptions = {

    init(){

        EventBus.subscribe(
            "TRANSPORT_ORDER_CREATED",
            FinanceEngine.onTransportOrderCreated
        );

        EventBus.subscribe(
            "TRANSPORT_ORDER_UPDATED",
            FinanceEngine.onTransportOrderUpdated
        );

    }

};