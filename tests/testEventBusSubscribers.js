function testEventBusSubscribers(){

Logger.info(
"===== EVENTBUS SUBSCRIBERS TEST ====="
);


if(
typeof EventBus.getSubscribers === "function"
){

Logger.info(
JSON.stringify(
EventBus.getSubscribers()
)
);

}
else{

Logger.warn(
"EventBus.getSubscribers unavailable"
);

}


}