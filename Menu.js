// ============================================================
// Menu v2.0.0
// TaxControl ERP UI Menu
//
// Every business callback goes through TrustedEntryPoints. onOpen() only
// creates the menu and never manufactures an authenticated user.
// ============================================================

console.log("Menu v2.0.0");

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
    .addItem("▶ Запустить ERP", "menuStartERP")
    .addItem("❤️ Проверка системы", "menuERPHealth")
    .addItem("🔍 Диагностика ERP", "menuERPDiagnostics")
    .addItem("📦 Версия ERP", "menuERPVersion")
    .addSeparator();

  menu.addSubMenu(
    ui
      .createMenu("🧠 ERP Control Center")
      .addItem(
        "🚀 Полная диагностика",
        "menuERPControlCenter"
      )
      .addItem("📋 Статус ERP", "menuERPControlStatus")
      .addItem(
        "🖥 Runtime Report",
        "menuERPRuntimeReport"
      )
      .addItem(
        "📊 ERP Dashboard",
        "menuOpenERPControlDashboard"
      )
      .addItem(
        "🔄 Refresh Dashboard",
        "menuRefreshERPControlDashboard"
      )
  );

  menu.addSubMenu(
    ui
      .createMenu("🗄 Repository")
      .addItem(
        "🏥 Repository Health",
        "menuRepositoryHealth"
      )
      .addItem(
        "📋 Repository Details",
        "menuRepositoryHealthDetails"
      )
      .addItem(
        "🖨 Repository Report",
        "menuRepositoryPrint"
      )
  );

  menu.addSubMenu(
    ui
      .createMenu("🧩 Services")
      .addItem("🏥 Service Health", "menuServiceHealth")
      .addItem(
        "📋 Service Registry",
        "menuServiceRegistryReport"
      )
      .addItem(
        "🔄 Refresh Services",
        "menuRefreshServices"
      )
  );

  menu.addSubMenu(
    ui
      .createMenu("🧪 Тестирование")
      .addItem("▶ SAFE тесты", "menuRunTests")
      .addItem("🔥 FULL тесты", "menuRunTestsFull")
      .addItem(
        "🏗 Core Infrastructure",
        "menuTestCoreInfrastructure"
      )
      .addItem(
        "🔄 Entity Lifecycle",
        "menuTestEntityLifecycleMatrix"
      )
      .addItem(
        "🚀 System Init Contract",
        "menuRunSystemInitContractTest"
      )
      .addItem(
        "🧩 Service Registry Contract",
        "menuRunServiceRegistryContractTest"
      )
      .addItem(
        "🔒 External HTTP Contract",
        "menuRunExternalHttpContractTest"
      )
      .addItem("📋 Test Report", "menuTestReport")
  );

  menu.addSubMenu(
    ui
      .createMenu("👥 Клиенты")
      .addItem("Добавить клиента", "menuCreateClient")
      .addItem("Обновить клиентов", "menuRefreshClients")
  );

  menu.addSubMenu(
    ui
      .createMenu("📊 Dashboard")
      .addItem(
        "Обновить Dashboard",
        "menuRefreshDashboard"
      )
      .addItem("KPI отчет", "menuShowKPIReport")
  );

  menu.addSubMenu(
    ui
      .createMenu("🔐 Доступ и организации")
      .addItem(
        "Проверить пользователя",
        "menuTrustedIdentityStatus"
      )
      .addItem(
        "Выбрать организацию",
        "menuSelectERPOrganization"
      )
      .addItem(
        "Привязать Google для телефона",
        "menuBindCurrentGoogleIdentity"
      )
      .addItem(
        "Аудит Google-привязок",
        "menuExternalIdentityBindingAudit"
      )
      .addSeparator()
      .addItem(
        "Список пользователей",
        "menuShowUserMemberships"
      )
      .addItem(
        "Добавить пользователя",
        "menuCreateUserMembership"
      )
      .addItem(
        "Изменить роль",
        "menuChangeUserMembershipRole"
      )
      .addItem(
        "Отключить пользователя",
        "menuDeactivateUserMembership"
      )
      .addItem(
        "Включить пользователя",
        "menuReactivateUserMembership"
      )
      .addSeparator()
      .addItem(
        "Аудит OrganizationID",
        "menuOrganizationScopeAudit"
      )
      .addItem(
        "Подготовить план миграции",
        "menuPrepareOrganizationScopeMigration"
      )
      .addItem(
        "Проверить план миграции",
        "menuValidateOrganizationScopeMigration"
      )
  );

  menu.addSubMenu(
    ui
      .createMenu("🛠 Обслуживание")
      .addItem("Repair Database", "menuRepairDatabase")
      .addItem("Очистить Cache", "menuClearERPCache")
      .addItem(
        "Проверить дубли",
        "menuRunDuplicateCheck"
      )
      .addItem("ERP Reset", "menuResetERP")
  );

  menu.addToUi();
  Logger.log("ERP MENU CREATED v2.0.0");
}

// ============================================================
// TRUSTED MENU CALLBACKS
// ============================================================

function menuStartERP() {
  return TrustedEntryPoints.runMenu("START_ERP");
}

