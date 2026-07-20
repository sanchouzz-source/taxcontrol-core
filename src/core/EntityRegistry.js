console.log("EntityRegistry");

const EntityRegistry = {
  version: "2.1.0",
  ready: false,

  aliases: {
    ClientFinanceProfiles: "CLIENT_FINANCE_PROFILE",
    FinancialTransactions: "FINANCIAL_TRANSACTION",
    AuditLogs: "AUDIT",
    Versions: "VERSION",
    TransportOrders: "TRANSPORT_ORDER",   // добавлено для удобства
    Carriers: "CARRIER",
    Drivers: "DRIVER",
    Vehicles: "VEHICLE",
    Routes: "ROUTE",
    Cargoes: "CARGO"
  },

  // ----- СУЩЕСТВУЮЩИЕ СУЩНОСТИ -----
  CLIENT: {
    entity: "CLIENT",
    module: "core",
    table: "Clients",
    idField: "ClientID",
    idPrefix: "CLI",
    repository: "ClientRepository",
    audit: true,
    softDelete: true,
    timestamps: true,
    events: {
      created: "CLIENT_CREATED",
      updated: "CLIENT_UPDATED",
      deleted: "CLIENT_DELETED",
      restored: "CLIENT_RESTORED"
    }
  },

  TRIP: {
    entity: "TRIP",
    module: "core",
    table: "Trips",
    idField: "TripID",
    idPrefix: "TRP",
    repository: "TripRepository",
    audit: true,
    softDelete: true,
    timestamps: true,
    events: {
      created: "TRIP_CREATED",
      updated: "TRIP_UPDATED",
      deleted: "TRIP_DELETED",
      restored: "TRIP_RESTORED"
    }
  },

  CLIENT_FINANCE_PROFILE: {
    entity: "CLIENT_FINANCE_PROFILE",
    module: "finance",
    table: "ClientFinanceProfiles",
    idField: "FinanceProfileID",
    idPrefix: "FP",
    repository: "ClientFinanceProfileRepository",
    audit: true,
    softDelete: true,
    timestamps: true,
    events: {
      created: "CLIENT_FINANCE_PROFILE_CREATED",
      updated: "CLIENT_FINANCE_PROFILE_UPDATED",
      deleted: "CLIENT_FINANCE_PROFILE_DELETED",
      restored: "CLIENT_FINANCE_PROFILE_RESTORED"
    }
  },

  FINANCIAL_TRANSACTION: {
    entity: "FINANCIAL_TRANSACTION",
    module: "finance",
    table: "FinancialTransactions",
    idField: "TransactionID",
    idPrefix: "FIN",
    repository: "FinancialTransactionRepository",
    audit: true,
    softDelete: false, // финансовые транзакции обычно не удаляются мягко
    timestamps: true,
    events: {
      created: "FINANCIAL_TRANSACTION_CREATED",
      updated: "FINANCIAL_TRANSACTION_UPDATED",
      deleted: "FINANCIAL_TRANSACTION_DELETED"
    }
  },

  AUDIT: {
    entity: "AUDIT",
    module: "core",
    table: "AuditLog",
    idField: "AuditID",
    idPrefix: "AUD",
    repository: "AuditRepository",
    audit: false,
    softDelete: false,
    timestamps: true,
    events: {}
  },

  VERSION: {
    entity: "VERSION",
    module: "core",
    table: "Versions",
    idField: "VersionID",
    idPrefix: "VER",
    repository: "VersionRepository",
    audit: true,
    softDelete: false,
    timestamps: true,
    events: {}
  },

  KPI: {
    entity: "KPI",
    module: "analytics",
    table: "KPIMetrics",
    idField: "KPIID",
    idPrefix: "KPI",
    repository: "KPIRepository",
    audit: true,
    softDelete: true,
    timestamps: true,
    events: {
      created: "KPI_CREATED",
      updated: "KPI_UPDATED"
      // удаление и восстановление KPI не предусмотрены
    }
  },

  // ----- НОВЫЕ ЛОГИСТИЧЕСКИЕ СУЩНОСТИ -----
  TRANSPORT_ORDER: {
    entity: "TRANSPORT_ORDER",
    module: "logistics",
    table: "TransportOrders",
    idField: "TransportOrderID",
    idPrefix: "TO",
    repository: "TransportOrderRepository",
    audit: true,
    softDelete: true,
    timestamps: true,
    events: {
      created: "TRANSPORT_ORDER_CREATED",
      updated: "TRANSPORT_ORDER_UPDATED",
      deleted: "TRANSPORT_ORDER_DELETED",
      restored: "TRANSPORT_ORDER_RESTORED"
    }
  },

  CARRIER: {
    entity: "CARRIER",
    module: "logistics",
    table: "Carriers",
    idField: "CarrierID",
    idPrefix: "CAR",
    repository: "CarrierRepository",
    audit: true,
    softDelete: true,
    timestamps: true,
    events: {
      created: "CARRIER_CREATED",
      updated: "CARRIER_UPDATED",
      deleted: "CARRIER_DELETED",
      restored: "CARRIER_RESTORED"
    }
  },

  DRIVER: {
    entity: "DRIVER",
    module: "logistics",
    table: "Drivers",
    idField: "DriverID",
    idPrefix: "DRV",
    repository: "DriverRepository",
    audit: true,
    softDelete: true,
    timestamps: true,
    events: {
      created: "DRIVER_CREATED",
      updated: "DRIVER_UPDATED",
      deleted: "DRIVER_DELETED",
      restored: "DRIVER_RESTORED"
    }
  },

  VEHICLE: {
    entity: "VEHICLE",
    module: "logistics",
    table: "Vehicles",
    idField: "VehicleID",
    idPrefix: "VEH",
    repository: "VehicleRepository",
    audit: true,
    softDelete: true,
    timestamps: true,
    events: {
      created: "VEHICLE_CREATED",
      updated: "VEHICLE_UPDATED",
      deleted: "VEHICLE_DELETED",
      restored: "VEHICLE_RESTORED"
    }
  },

  ROUTE: {
    entity: "ROUTE",
    module: "logistics",
    table: "Routes",
    idField: "RouteID",
    idPrefix: "RTE",
    repository: "RouteRepository",
    audit: true,
    softDelete: true,
    timestamps: true,
    events: {
      created: "ROUTE_CREATED",
      updated: "ROUTE_UPDATED",
      deleted: "ROUTE_DELETED",
      restored: "ROUTE_RESTORED"
    }
  },

  CARGO: {
    entity: "CARGO",
    module: "logistics",
    table: "Cargoes",
    idField: "CargoID",
    idPrefix: "CRG",
    repository: "CargoRepository",
    audit: true,
    softDelete: true,
    timestamps: true,
    events: {
      created: "CARGO_CREATED",
      updated: "CARGO_UPDATED",
      deleted: "CARGO_DELETED",
      restored: "CARGO_RESTORED"
    }
  }
};

