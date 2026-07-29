// ============================================================
// TrustedEntryPoints v1.0.0
// Managed request boundary for Google Sheets menu callbacks
//
// The startup runtime is created first. The current Google account is then
// resolved through TrustedUserResolver, and the complete handler runs inside
// one execution-local SecurityContext. No role or organization is accepted
// from an event object, query string, request body, or client-side call.
// ============================================================

console.log("TrustedEntryPoints v1.0.0");

const TrustedEntryPoints = {
  version: "1.0.0",
  initialized: false,

  menuActions: {
    START_ERP: {
      handler: "startERP",
    },
    ERP_HEALTH: {
      handler: "erpHealth",
    },
    ERP_DIAGNOSTICS: {
      handler: "erpDiag",
      permission: "SYSTEM_ADMIN",
    },
    ERP_VERSION: {
      handler: "showERPVersion",
    },
    CONTROL_CENTER: {
      handler: "erpControlCenter",
      permission: "SYSTEM_ADMIN",
    },
    CONTROL_STATUS: {
      handler: "erpControlStatus",
      permission: "SYSTEM_ADMIN",
    },
    RUNTIME_REPORT: {
      handler: "erpRuntimeReport",
      permission: "SYSTEM_ADMIN",
    },
    CONTROL_DASHBOARD: {
      handler:
        "openERPControlDashboard",
      permission: "SYSTEM_ADMIN",
    },
    CONTROL_DASHBOARD_REFRESH: {
      handler:
        "refreshERPControlDashboard",
      permission: "SYSTEM_ADMIN",
    },
    REPOSITORY_HEALTH: {
      handler: "repositoryHealth",
      permission: "SYSTEM_ADMIN",
    },
    REPOSITORY_DETAILS: {
      handler:
        "repositoryHealthDetails",
      permission: "SYSTEM_ADMIN",
    },
    REPOSITORY_REPORT: {
      handler: "repositoryPrint",
      permission: "SYSTEM_ADMIN",
    },
    SERVICE_HEALTH: {
      handler: "serviceHealth",
      permission: "SYSTEM_ADMIN",
    },
    SERVICE_REGISTRY: {
      handler:
        "serviceRegistryReport",
      permission: "SYSTEM_ADMIN",
    },
    SERVICE_REFRESH: {
      handler: "refreshServices",
      permission: "SYSTEM_ADMIN",
    },
    TEST_SAFE: {
      handler: "runTests",
      permission: "SYSTEM_ADMIN",
    },
    TEST_FULL: {
      handler: "runTestsFull",
      permission: "SYSTEM_ADMIN",
    },
    TEST_CORE: {
      handler:
        "testCoreInfrastructure",
      permission: "SYSTEM_ADMIN",
    },
    TEST_ENTITY_LIFECYCLE: {
      handler:
        "testEntityLifecycleMatrix",
      permission: "SYSTEM_ADMIN",
    },
    TEST_SYSTEM_INIT: {
      handler:
        "runSystemInitContractTest",
      permission: "SYSTEM_ADMIN",
    },
    TEST_SERVICE_REGISTRY: {
      handler:
        "runServiceRegistryContractTest",
      permission: "SYSTEM_ADMIN",
    },
    TEST_REPORT: {
      handler: "testReport",
      permission: "SYSTEM_ADMIN",
    },
    CLIENT_CREATE: {
      handler: "createClientUI",
      permission: "CLIENT_CREATE",
    },
    CLIENT_REFRESH: {
      handler: "refreshClients",
      permission: "CLIENT_READ",
    },
    DASHBOARD_REFRESH: {
      handler: "refreshDashboard",
      permission: "REPORT_VIEW",
    },
    KPI_REPORT: {
      handler: "showKPIReport",
      permission: "REPORT_VIEW",
    },
    DATABASE_REPAIR: {
      handler: "repairDatabase",
      permission: "SYSTEM_ADMIN",
    },
    CACHE_CLEAR: {
      handler: "clearERPCache",
      permission: "SYSTEM_ADMIN",
    },
    DUPLICATE_CHECK: {
      handler: "runDuplicateCheck",
      permission: "CLIENT_READ",
    },
    ERP_RESET: {
      handler: "resetERP",
      permission: "SYSTEM_ADMIN",
    },
  },

  init() {
    if (this.initialized) {
      return true;
    }

    [
      "TrustedUserResolver",
      "SecurityContext",
      "SecurityGuard",
    ].forEach((name) => {
      if (!globalThis[name]) {
        throw new Error(
          "TrustedEntryPoints requires " +
            name
        );
      }
    });

    this.initialized = true;
    return true;
  },

  _assertSync(result, label) {
    if (
      result &&
      typeof result.then === "function"
    ) {
      throw new Error(
        label +
          " must be synchronous in Google Apps Script"
      );
    }

    return result;
  },

  _ensureStarted() {
    const bootstrap =
      globalThis.Bootstrap;

    if (
      bootstrap &&
      typeof bootstrap
        .ensureStarted === "function"
    ) {
      return this._assertSync(
        bootstrap.ensureStarted(),
        "Bootstrap.ensureStarted"
      );
    }

    if (
      typeof globalThis.startERP ===
        "function"
    ) {
      return this._assertSync(
        globalThis.startERP(),
        "startERP"
      );
    }

    throw new Error(
      "ERP startup entry point unavailable"
    );
  },

  _requirePermissions(
    permissions
  ) {
    const required =
      Array.isArray(permissions)
        ? permissions
        : permissions
          ? [permissions]
          : [];

    required.forEach((permission) => {
      SecurityGuard.require(
        permission
      );
    });

    return true;
  },

  run(options, callback) {
    let config = options;
    let handler = callback;

    if (typeof options === "function") {
      handler = options;
      config = {};
    }

    if (typeof handler !== "function") {
      throw new Error(
        "TrustedEntryPoints.run requires callback"
      );
    }

    if (!this.initialized) {
      this.init();
    }

    config = config || {};
    this._ensureStarted();

    const profile =
      TrustedUserResolver.resolve({
        organizationId:
          config.organizationId,
      });

    return SecurityContext.runAs(
      profile,
      () => {
        this._requirePermissions(
          config.permission ||
          config.permissions
        );

        return this._assertSync(
          handler(
            SecurityContext.get()
          ),
          config.label ||
            "Trusted request"
        );
      }
    );
  },

  _invoke(action) {
    const handler =
      globalThis[action.handler];

    if (typeof handler !== "function") {
      throw new Error(
        "Menu handler unavailable: " +
          action.handler
      );
    }

    return handler();
  },

  runMenu(actionName) {
    const key =
      String(actionName || "")
        .trim()
        .toUpperCase();
    const action =
      this.menuActions[key];

    if (!action) {
      throw new Error(
        "Unknown trusted menu action " +
          key
      );
    }

    try {
      return this.run(
        {
          permission:
            action.permission,
          label:
            "Menu " + key,
        },
        () => this._invoke(action)
      );
    } catch (error) {
      this.showError(error);
      throw error;
    }
  },

  identityStatus() {
    if (!this.initialized) {
      this.init();
    }

    this._ensureStarted();
    return TrustedUserResolver
      .inspect();
  },

  showIdentityStatus() {
    try {
      const report =
        this.identityStatus();

      this.showMessage(
        "Проверка пользователя",
        JSON.stringify(
          report,
          null,
          2
        )
      );

      return report;
    } catch (error) {
      this.showError(error);
      throw error;
    }
  },

  selectOrganization(
    organizationId
  ) {
    if (!this.initialized) {
      this.init();
    }

    this._ensureStarted();

    if (organizationId) {
      return TrustedUserResolver
        .setPreferredOrganization(
          organizationId
        );
    }

    const report =
      TrustedUserResolver.inspect();
    const memberships =
      report.memberships || [];

    if (!memberships.length) {
      throw new Error(
        "Нет доступных организаций"
      );
    }

    if (memberships.length === 1) {
      return TrustedUserResolver
        .setPreferredOrganization(
          memberships[0]
            .OrganizationID
        );
    }

    if (
      typeof SpreadsheetApp ===
        "undefined" ||
      typeof SpreadsheetApp
        .getUi !== "function"
    ) {
      throw new Error(
        "Organization selection UI unavailable"
      );
    }

    const ui =
      SpreadsheetApp.getUi();
    const choices =
      memberships
        .map(
          (membership) =>
            membership
              .OrganizationID +
            " — " +
            membership
              .OrganizationName +
            " (" +
            membership.Role +
            ")"
        )
        .join("\n");
    const response = ui.prompt(
      "Выбор организации",
      "Введите OrganizationID:\n\n" +
        choices,
      ui.ButtonSet.OK_CANCEL
    );

    if (
      response.getSelectedButton() !==
      ui.Button.OK
    ) {
      return {
        status: "CANCELLED",
      };
    }

    const profile =
      TrustedUserResolver
        .setPreferredOrganization(
          response.getResponseText()
        );

    this.showMessage(
      "Организация выбрана",
      profile.OrganizationID
    );

    return profile;
  },

  showMessage(title, message) {
    if (
      typeof SpreadsheetApp !==
        "undefined" &&
      typeof SpreadsheetApp
        .getUi === "function"
    ) {
      SpreadsheetApp.getUi().alert(
        title +
          "\n\n" +
          String(message || "")
      );
    }

    return true;
  },

  showError(error) {
    const message =
      error && error.message
        ? error.message
        : String(error);

    if (
      typeof Logger !== "undefined" &&
      typeof Logger.error ===
        "function"
    ) {
      Logger.error(
        "TRUSTED ENTRY ERROR " +
          message
      );
    }

    this.showMessage(
      "Доступ отклонён",
      message
    );

    return false;
  },

  reset() {
    this.initialized = false;
    return true;
  },

  health() {
    return {
      module:
        "TrustedEntryPoints",
      version: this.version,
      status:
        this.initialized
          ? "OK"
          : "WARNING",
      initialized:
        this.initialized,
      menuActions:
        Object.keys(
          this.menuActions
        ).length,
      webApiEnabled: false,
    };
  },
};

function runTrustedIdentityStatus() {
  return TrustedEntryPoints
    .showIdentityStatus();
}

function selectERPOrganization(
  organizationId
) {
  return TrustedEntryPoints
    .selectOrganization(
      organizationId
    );
}

globalThis.TrustedEntryPoints =
  TrustedEntryPoints;

