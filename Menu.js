// ============================================================
// Menu v1.5.1
// TaxControl ERP UI Menu
//
// Enterprise Runtime Menu
//
// Compatible:
//
// ERPBootstrap v4+
// Bootstrap v3+
// SystemInit v2.8+
// ERPDiagnostics v6+
// RepositoryRegistry v2+
// RepositoryHealthReport v2+
// ERPControlDashboard v1+
//
// ============================================================

console.log("Menu v1.5.1");

function onOpen() {
  const ui = SpreadsheetApp.getUi();

  const menu = ui.createMenu("🚀 TaxControl ERP");

  // ====================================================
  // SYSTEM
  // ====================================================

  menu
    .addItem("▶ Запустить ERP", "erpStart")
    .addItem("❤️ Проверка системы", "erpHealth")
    .addItem("🔍 Диагностика ERP", "erpDiag")
    .addItem("📦 Версия ERP", "showERPVersion")
    .addSeparator();

  // ====================================================
  // ERP CONTROL CENTER
  // ====================================================

  menu.addSubMenu(
    ui.createMenu("🧠 ERP Control Center")
      .addItem("🚀 Полная диагностика ERP", "erpControlCenter")
      .addItem("📋 Статус ERP", "erpControlStatus")
      .addItem("🖥 Runtime Report", "erpRuntimeReport")
      // ---------- НОВЫЕ ПУНКТЫ ----------
      .addItem("📊 Открыть ERP Dashboard", "openERPControlDashboard")
      .addItem("🔄 Обновить ERP Dashboard", "refreshERPControlDashboard")
  );

  // ====================================================
  // REPOSITORY
  // ====================================================

  menu.addSubMenu(
    ui.createMenu("🗄 Repository")
      .addItem("🏥 Repository Health", "repositoryHealth")
      .addItem("📋 Repository Details", "repositoryHealthDetails")
      .addItem("🖨 Print Repository Report", "repositoryPrint")
  );

  // ====================================================
  // TESTS
  // ====================================================

  menu.addSubMenu(
    ui.createMenu("🧪 Тестирование")
      .addItem("▶ SAFE тесты", "runTests")
      .addItem("🔥 FULL тесты", "runTestsFull")
      .addItem("📋 Отчет тестов", "testReport")
      .addItem("🏗 Infrastructure Test", "testCoreInfrastructure")
      .addItem("🔄 Entity Lifecycle", "testEntityLifecycleMatrix")
      .addItem("📊 Test Dashboard", "openTestDashboard")
      .addItem("🚀 Tests + Dashboard", "runTestsDashboard")
  );

  // ====================================================
  // CLIENTS
  // ====================================================

  menu.addSubMenu(
    ui.createMenu("👥 Клиенты")
      .addItem("Добавить клиента", "createClientUI")
      .addItem("Обновить клиентов", "refreshClients")
  );

  // ====================================================
  // DASHBOARD
  // ====================================================

  menu.addSubMenu(
    ui.createMenu("📊 Dashboard")
      .addItem("Обновить Dashboard", "refreshDashboard")
      .addItem("KPI отчет", "showKPIReport")
  );

  // ====================================================
  // SERVICE
  // ====================================================

  menu.addSubMenu(
    ui.createMenu("🛠 Обслуживание")
      .addItem("Repair Database", "repairDatabase")
      .addItem("Очистить Cache", "clearERPCache")
      .addItem("Проверить дубли", "runDuplicateCheck")
      .addItem("ERP Reset", "resetERP")
  );

  menu.addToUi();

  Logger.log("ERP MENU CREATED v1.5.1");
}

// ============================================================
// ERP CONTROL CENTER
// ============================================================

function erpControlCenter() {
  if (typeof ERPControlCenter === "undefined") {
    throw new Error("ERPControlCenter unavailable");
  }
  return ERPControlCenter.print();
}

function erpControlStatus() {
  let result;
  if (typeof ERPControlCenter !== "undefined" && ERPControlCenter.status) {
    result = ERPControlCenter.status();
  } else {
    result = ERPBootstrap.health();
  }
  SpreadsheetApp.getUi().alert(
    "TaxControl ERP\n\n" + JSON.stringify(result, null, 2)
  );
  return result;
}

function erpRuntimeReport() {
  let report;
  if (typeof ERPDiagnostics !== "undefined") {
    report = ERPDiagnostics.run({ skipCoreTest: true });
  } else {
    report = { error: "ERPDiagnostics unavailable" };
  }
  Logger.log(JSON.stringify(report, null, 2));
  SpreadsheetApp.getUi().alert(
    "ERP Runtime Report\n\n" + JSON.stringify(report, null, 2)
  );
  return report;
}

// ============================================================
// ERP CONTROL DASHBOARD (новые функции)
// ============================================================

function openERPControlDashboard() {
  if (typeof ERPControlDashboard === "undefined") {
    throw new Error("ERPControlDashboard unavailable");
  }
  ERPControlDashboard.build();
}

function refreshERPControlDashboard() {
  if (typeof ERPControlDashboard === "undefined") {
    throw new Error("ERPControlDashboard unavailable");
  }
  ERPControlDashboard.refresh();
  SpreadsheetApp.getUi().alert("ERP Dashboard обновлен");
}

// ============================================================
// REPOSITORY
// ============================================================

function repositoryHealth() {
  if (typeof RepositoryHealthReport === "undefined") {
    throw new Error("RepositoryHealthReport unavailable");
  }
  return RepositoryHealthReport.print();
}

function repositoryPrint() {
  return repositoryHealth();
}

function repositoryHealthDetails() {
  const details = RepositoryHealthReport.details();
  SpreadsheetApp.getUi().alert(
    "Repository Health\n\n" +
      "Всего: " +
      details.summary.total +
      "\nOK: " +
      details.summary.ok +
      "\nWARNING: " +
      details.summary.warning +
      "\nREADY: " +
      details.summary.readyPercent +
      "%"
  );
  return details;
}

// ============================================================
// VERSION
// ============================================================

function showERPVersion() {
  let info = {
    ERP: "TaxControl",
    ERPBootstrap: ERPBootstrap?.version || "-",
    Bootstrap: Bootstrap?.version || "-",
    App: App?.version || "-",
    SystemInit: SystemInit?.version || "-",
    ERPDiagnostics: ERPDiagnostics?.version || "-",
    SchemaManager: SchemaManager?.version || "-",
    SchemaRegistry: SchemaRegistry?.version || "-",
    EntityRegistry: EntityRegistry?.version || "-",
    Database: Database?.version || "-",
    BaseRepository: BaseRepository?.version || "-",
    RepositoryFactory: RepositoryFactory?.version || "-",
    RepositoryRegistry: RepositoryRegistry?.version || "-",
    RepositoryHealthReport: RepositoryHealthReport?.version || "-",
    EntityService: EntityService?.version || "-",
    EventBus: EventBus?.version || "-"
  };
  Logger.log(JSON.stringify(info, null, 2));
  SpreadsheetApp.getUi().alert(JSON.stringify(info, null, 2));
  return info;
}

// ============================================================
// CACHE
// ============================================================

function clearERPCache() {
  try {
    if (typeof Database !== "undefined" && Database.clearCache) {
      Database.clearCache();
    }
    SpreadsheetApp.getUi().alert("ERP Cache очищен");
  } catch (e) {
    SpreadsheetApp.getUi().alert("Cache error: " + e.message);
  }
}

Logger.log("ERP MENU READY v1.5.1");