/*
==============================
API
==============================
*/

EntityRegistry.resolve = function (entity) {
  // Сначала проверяем алиасы (чтобы "TransportOrders" -> "TRANSPORT_ORDER")
  if (this.aliases[entity]) {
    return this.aliases[entity];
  }
  if (this.has(entity)) {
    return entity;
  }
  throw new Error("Unknown entity: " + entity);
};

EntityRegistry.get = function (entity) {
  entity = this.resolve(entity);
  const meta = this[entity];
  if (!meta) {
    throw new Error("Entity metadata missing: " + entity);
  }
  return meta;
};

EntityRegistry.has = function (entity) {
  return !!(this[entity] && this[entity].entity);
};

EntityRegistry.list = function () {
  return Object.keys(this).filter(key => {
    const item = this[key];
    return (item && typeof item === "object" && item.entity);
  });
};

EntityRegistry.getRepository = function (entity) {
  return this.get(entity).repository;
};

EntityRegistry.getTable = function (entity) {
  return this.get(entity).table;
};

EntityRegistry.getIdPrefix = function (entity) {
  return this.get(entity).idPrefix;
};

EntityRegistry.health = function () {
  return HealthContract.create(
    "EntityRegistry",
    this.ready ? "OK" : "WARNING",
    {
      version: this.version,
      entities: this.list(),
      count: this.list().length
    }
  );
};

EntityRegistry.ready = true;
globalThis.EntityRegistry = EntityRegistry;

Logger.log("EntityRegistry READY v" + EntityRegistry.version);