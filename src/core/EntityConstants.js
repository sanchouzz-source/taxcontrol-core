console.log("EntityConstants");

const EntityConstants = {
  version: "0.6.0",

  // ----- НОВЫЕ СТРОКОВЫЕ КОНСТАНТЫ СУЩНОСТЕЙ -----
  CLIENT: "CLIENT",
  CLIENT_FINANCE_PROFILE: "CLIENT_FINANCE_PROFILE",
  TRIP: "TRIP",
  KPI: "KPI",
  TRANSPORT_ORDER: "TRANSPORT_ORDER",
  CARRIER: "CARRIER",
  DRIVER: "DRIVER",
  VEHICLE: "VEHICLE",
  ROUTE: "ROUTE",
  CARGO: "CARGO",

  // ----- МЕТАДАННЫЕ СУЩНОСТЕЙ (name, prefix) -----
  entities: {
    ORGANIZATION: {
      name: "Organizations",
      prefix: "ORG"
    },
    CLIENT: {
      name: "Clients",
      prefix: "CLI"
    },
    CLIENT_FINANCE_PROFILE: {
      name: "ClientFinanceProfiles",
      prefix: "CFP"
    },
    TRIP: {
      name: "Trips",
      prefix: "TRP"
    },
    FINANCIAL_TRANSACTION: {
      name: "FinancialTransactions",
      prefix: "FIN"
    },
    KPI: {
      name: "KPIMetrics",
      prefix: "KPI"
    },
    AUDIT: {
      name: "AuditLog",
      prefix: "AUD"
    },
    EVENT: {
      name: "EventLog",
      prefix: "EVT"
    }
  },

  // ----- API -----
  get(key) {
    return this.entities[key] || null;
  },

  getPrefix(key) {
    const entity = this.get(key);
    return entity ? entity.prefix : null;
  },

  getSheet(key) {
    const entity = this.get(key);
    return entity ? entity.name : null;
  },

  list() {
    return Object.keys(this.entities);
  },

  health() {
    return HealthContract.create(
      "EntityConstants",
      "OK",
      {
        version: this.version,
        entities: this.list()
      }
    );
  }
};

globalThis.EntityConstants = EntityConstants;
Logger.log("EntityConstants READY v" + EntityConstants.version);