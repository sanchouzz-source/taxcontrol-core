// ============================================================
// Menu v1.7.0
// TaxControl ERP UI Menu
//
// Every callback that reads initialized runtime components
// starts the ERP inside the current Apps Script invocation.
// ============================================================

console.log("Menu v1.7.0");

function ensureERPStarted_() {
  const bootstrap = globalThis.Bootstrap;

  if (
    !bootstrap ||
    typeof bootstrap.ensureStarted !== "function"
  ) {
    throw new Error("Bootstrap.ensureStarted unavailable");
  }

  const result = bootstrap.ensureStarted();

  if (result && typeof result.then === "function") {
    throw new Error(
      "ERP startup must be synchronous"
    );
  }

  return result;
}

function componentVersion_(name) {
  const component = globalThis[name];
  return component && component.version
    ? component.version
    : "-";
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu("🚀 TaxControl ERP");

  menu
    .addItem("▶ Запустить ERP", "startERP")
    .addItem("❤️ Проверка системы", "erpHealth")
    .addItem("🔍 Диагностика ERP", "erpDiag")
    .addItem("📦 Версия ERP", "showERPVersion")
    .addSeparator();

  menu.addSubMenu(
    ui
      .createMenu("🧠 ERP Control Center")
      .addItem(
        "🚀 Полная диагностика",
        "erpControlCenter"
      )
      .addItem("📋 Статус ERP", "erpControlStatus")
      .addItem(
        "🖥 Runtime Report",
        "erpRuntimeReport"
      )
      .addItem(
        "📊 ERP Dashboard",
        "openERPControlDashboard"
      )
      .addItem(
        "🔄 Refresh Dashboard",
        "refreshERPControlDashboard"
      )
  );

  menu.addSubMenu(
    ui
      .createMenu("🗄 Repository")
      .addItem(
        "🏥 Repository Health",
        "repositoryHealth"
      )
      .addItem(
        "📋 Repository Details",
        "repositoryHealthDetails"
      )
      .addItem(
        "🖨 Repository Report",
        "repositoryPrint"
      )
  );

  menu.addSubMenu(
    ui
      .createMenu("🧩 Services")
      .addItem("🏥 Service Health", "serviceHealth")
      .addItem(
        "📋 Service Registry",
        "serviceRegistryReport"
      )
      .addItem(
        "🔄 Refresh Services",
        "refreshServices"
      )
  );

  menu.addSubMenu(
    ui
      .createMenu("🧪 Тестирование")
      .addItem("▶ SAFE тесты", "runTests")
      .addItem("🔥 FULL тесты", "runTestsFull")
      .addItem(
        "🏗 Core Infrastructure",
        "testCoreInfrastructure"
      )
      .addItem(
        "🔄 Entity Lifecycle",
        "testEntityLifecycleMatrix"
      )
      .addItem(
        "🚀 System Init Contract",
        "runSystemInitContractTest"
      )
      .addItem(
        "🧩 Service Registry Contract",
        "runServiceRegistryContractTest"
      )
      .addItem("📋 Test Report", "testReport")
  );

  menu.addSubMenu(
    ui
      .createMenu("👥 Клиенты")
      .addItem("Добавить клиента", "createClientUI")
      .addItem("Обновить клиентов", "refreshClients")
  );

  menu.addSubMenu(
    ui
      .createMenu("📊 Dashboard")
      .addItem(
        "Обновить Dashboard",
        "refreshDashboard"
      )
      .addItem("KPI отчет", "showKPIReport")
  );

  menu.addSubMenu(
    ui
      .createMenu("🛠 Обслуживание")
      .addItem("Repair Database", "repairDatabase")
      .addItem("Очистить Cache", "clearERPCache")
      .addItem(
        "Проверить дубли",
        "runDuplicateCheck"
      )
      .addItem("ERP Reset", "resetERP")
  );

  menu.addToUi();
  Logger.log("ERP MENU CREATED v1.7.0");
}

function serviceHealth() {
  ensureERPStarted_();

  const registry = globalThis.ServiceRegistry;

  if (!registry) {
    throw new Error("ServiceRegistry unavailable");
  }

  const result = registry.health();

  SpreadsheetApp.getUi().alert(
    "Service Health\n\n" +
      JSON.stringify(result, null, 2)
  );

  return result;
}

function serviceRegistryReport() {
  ensureERPStarted_();

  const registry = globalThis.ServiceRegistry;

  if (!registry) {
    throw new Error("ServiceRegistry unavailable");
  }

  const result = {
    version: registry.version,
    services: registry.list(),
    count: registry.count(),
  };

  Logger.log(JSON.stringify(result, null, 2));

  SpreadsheetApp.getUi().alert(
    "Service Registry\n\n" +
      JSON.stringify(result, null, 2)
  );

  return result;
}

function refreshServices() {
  ensureERPStarted_();

  const registry = globalThis.ServiceRegistry;

  if (!registry) {
    throw new Error("ServiceRegistry unavailable");
  }

  registry.refresh();

  SpreadsheetApp.getUi().alert(
    "Services refreshed"
  );

  return registry.health();
}

function showERPVersion() {
  const info = {
    ERP: "TaxControl",
    Bootstrap: componentVersion_("Bootstrap"),
    ERPBootstrap: componentVersion_("ERPBootstrap"),
    App: componentVersion_("App"),
    SystemInit: componentVersion_("SystemInit"),
    ServiceRegistry:
      componentVersion_("ServiceRegistry"),
    ClientService:
      componentVersion_("ClientService"),
    TransportOrderService:
      componentVersion_("TransportOrderService"),
    FinanceService:
      componentVersion_("FinanceService"),
    KPIService: componentVersion_("KPIService"),
    Database: componentVersion_("Database"),
    BaseRepository:
      componentVersion_("BaseRepository"),
    RepositoryFactory:
      componentVersion_("RepositoryFactory"),
    RepositoryRegistry:
      componentVersion_("RepositoryRegistry"),
    EventBus: componentVersion_("EventBus"),
  };

  Logger.log(JSON.stringify(info, null, 2));
  SpreadsheetApp.getUi().alert(
    JSON.stringify(info, null, 2)
  );

  return info;
}

function clearERPCache() {
  try {
    ensureERPStarted_();

    const database = globalThis.Database;

    if (
      database &&
      typeof database.clearCache === "function"
    ) {
      database.clearCache();
    }

    SpreadsheetApp.getUi().alert(
      "ERP Cache очищен"
    );
  } catch (error) {
    SpreadsheetApp.getUi().alert(
      "Cache error: " + error.message
    );
  }
}

Logger.log("ERP MENU READY v1.7.0");