function menuERPHealth() {
  return TrustedEntryPoints.runMenu("ERP_HEALTH");
}

function menuERPDiagnostics() {
  return TrustedEntryPoints.runMenu("ERP_DIAGNOSTICS");
}

function menuERPVersion() {
  return TrustedEntryPoints.runMenu("ERP_VERSION");
}

function menuERPControlCenter() {
  return TrustedEntryPoints.runMenu("CONTROL_CENTER");
}

function menuERPControlStatus() {
  return TrustedEntryPoints.runMenu("CONTROL_STATUS");
}

function menuERPRuntimeReport() {
  return TrustedEntryPoints.runMenu("RUNTIME_REPORT");
}

function menuOpenERPControlDashboard() {
  return TrustedEntryPoints.runMenu("CONTROL_DASHBOARD");
}

function menuRefreshERPControlDashboard() {
  return TrustedEntryPoints.runMenu(
    "CONTROL_DASHBOARD_REFRESH"
  );
}

function menuRepositoryHealth() {
  return TrustedEntryPoints.runMenu("REPOSITORY_HEALTH");
}

function menuRepositoryHealthDetails() {
  return TrustedEntryPoints.runMenu("REPOSITORY_DETAILS");
}

function menuRepositoryPrint() {
  return TrustedEntryPoints.runMenu("REPOSITORY_REPORT");
}

function menuServiceHealth() {
  return TrustedEntryPoints.runMenu("SERVICE_HEALTH");
}

function menuServiceRegistryReport() {
  return TrustedEntryPoints.runMenu("SERVICE_REGISTRY");
}

function menuRefreshServices() {
  return TrustedEntryPoints.runMenu("SERVICE_REFRESH");
}

function menuRunTests() {
  return TrustedEntryPoints.runMenu("TEST_SAFE");
}

function menuRunTestsFull() {
  return TrustedEntryPoints.runMenu("TEST_FULL");
}

function menuTestCoreInfrastructure() {
  return TrustedEntryPoints.runMenu("TEST_CORE");
}

function menuTestEntityLifecycleMatrix() {
  return TrustedEntryPoints.runMenu(
    "TEST_ENTITY_LIFECYCLE"
  );
}

function menuRunSystemInitContractTest() {
  return TrustedEntryPoints.runMenu("TEST_SYSTEM_INIT");
}

function menuRunServiceRegistryContractTest() {
  return TrustedEntryPoints.runMenu(
    "TEST_SERVICE_REGISTRY"
  );
}

function menuRunExternalHttpContractTest() {
  return TrustedEntryPoints.runMenu(
    "TEST_EXTERNAL_HTTP"
  );
}

function menuTestReport() {
  return TrustedEntryPoints.runMenu("TEST_REPORT");
}

function menuCreateClient() {
  return TrustedEntryPoints.runMenu("CLIENT_CREATE");
}

function menuRefreshClients() {
  return TrustedEntryPoints.runMenu("CLIENT_REFRESH");
}

function menuRefreshDashboard() {
  return TrustedEntryPoints.runMenu("DASHBOARD_REFRESH");
}

function menuShowKPIReport() {
  return TrustedEntryPoints.runMenu("KPI_REPORT");
}

function menuRepairDatabase() {
  return TrustedEntryPoints.runMenu("DATABASE_REPAIR");
}

function menuClearERPCache() {
  return TrustedEntryPoints.runMenu("CACHE_CLEAR");
}

function menuRunDuplicateCheck() {
  return TrustedEntryPoints.runMenu("DUPLICATE_CHECK");
}

function menuResetERP() {
  return TrustedEntryPoints.runMenu("ERP_RESET");
}

function menuTrustedIdentityStatus() {
  return TrustedEntryPoints.showIdentityStatus();
}

function menuSelectERPOrganization() {
  return TrustedEntryPoints.selectOrganization();
}

function menuBindCurrentGoogleIdentity() {
  return TrustedEntryPoints.runMenu(
    "EXTERNAL_GOOGLE_BIND"
  );
}

function menuExternalIdentityBindingAudit() {
  return TrustedEntryPoints.runMenu(
    "EXTERNAL_GOOGLE_AUDIT"
  );
}

function menuShowUserMemberships() {
  return TrustedEntryPoints.runMenu(
    "USER_MEMBERSHIP_LIST"
  );
}

function menuCreateUserMembership() {
  return TrustedEntryPoints.runMenu(
    "USER_MEMBERSHIP_CREATE"
  );
}

function menuChangeUserMembershipRole() {
  return TrustedEntryPoints.runMenu(
    "USER_MEMBERSHIP_ROLE"
  );
}

function menuDeactivateUserMembership() {
  return TrustedEntryPoints.runMenu(
    "USER_MEMBERSHIP_DEACTIVATE"
  );
}

function menuReactivateUserMembership() {
  return TrustedEntryPoints.runMenu(
    "USER_MEMBERSHIP_REACTIVATE"
  );
}

