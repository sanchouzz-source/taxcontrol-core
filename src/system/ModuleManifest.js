// ============================================================
// ModuleManifest v1.1 – Реестр всех модулей ERP TexControl
// ============================================================
console.log("ModuleManifest v1.1");

const ERP_MODULE_MANIFEST = {
  TransportOrderModule: {
    moduleDefinition: {
      name: "TransportOrderModule",
      version: "1.0.0",
      description: "Управление транспортными заказами",
      owner: "LOGISTICS",
      phase: "DOMAIN",
      priority: 90,
      dependencies: ["Database", "EventBus", "EntityRegistry"],
      api: {
        entities: ["TRANSPORT_ORDER"],
        events: ["TRANSPORT_ORDER_CREATED", "TRANSPORT_ORDER_UPDATED", "TRANSPORT_ORDER_DELETED", "TRANSPORT_ORDER_RESTORED"],
        services: []
      },
      permissions: [
        "TRANSPORT_ORDER_CREATE",
        "TRANSPORT_ORDER_UPDATE",
        "TRANSPORT_ORDER_DELETE",
        "TRANSPORT_ORDER_READ"
      ],
      register: function(context) {
        if (typeof TransportOrderModule !== "undefined" && TransportOrderModule.register) {
          TransportOrderModule.register(context);
        }
      },
      init: function(context) {
        if (typeof TransportOrderModule !== "undefined" && TransportOrderModule.init) {
          TransportOrderModule.init(context);
        }
      },
      start: function(context) {
        if (typeof TransportOrderModule !== "undefined" && TransportOrderModule.start) {
          TransportOrderModule.start(context);
        }
      },
      health: function() {
        if (typeof TransportOrderModule !== "undefined" && TransportOrderModule.health) {
          return TransportOrderModule.health();
        }
        return { status: "OK" };
      }
    }
  },

  TripModule: {
    moduleDefinition: {
      name: "TripModule",
      version: "1.0.0",
      description: "Управление рейсами и поездками",
      owner: "LOGISTICS",
      phase: "DOMAIN",
      priority: 85,
      dependencies: ["Database", "EventBus", "EntityRegistry"],
      api: {
        entities: ["TRIP"],
        events: ["TRIP_CREATED", "TRIP_COMPLETED", "TRIP_ASSIGNED", "TRIP_STARTED", "TRIP_DELAYED"],
        services: []
      },
      permissions: [
        "TRIP_CREATE",
        "TRIP_UPDATE",
        "TRIP_DELETE",
        "TRIP_READ"
      ],
      register: function(context) {
        if (typeof TripModule !== "undefined" && TripModule.register) TripModule.register(context);
      },
      init: function(context) {
        if (typeof TripModule !== "undefined" && TripModule.init) TripModule.init(context);
      },
      start: function(context) {
        if (typeof TripModule !== "undefined" && TripModule.start) TripModule.start(context);
      },
      health: function() {
        if (typeof TripModule !== "undefined" && TripModule.health) return TripModule.health();
        return { status: "OK" };
      }
    }
  },

  CRMSubscriptions: {
    moduleDefinition: {
      name: "CRMSubscriptions",
      version: "1.0.0",
      description: "Подписки на события CRM",
      owner: "CRM",
      phase: "APPLICATION",
      priority: 80,
      dependencies: ["EventBus"],
      api: {
        entities: ["CLIENT"],
        events: ["CLIENT_CREATED"],
        services: []
      },
      permissions: [],
      register: function(context) {
        if (typeof CRMSubscriptions !== "undefined" && CRMSubscriptions.register) CRMSubscriptions.register(context);
      },
      init: function(context) {
        if (typeof CRMSubscriptions !== "undefined" && CRMSubscriptions.init) CRMSubscriptions.init(context);
      },
      health: function() {
        if (typeof CRMSubscriptions !== "undefined" && CRMSubscriptions.health) return CRMSubscriptions.health();
        return { status: "OK" };
      }
    }
  },

  KPISubscriptions: {
    moduleDefinition: {
      name: "KPISubscriptions",
      version: "1.2.0",
      description: "Адаптер событий для обновления KPI",
      owner: "ANALYTICS",
      phase: "APPLICATION",
      priority: 70,
      dependencies: ["EventBus"],
      api: {
        entities: [],
        events: ["TRIP_COMPLETED", "FINANCIAL_TRANSACTION_CREATED"],
        services: []
      },
      permissions: [],
      register: function(context) {
        if (typeof KPISubscriptions !== "undefined" && KPISubscriptions.register) KPISubscriptions.register(context);
      },
      init: function(context) {
        if (typeof KPISubscriptions !== "undefined" && KPISubscriptions.init) KPISubscriptions.init(context);
      },
      health: function() {
        if (typeof KPISubscriptions !== "undefined" && KPISubscriptions.health) return KPISubscriptions.health();
        return { status: "OK" };
      }
    }
  },

  NotificationSubscriptions: {
    moduleDefinition: {
      name: "NotificationSubscriptions",
      version: "1.3.0",
      description: "Подписки для отправки уведомлений",
      owner: "COMMUNICATION",
      phase: "APPLICATION",
      priority: 60,
      dependencies: ["EventBus"],
      api: {
        entities: [],
        events: ["TRANSPORT_ORDER_CREATED", "TRANSPORT_ORDER_UPDATED", "TRIP_COMPLETED", "PAYMENT_RECEIVED", "CLIENT_CREATED"],
        services: []
      },
      permissions: [],
      register: function(context) {
        if (typeof NotificationSubscriptions !== "undefined" && NotificationSubscriptions.register) NotificationSubscriptions.register(context);
      },
      init: function(context) {
        if (typeof NotificationSubscriptions !== "undefined" && NotificationSubscriptions.init) NotificationSubscriptions.init(context);
      },
      health: function() {
        if (typeof NotificationSubscriptions !== "undefined" && NotificationSubscriptions.health) return NotificationSubscriptions.health();
        return { status: "OK" };
      }
    }
  },

  FinanceEngine: {
    moduleDefinition: {
      name: "FinanceEngine",
      version: "1.0.1",
      description: "Финансовый движок, обработка платежей и расходов",
      owner: "FINANCE",
      phase: "SERVICES",
      priority: 50,
      dependencies: ["Database", "EventBus"],
      api: {
        entities: ["FINANCIAL_TRANSACTION"],
        events: ["PAYMENT_RECEIVED", "EXPENSE_CREATED"],
        services: ["Finance"]
      },
      permissions: [
        "FINANCE_READ",
        "FINANCE_CREATE",
        "FINANCE_UPDATE",
        "FINANCE_DELETE"
      ],
      register: function(context) {
        if (typeof FinanceEngine !== "undefined" && FinanceEngine.register) FinanceEngine.register(context);
      },
      init: function(context) {
        if (typeof FinanceEngine !== "undefined" && FinanceEngine.init) FinanceEngine.init(context);
      },
      start: function(context) {
        if (typeof FinanceEngine !== "undefined" && FinanceEngine.start) FinanceEngine.start(context);
      },
      health: function() {
        if (typeof FinanceEngine !== "undefined" && FinanceEngine.health) return FinanceEngine.health();
        return { status: "OK" };
      }
    }
  },

  KPIEngine: {
    moduleDefinition: {
      name: "KPIEngine",
      version: "1.0.0",
      description: "Движок расчёта ключевых показателей",
      owner: "ANALYTICS",
      phase: "SERVICES",
      priority: 40,
      dependencies: ["Database"],
      api: {
        entities: ["KPI"],
        events: [],
        services: ["KPI"]
      },
      permissions: [
        "KPI_READ",
        "KPI_WRITE"
      ],
      register: function(context) {
        if (typeof KPIEngine !== "undefined" && KPIEngine.register) KPIEngine.register(context);
      },
      init: function(context) {
        if (typeof KPIEngine !== "undefined" && KPIEngine.init) KPIEngine.init(context);
      },
      health: function() {
        if (typeof KPIEngine !== "undefined" && KPIEngine.health) return KPIEngine.health();
        return { status: "OK" };
      }
    }
  },

  DashboardEngine: {
    moduleDefinition: {
      name: "DashboardEngine",
      version: "1.0.0",
      description: "Движок дашбордов и отчётов",
      owner: "REPORTING",
      phase: "REPORTING",
      priority: 30,
      dependencies: ["Database", "EventBus"],
      api: {
        entities: [],
        events: [],
        services: ["Dashboard"]
      },
      permissions: [
        "DASHBOARD_READ"
      ],
      register: function(context) {
        if (typeof DashboardEngine !== "undefined" && DashboardEngine.register) DashboardEngine.register(context);
      },
      init: function(context) {
        if (typeof DashboardEngine !== "undefined" && DashboardEngine.init) DashboardEngine.init(context);
      },
      health: function() {
        if (typeof DashboardEngine !== "undefined" && DashboardEngine.health) return DashboardEngine.health();
        return { status: "OK" };
      }
    }
  }
};

globalThis.ERP_MODULE_MANIFEST = ERP_MODULE_MANIFEST;
Logger.log("ModuleManifest LOADED v1.1");