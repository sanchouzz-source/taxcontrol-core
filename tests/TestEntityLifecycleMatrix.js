console.log("testEntityLifecycleMatrix");

function testEntityLifecycleMatrix() {
  console.log("========== ENTITY MATRIX START ==========");

  // ---------- SYSTEM INIT (bootstrap) ----------
  if (typeof SystemStartupTest !== "undefined") {
    SystemStartupTest.run();
  } else {
    console.log("Manual ERP INIT");
    if (typeof SchemaManager !== "undefined" && SchemaManager.init) {
      SchemaManager.init();
    }
    if (typeof Database !== "undefined" && Database.init) {
      Database.init?.();
    }
    if (typeof CoreRegistry !== "undefined" && CoreRegistry.load) {
      CoreRegistry.load?.();
    }
    if (typeof EventBus !== "undefined" && EventBus.init) {
      EventBus.init?.();
    }
    if (typeof AuditEventHandler !== "undefined" && AuditEventHandler.init) {
      AuditEventHandler.init?.();
    }
    if (typeof RepositoryFactory !== "undefined" && RepositoryFactory.init) {
      RepositoryFactory.init?.();
    }
    if (typeof EntityService !== "undefined" && EntityService.init) {
      EntityService.init?.();
    }
    if (typeof ModuleLoader !== "undefined" && ModuleLoader.init) {
      ModuleLoader.init?.();
    }
  }

  console.log("ERP SYSTEM READY");

  // ---------- МАТРИЦА СУЩНОСТЕЙ ----------
  const ENTITY_MATRIX = [
    {
      entity: "CLIENT",
      repository: "ClientRepository",
      events: [
        "CLIENT_CREATED",
        "CLIENT_UPDATED",
        "CLIENT_DELETED",
        "CLIENT_RESTORED"
      ],
      factoryData: {
        Name: "Matrix Test Client",
        INN: "7777777777",
        Phone: "+79990000001",
        Email: "matrix@test.ru",
        Status: "ACTIVE"
      }
    },
    {
      entity: "TRIP",
      repository: "TripRepository",
      events: [
        "TRIP_CREATED",
        "TRIP_UPDATED",
        "TRIP_DELETED",
        "TRIP_RESTORED"
      ],
      factoryData: {
        ClientID: "CLI000001",  // должен существовать в БД
        Status: "NEW",
        Destination: "Test Destination"
      }
    },
    {
      entity: "KPI",
      repository: "KPIRepository",
      events: [
        "KPI_CREATED",
        "KPI_UPDATED"
        // KPI не поддерживает restore, поэтому событий RESTORED нет
      ],
      factoryData: {
        Name: "Test KPI",
        Value: 100,
        Category: "Test"
      }
    }
  ];

  // ---------- ЦИКЛ ПО СУЩНОСТЯМ ----------
  let allPassed = true;
  for (const entry of ENTITY_MATRIX) {
    const { entity, repository: repoName, factoryData } = entry;
    const repository = globalThis[repoName];
    if (!repository) {
      Logger.warn(`Repository ${repoName} not found, skipping ${entity}`);
      continue;
    }
    try {
      TestEntityLifecycleMatrix.run(entity, repository, factoryData);
    } catch (err) {
      Logger.error(`❌ Test failed for ${entity}: ${err.message}`);
      allPassed = false;
      // Продолжаем с остальными сущностями (можно прервать, если нужно)
    }
  }

  if (allPassed) {
    console.log("========== ENTITY MATRIX SUCCESS ==========");
  } else {
    console.log("========== ENTITY MATRIX COMPLETED WITH ERRORS ==========");
  }
}

globalThis.testEntityLifecycleMatrix = testEntityLifecycleMatrix;
Logger.log("testEntityLifecycleMatrix READY");