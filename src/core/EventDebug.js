function debugEvents(){

  Logger.log("===== EVENT BUS =====");

  const events = EventBus.list();

  events.forEach(e=>{
    Logger.log(
      e + 
      " handlers=" +
      EventBus.listeners(e)
    );
  });

}