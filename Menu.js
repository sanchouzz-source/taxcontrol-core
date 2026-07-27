// ============================================================
// Menu v1.2.0
// TaxControl ERP UI Menu
//
// Added:
// - Test Dashboard integration
// ============================================================

console.log("Menu v1.2.0");

function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu("🚀 TaxControl ERP")

    // ====================================================
    // SYSTEM
    // ====================================================

    .addItem("▶ Запустить ERP", "erpStart")
    .addItem("❤️ Проверка системы", "erpHealth")
    .addItem("🔍 Диагностика ERP", "erpDiag")
    .addSeparator()

    // ====================================================
    // TESTS
    // ====================================================

    .addSubMenu(
      ui.createMenu("🧪 Тестирование")

        .addItem("▶ Запустить тесты SAFE", "runTests")
        .addItem("🔥 Запустить FULL тесты", "runTestsFull")
        .addItem("📋 Отчет тестов", "testReport")
        .addItem("🏗 Проверка инфраструктуры", "testCoreInfrastructure")
        .addItem("🔄 Entity Lifecycle тест", "testEntityLifecycleMatrix")

        // ----- НОВЫЕ ПУНКТЫ -----
        .addItem("📊 Открыть Test Dashboard", "openTestDashboard")
        .addItem("🚀 Запустить тесты + Dashboard", "runTestsDashboard")
    )

    .addSeparator()

    // ====================================================
    // CLIENTS
    // ====================================================

    .addSubMenu(
      ui.createMenu("👥 Клиенты")
        .addItem("Добавить клиента", "createClientUI")
        .addItem("Обновить клиентов", "refreshClients")
    )

    // ====================================================
    // DASHBOARD
    // ====================================================

    .addSubMenu(
      ui.createMenu("📊 Dashboard")
        .addItem("Обновить Dashboard", "refreshDashboard")
        .addItem("KPI отчет", "showKPIReport")
    )

    // ====================================================
    // DATA
    // ====================================================

    .addSeparator()
    .addSubMenu(
      ui.createMenu("🛠 Обслуживание")
        .addItem("Repair Database", "repairDatabase")
        .addItem("Очистить Cache", "clearERPCache")
        .addItem("Проверить дубли", "runDuplicateCheck")
    )

    .addSeparator()
    .addItem("📦 Версия ERP", "showERPVersion")

    .addToUi();

  Logger.log("ERP MENU CREATED v1.2.0");
}

// ============================================================
// MENU COMMANDS
// ============================================================

function erpStart() {
  return startERP();
}

function testCoreInfrastructure() {
  if (typeof CoreInfrastructureTest === "undefined") {
    throw new Error("CoreInfrastructureTest unavailable");
  }
  const result = CoreInfrastructureTest.run();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function testEntityLifecycleMatrix() {
  if (typeof TestEntityLifecycleMatrix === "undefined") {
    throw new Error("TestEntityLifecycleMatrix unavailable");
  }
  const result = TestEntityLifecycleMatrix.run();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function showERPVersion() {
  const info = {
    ERP: "TaxControl",
    SystemInit: SystemInit?.version,
    EntityService: EntityService?.version,
    Database: Database?.version,
    RepositoryFactory: RepositoryFactory?.version,
    TestRunner: TestRunner?.version,
  };
  Logger.log(JSON.stringify(info, null, 2));
  SpreadsheetApp.getUi().alert(
    "TaxControl ERP\n\n" + JSON.stringify(info, null, 2)
  );
}

function clearERPCache() {
  if (typeof Database !== "undefined" && Database.clearCache) {
    Database.clearCache();
  }
  SpreadsheetApp.getUi().alert("ERP Cache очищен");
}

// ============================================================
// TEST DASHBOARD COMMANDS
// ============================================================

function runTestsDashboard() {
  try {
    if (typeof ERPTestDashboard === "undefined") {
      throw new Error("ERPTestDashboard не найден. Проверьте загрузку модуля тестирования.");
    }

    const result = ERPTestDashboard.run({ safe: true });

    // Логируем результат
    Logger.log(JSON.stringify(result, null, 2));

    // Показываем уведомление
    const message =
      "Тесты завершены\n\n" +
      "✅ PASS: " + (result.summary?.passed || 0) + "\n" +
      "❌ FAIL: " + (result.summary?.failed || 0) + "\n" +
      "📊 Всего: " + (result.summary?.total || 0);

    SpreadsheetApp.getUi().alert(message);

    // Если есть отчёт, открываем его
    if (result.reportSheet) {
      openTestDashboard();
    }

    return result;
  } catch (e) {
    Logger.error("runTestsDashboard failed: " + e.message);
    SpreadsheetApp.getUi().alert("Ошибка: " + e.message);
    throw e;
  }
}

function openTestDashboard() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("ERP_TEST_DASHBOARD");

    if (!sheet) {
      // Если листа нет, создаём его с базовой структурой
      sheet = ss.insertSheet("ERP_TEST_DASHBOARD");
      sheet.getRange(1, 1, 1, 4).setValues([["Тест", "Статус", "Время", "Сообщение"]]);
      sheet.setFrozenRows(1);
      SpreadsheetApp.getUi().alert("Создан новый лист ERP_TEST_DASHBOARD");
    }

    ss.setActiveSheet(sheet);
  } catch (e) {
    Logger.error("openTestDashboard failed: " + e.message);
    SpreadsheetApp.getUi().alert("Не удалось открыть Dashboard: " + e.message);
  }
}

// ============================================================
// ЛОГИРОВАНИЕ ЗАГРУЗКИ МЕНЮ
// ============================================================

Logger.log("ERP MENU v1.2.0 READY");