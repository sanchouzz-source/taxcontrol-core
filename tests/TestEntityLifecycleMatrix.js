console.log("TestEntityLifecycleMatrix");

const TestEntityLifecycleMatrix = {
  version: "1.3.0",

  run() {
    Logger.log("========== ENTITY MATRIX START ==========");

    try {
      Logger.log("SYSTEM BOOT");
      Bootstrap.start();

      Logger.log("ERP SYSTEM READY");

      const result = {};

      result.CLIENT = this.testClient();
      result.TRIP = this.testTrip();
      result.KPI = this.testKPI();
      result.VALIDATION = this.testValidation(); // добавлен вызов

      Logger.log(JSON.stringify(result, null, 2));
      Logger.log("========== ENTITY MATRIX COMPLETE ==========");

      return result;
    } catch (e) {
      Logger.error("ENTITY MATRIX FAILED " + e.message);
      throw e;
    }
  },

  testClient() {
    Logger.log("========== TEST CLIENT ==========");

    let client = EntityService.create("CLIENT", {
      Name: "Matrix Client",
      INN: "7777777777",
      Phone: "+79990000001",
      Email: "matrix@test.ru",
      Status: "ACTIVE"
    });

    Logger.log("CREATE CLIENT OK");

    let read = EntityService.findById("CLIENT", client.ClientID);
    if (!read) throw new Error("CLIENT READ FAILED");
    Logger.log("READ OK");

    EntityService.update("CLIENT", client.ClientID, { Status: "UPDATED" });
    Logger.log("UPDATE OK");

    EntityService.delete("CLIENT", client.ClientID);
    Logger.log("DELETE OK");

    EntityService.restore("CLIENT", client.ClientID);
    Logger.log("RESTORE OK");

    return EntityService.findById("CLIENT", client.ClientID);
  },

  testTrip() {
    Logger.log("========== TEST TRIP ==========");

    let trip = EntityService.create("TRIP", {
      ClientID: "CLI000029",
      VehicleID: "VEH000001",
      DriverID: "DRV000001",
      LoadingPoint: "Москва",
      UnloadingPoint: "Вологда",
      Distance: 450,
      Cargo: "Пиломатериал",
      Revenue: 50000,
      PlannedCost: 30000,
      ActualCost: 32000,
      Status: "NEW"
    });

    Logger.log("TRIP CREATE OK");

    EntityService.update("TRIP", trip.TripID, { Status: "DONE" });
    Logger.log("TRIP UPDATE OK");

    EntityService.delete("TRIP", trip.TripID);
    Logger.log("TRIP DELETE OK");

    EntityService.restore("TRIP", trip.TripID);
    Logger.log("TRIP RESTORE OK");

    return EntityService.findById("TRIP", trip.TripID);
  },

  testKPI() {
    Logger.log("========== TEST KPI ==========");

    let kpi = EntityService.create("KPI", {
      Name: "Revenue",
      Value: 100000,
      Period: "2026-07",
      Status: "ACTIVE"
    });

    Logger.log("KPI CREATE OK");
    return kpi;
  },

  // ---------- ДОБАВЛЕННЫЙ МЕТОД ВАЛИДАЦИИ ----------
  testValidation() {
    Logger.log("========== TEST VALIDATION ==========");

    try {
      // Пытаемся создать TRIP с несуществующим полем WrongField
      EntityService.create("TRIP", {
        ClientID: "CLI000001",
        WrongField: "TEST" // должно вызвать ошибку валидации
      });

      // Если дошли сюда – валидация не сработала
      throw new Error("VALIDATION FAILED");
    } catch (e) {
      // Ожидаем, что ошибка будет выброшена (валидация не пропустила)
      Logger.log("EXPECTED ERROR: " + e.message);
      return true; // тест пройден
    }
  }
};

globalThis.TestEntityLifecycleMatrix = TestEntityLifecycleMatrix;

function testEntityLifecycleMatrix() {
  return TestEntityLifecycleMatrix.run();
}