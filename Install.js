function installSystem(){


Logger.log(
"ERP INSTALL START"
);



SystemInit.init();



if(
typeof LogisticsEventSubscriptions!=="undefined"
){

LogisticsEventSubscriptions.init();

}



if(
typeof TripEventHandler!=="undefined"
){

TripEventHandler.init();

}



if(
typeof TransportOrderEventHandler!=="undefined"
){

TransportOrderEventHandler.init();

}



Logger.log(
"ERP INSTALL COMPLETE"
);



}