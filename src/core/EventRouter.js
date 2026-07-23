const EventRouter={


route(event){

switch(event.entity){

case "TRANSPORT_ORDER":

this.routeTransport(event);

break;


case "FINANCIAL_TRANSACTION":

this.routeFinance(event);

break;


}

},


routeTransport(event){

EventBus.emit(
`${event.entity}_${event.type}`,
event
);

}

};