function promptMembershipValue_(
  title,
  message
) {
  const ui =
    SpreadsheetApp.getUi();
  const response = ui.prompt(
    title,
    message,
    ui.ButtonSet.OK_CANCEL
  );

  if (
    response.getSelectedButton() !==
      ui.Button.OK
  ) {
    return null;
  }

  return String(
    response.getResponseText() || ""
  ).trim();
}

function bindCurrentGoogleIdentityUI() {
  const credential =
    promptMembershipValue_(
      "Привязка Google-аккаунта",
      "Вставьте краткоживущий Google ID token из тестового мобильного клиента.\n\n" +
        "Токен используется один раз, не сохраняется и не выводится в журнал."
    );

  if (!credential) {
    return {
      status: "CANCELLED",
    };
  }

  const result =
    ExternalIdentityBindingService
      .bindCurrentCredential(
        credential
      );

  TrustedEntryPoints.showMessage(
    "Google-аккаунт привязан",
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}

function showExternalIdentityBindingAudit() {
  const report =
    ExternalUserResolver
      .auditCurrentOrganization();

  TrustedEntryPoints.showMessage(
    "Аудит Google-привязок",
    JSON.stringify(
      report,
      null,
      2
    )
  );

  return report;
}

function showUserMemberships() {
  const rows =
    UserMembershipService
      .listMemberships({
        includeInactive: true,
        includeDeleted: false,
      });

  TrustedEntryPoints.showMessage(
    "Пользователи текущей организации",
    JSON.stringify(
      {
        count: rows.length,
        memberships: rows,
      },
      null,
      2
    )
  );

  return rows;
}

function createUserMembershipUI() {
  const email =
    promptMembershipValue_(
      "Добавление пользователя",
      "Введите email Google-аккаунта"
    );

  if (email === null) {
    return {
      status: "CANCELLED",
    };
  }

  const name =
    promptMembershipValue_(
      "Добавление пользователя",
      "Введите имя пользователя"
    );

  if (name === null) {
    return {
      status: "CANCELLED",
    };
  }

  const role =
    promptMembershipValue_(
      "Добавление пользователя",
      "Введите роль: ADMIN, DIRECTOR, MANAGER, ACCOUNTANT, DISPATCHER, DRIVER или VIEWER"
    );

  if (role === null) {
    return {
      status: "CANCELLED",
    };
  }

  const result =
    UserMembershipService
      .createMembership({
        Email: email,
        Name: name,
        Role: role,
      });

  TrustedEntryPoints.showMessage(
    "Пользователь добавлен",
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}

function changeUserMembershipRoleUI() {
  const userId =
    promptMembershipValue_(
      "Изменение роли",
      "Введите UserID"
    );

  if (userId === null) {
    return {
      status: "CANCELLED",
    };
  }

  const role =
    promptMembershipValue_(
      "Изменение роли",
      "Введите новую роль"
    );

  if (role === null) {
    return {
      status: "CANCELLED",
    };
  }

  const result =
    UserMembershipService
      .changeRole(
        userId,
        role
      );

  TrustedEntryPoints.showMessage(
    "Роль изменена",
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}

function deactivateUserMembershipUI() {
  const userId =
    promptMembershipValue_(
      "Отключение пользователя",
      "Введите UserID"
    );

  if (userId === null) {
    return {
      status: "CANCELLED",
    };
  }

  const ui =
    SpreadsheetApp.getUi();
  const confirmation = ui.alert(
    "Отключение пользователя",
    "Отключить членство " +
      userId +
      "?",
    ui.ButtonSet.YES_NO
  );

  if (
    confirmation !==
      ui.Button.YES
  ) {
    return {
      status: "CANCELLED",
    };
  }

  const result =
    UserMembershipService
      .deactivateMembership(
        userId
      );

  TrustedEntryPoints.showMessage(
    "Пользователь отключён",
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}

function reactivateUserMembershipUI() {
  const userId =
    promptMembershipValue_(
      "Включение пользователя",
      "Введите UserID"
    );

  if (userId === null) {
    return {
      status: "CANCELLED",
    };
  }

  const result =
    UserMembershipService
      .reactivateMembership(
        userId
      );

  TrustedEntryPoints.showMessage(
    "Пользователь включён",
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}

function menuOrganizationScopeAudit() {
  const result =
    runOrganizationScopeAudit();

  TrustedEntryPoints.showMessage(
    "Аудит OrganizationID",
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}

function menuPrepareOrganizationScopeMigration() {
  const result =
    prepareOrganizationScopeMigration();

  TrustedEntryPoints.showMessage(
    "План миграции подготовлен",
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}

function menuValidateOrganizationScopeMigration() {
  const result =
    validateOrganizationScopeMigration();

  TrustedEntryPoints.showMessage(
    "Проверка плана миграции",
    JSON.stringify(
      {
        status: result.status,
        planId: result.planId,
        approved: result.approved,
        assignments:
          result.assignments,
        skipped: result.skipped,
        errors: result.errors,
        warnings: result.warnings,
      },
      null,
      2
    )
  );

  return result;
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
    UserMembershipService:
      componentVersion_(
        "UserMembershipService"
      ),
    UserRepository:
      componentVersion_(
        "UserRepository"
      ),
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

Logger.log("ERP MENU READY v1.9.0");
