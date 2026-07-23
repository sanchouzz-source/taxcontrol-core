function testEventReliability() {

  Logger.log(
    "===== EVENT RELIABILITY TEST START ====="
  );


  const testId = "TO-RETRY-" + Date.now();


  const event =
    ERPEventContract.create({

      entity: "TRANSPORT_ORDER",

      type: "CREATED",

      entityId: testId,

      after: {

        TransportOrderID: testId,

        ClientID: "CLIENT-TEST-001",

        Status: "NEW",

        Amount: 15000

      },

      source: "TEST",

      user: "SYSTEM"

    });



  Logger.log(
    "EVENT CREATED: " +
    JSON.stringify(event)
  );



  try {


    // 1. Проверяем BusinessEventProcessor

    BusinessEventProcessor.process(
      event
    );



    Logger.log(
      "PROCESS RESULT: SUCCESS"
    );



    // 2. Проверяем что событие опубликовано

    Logger.log(
      "CHECK EVENTBUS HANDLERS"
    );


    const handlers =
      EventBus
        .diagnostics
        ?
        EventBus.diagnostics()
        :
        null;



    if (handlers) {

      Logger.log(
        "EVENTBUS STATUS: "+
        JSON.stringify(handlers)
      );

    }



    // 3. Проверяем KPI подписку


    if (
      typeof KPISubscriptions !== "undefined"
    ){

      Logger.log(
        "KPI STATUS: "+
        JSON.stringify(
          KPISubscriptions.health()
        )
      );

    }



    // 4. Проверяем Notification


    if (
      typeof NotificationSubscriptions !== "undefined"
    ){

      Logger.log(
        "NOTIFICATION STATUS: "+
        JSON.stringify(
          NotificationSubscriptions.health()
        )
      );

    }



    // 5. Проверяем состояние процессора


    Logger.log(
      "PROCESSOR HEALTH: "+
      JSON.stringify(
        BusinessEventProcessor.health()
      )
    );



  }

  catch(e){


    Logger.error(
      "EVENT PROCESS FAILED: "+
      e.message
    );



    Logger.error(
      e.stack
    );


  }



  Logger.log(
    "===== EVENT RELIABILITY TEST END ====="
  );

}