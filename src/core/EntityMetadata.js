console.log("EntityMetadata");

const EntityMetadata = {
  version: "0.7.0",

  // ----- СУЩЕСТВУЮЩИЕ СУЩНОСТИ (с версиями, relations, indexes, audit) -----

  CLIENT: {
    entity: "CLIENT",
    table: "Clients",
    id: "ClientID",
    idPrefix: "CLIENT",
    version: 1,
    permissions: {
      create: "CLIENT_CREATE",
      read: "CLIENT_READ",
      update: "CLIENT_UPDATE",
      delete: "CLIENT_DELETE",
      restore: "CLIENT_RESTORE"
    },
    events: {
      created: "CLIENT_CREATED",
      updated: "CLIENT_UPDATED",
      deleted: "CLIENT_DELETED",
      restored: "CLIENT_RESTORED"
    },
    fields: [
      { name: "ClientID", type: "ID", required: true },
      { name: "OrganizationID", type: "REFERENCE", required: true },
      { name: "Name", type: "STRING", required: true },
      { name: "INN", type: "STRING", unique: true },
      { name: "Phone", type: "STRING" },
      { name: "Email", type: "STRING", unique: true },
      { name: "Address", type: "STRING" },
      { name: "ManagerID", type: "REFERENCE" },
      { name: "Rating", type: "NUMBER" },
      { name: "Status", type: "ENUM", default: "ACTIVE" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN" }
    ],
    relations: {
      OrganizationID: { entity: "ORGANIZATION", type: "MANY_TO_ONE" },
      ManagerID: { entity: "USER", type: "MANY_TO_ONE" }
    },
    indexes: {
      unique: ["INN", "Email"],
      search: ["Name", "Phone", "Status"]
    },
    audit: {
      enabled: true,
      fields: ["Name", "Phone", "Email", "Status"]
    }
  },

  AUDIT: {
    entity: "AUDIT",
    table: "AuditLog",
    id: "AuditID",
    idPrefix: "AUD",
    version: 1,
    permissions: {
      create: "AUDIT_CREATE",
      read: "AUDIT_READ",
      update: "AUDIT_UPDATE",
      delete: "AUDIT_DELETE",
      restore: "AUDIT_RESTORE"
    },
    events: {
      created: "AUDIT_CREATED",
      updated: "AUDIT_UPDATED",
      deleted: "AUDIT_DELETED",
      restored: "AUDIT_RESTORED"
    },
    fields: [],
    timestamps: true,
    audit: { enabled: false }
  },

  TRIP: {
    entity: "TRIP",
    table: "Trips",
    id: "TripID",
    idPrefix: "TRIP",
    version: 1,
    permissions: {
      create: "TRIP_CREATE",
      read: "TRIP_READ",
      update: "TRIP_UPDATE",
      delete: "TRIP_DELETE",
      restore: "TRIP_RESTORE"
    },
    events: {
      created: "TRIP_CREATED",
      updated: "TRIP_UPDATED",
      deleted: "TRIP_DELETED",
      restored: "TRIP_RESTORED"
    },
    fields: [
      { name: "TripID", type: "ID", required: true },
      { name: "OrganizationID", type: "REFERENCE", required: true },
      { name: "ClientID", type: "REFERENCE", required: true },
      { name: "VehicleID", type: "REFERENCE" },
      { name: "DriverID", type: "REFERENCE" },
      { name: "ManagerID", type: "REFERENCE" },
      { name: "LoadingPoint", type: "STRING" },
      { name: "UnloadingPoint", type: "STRING" },
      { name: "Distance", type: "NUMBER" },
      { name: "Cargo", type: "STRING" },
      { name: "Revenue", type: "MONEY" },
      { name: "PlannedCost", type: "MONEY" },
      { name: "ActualCost", type: "MONEY" },
      { name: "Margin", type: "MONEY", calculated: true },
      { name: "Status", type: "ENUM", default: "NEW" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN" }
    ],
    relations: {
      OrganizationID: { entity: "ORGANIZATION", type: "MANY_TO_ONE" },
      ClientID: { entity: "CLIENT", type: "MANY_TO_ONE" },
      VehicleID: { entity: "VEHICLE", type: "MANY_TO_ONE" },
      DriverID: { entity: "DRIVER", type: "MANY_TO_ONE" },
      ManagerID: { entity: "USER", type: "MANY_TO_ONE" }
    },
    indexes: {
      search: ["ClientID", "DriverID", "Status", "CreatedAt"]
    },
    audit: {
      enabled: true,
      fields: ["Status", "Revenue", "ActualCost", "LoadingPoint", "UnloadingPoint"]
    }
  },

  CLIENT_FINANCE_PROFILE: {
    entity: "CLIENT_FINANCE_PROFILE",
    table: "ClientFinanceProfiles",
    id: "FinanceProfileID",
    idPrefix: "FP",
    version: 1,
    permissions: {
      create: "CLIENT_FINANCE_CREATE",
      read: "CLIENT_FINANCE_READ",
      update: "CLIENT_FINANCE_UPDATE",
      delete: "CLIENT_FINANCE_DELETE",
      restore: "CLIENT_FINANCE_RESTORE"
    },
    events: {
      created: "CLIENT_FINANCE_PROFILE_CREATED",
      updated: "CLIENT_FINANCE_PROFILE_UPDATED",
      deleted: "CLIENT_FINANCE_PROFILE_DELETED",
      restored: "CLIENT_FINANCE_PROFILE_RESTORED"
    },
    fields: [
      { name: "FinanceProfileID", type: "ID", required: true },
      { name: "OrganizationID", type: "REFERENCE", required: true },
      { name: "ClientID", type: "REFERENCE", required: true },
      { name: "Balance", type: "MONEY", default: 0 },
      { name: "CreditLimit", type: "MONEY", default: 0 },
      { name: "Status", type: "ENUM", default: "ACTIVE" },
      { name: "CreatedAt", type: "DATETIME" }
    ],
    relations: {
      OrganizationID: { entity: "ORGANIZATION", type: "MANY_TO_ONE" },
      ClientID: { entity: "CLIENT", type: "MANY_TO_ONE" }
    },
    indexes: {
      search: ["ClientID", "Status"]
    },
    audit: {
      enabled: true,
      fields: ["Balance", "CreditLimit", "Status"]
    }
  },

  KPI: {
    entity: "KPI",
    table: "KPIMetrics",
    id: "KPIID",
    idPrefix: "KPI",
    version: 1,
    permissions: {
      create: "KPI_CREATE",
      read: "KPI_READ",
      update: "KPI_UPDATE",
      delete: "KPI_DELETE",
      restore: "KPI_RESTORE"
    },
    events: {
      created: "KPI_CREATED",
      updated: "KPI_UPDATED",
      deleted: "KPI_DELETED",
      restored: "KPI_RESTORED"
    },
    fields: [
      { name: "KPIID", type: "ID", required: true },
      { name: "OrganizationID", type: "REFERENCE", required: true },
      { name: "MetricType", type: "STRING", required: true },
      { name: "Entity", type: "STRING" },
      { name: "EntityID", type: "REFERENCE" },
      { name: "Period", type: "STRING" },
      { name: "Revenue", type: "MONEY" },
      { name: "Cost", type: "MONEY" },
      { name: "Profit", type: "MONEY" },
      { name: "Margin", type: "NUMBER" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN" }
    ],
    relations: {
      OrganizationID: { entity: "ORGANIZATION", type: "MANY_TO_ONE" },
      EntityID: { entity: "ENTITY", type: "MANY_TO_ONE" }
    },
    indexes: {
      search: ["MetricType", "Period", "EntityID"]
    },
    audit: {
      enabled: true,
      fields: ["MetricType", "Revenue", "Cost", "Profit", "Margin"]
    }
  },

  // ============================================================
  // НОВЫЕ СУЩНОСТИ (исправлены дубли и добавлены relations, indexes, audit)
  // ============================================================

  // 1. TRANSPORT_ORDER
  TRANSPORT_ORDER: {
    entity: "TRANSPORT_ORDER",
    repository: "TransportOrderRepository",
    table: "TransportOrders",
    id: "TransportOrderID",
    idPrefix: "TO",
    version: 1,
    permissions: {
      create: "TRANSPORT_ORDER_CREATE",
      read: "TRANSPORT_ORDER_READ",
      update: "TRANSPORT_ORDER_UPDATE",
      delete: "TRANSPORT_ORDER_DELETE",
      restore: "TRANSPORT_ORDER_RESTORE"
    },
    events: {
      created: "TRANSPORT_ORDER_CREATED",
      updated: "TRANSPORT_ORDER_UPDATED",
      deleted: "TRANSPORT_ORDER_DELETED",
      restored: "TRANSPORT_ORDER_RESTORED"
    },
    fields: [
      { name: "TransportOrderID", type: "ID", required: true },
      { name: "OrganizationID", type: "REFERENCE", required: true },
      { name: "ClientID", type: "REFERENCE", required: true },
      { name: "CarrierID", type: "REFERENCE" },
      { name: "RouteID", type: "REFERENCE" },
      { name: "CargoID", type: "REFERENCE" },
      { name: "DriverID", type: "REFERENCE" },
      { name: "VehicleID", type: "REFERENCE" },
      { name: "OrderNumber", type: "STRING", unique: true },
      { name: "LoadingAddress", type: "STRING" },
      { name: "DeliveryAddress", type: "STRING" },
      { name: "CargoWeight", type: "NUMBER" },
      { name: "Status", type: "ENUM", default: "NEW" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN" }
    ],
    relations: {
      OrganizationID: { entity: "ORGANIZATION", type: "MANY_TO_ONE" },
      ClientID: { entity: "CLIENT", type: "MANY_TO_ONE" },
      CarrierID: { entity: "CARRIER", type: "MANY_TO_ONE" },
      RouteID: { entity: "ROUTE", type: "MANY_TO_ONE" },
      CargoID: { entity: "CARGO", type: "MANY_TO_ONE" },
      DriverID: { entity: "DRIVER", type: "MANY_TO_ONE" },
      VehicleID: { entity: "VEHICLE", type: "MANY_TO_ONE" }
    },
    indexes: {
      unique: ["OrderNumber"],
      search: ["ClientID", "CarrierID", "Status", "CreatedAt"]
    },
    audit: {
      enabled: true,
      fields: ["Status", "LoadingAddress", "DeliveryAddress", "CargoWeight"]
    }
  },

  // 2. CARRIER
  CARRIER: {
    entity: "CARRIER",
    repository: "CarrierRepository",
    table: "Carriers",
    id: "CarrierID",
    idPrefix: "CAR",
    version: 1,
    permissions: {
      create: "CARRIER_CREATE",
      read: "CARRIER_READ",
      update: "CARRIER_UPDATE",
      delete: "CARRIER_DELETE",
      restore: "CARRIER_RESTORE"
    },
    events: {
      created: "CARRIER_CREATED",
      updated: "CARRIER_UPDATED",
      deleted: "CARRIER_DELETED",
      restored: "CARRIER_RESTORED"
    },
    fields: [
      { name: "CarrierID", type: "ID", required: true },
      { name: "OrganizationID", type: "REFERENCE", required: true },
      { name: "Name", type: "STRING", required: true },
      { name: "INN", type: "STRING", unique: true },
      { name: "Phone", type: "STRING" },
      { name: "Email", type: "STRING" },
      { name: "Status", type: "ENUM", default: "ACTIVE" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN" }
    ],
    relations: {
      OrganizationID: { entity: "ORGANIZATION", type: "MANY_TO_ONE" }
    },
    indexes: {
      unique: ["INN"],
      search: ["Name", "Phone", "Status"]
    },
    audit: {
      enabled: true,
      fields: ["Name", "Phone", "Email", "Status"]
    }
  },

  // 3. DRIVER
  DRIVER: {
    entity: "DRIVER",
    repository: "DriverRepository",
    table: "Drivers",
    id: "DriverID",
    idPrefix: "DRV",
    version: 1,
    permissions: {
      create: "DRIVER_CREATE",
      read: "DRIVER_READ",
      update: "DRIVER_UPDATE",
      delete: "DRIVER_DELETE",
      restore: "DRIVER_RESTORE"
    },
    events: {
      created: "DRIVER_CREATED",
      updated: "DRIVER_UPDATED",
      deleted: "DRIVER_DELETED",
      restored: "DRIVER_RESTORED"
    },
    fields: [
      { name: "DriverID", type: "ID", required: true },
      { name: "OrganizationID", type: "REFERENCE", required: true },
      { name: "CarrierID", type: "REFERENCE" },
      { name: "Name", type: "STRING", required: true },
      { name: "Phone", type: "STRING" },
      { name: "LicenseNumber", type: "STRING", unique: true },
      { name: "Status", type: "ENUM", default: "ACTIVE" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN" }
    ],
    relations: {
      OrganizationID: { entity: "ORGANIZATION", type: "MANY_TO_ONE" },
      CarrierID: { entity: "CARRIER", type: "MANY_TO_ONE" }
    },
    indexes: {
      unique: ["LicenseNumber"],
      search: ["Name", "Phone", "Status"]
    },
    audit: {
      enabled: true,
      fields: ["Name", "Phone", "LicenseNumber", "Status"]
    }
  },

  // 4. VEHICLE
  VEHICLE: {
    entity: "VEHICLE",
    repository: "VehicleRepository",
    table: "Vehicles",
    id: "VehicleID",
    idPrefix: "VEH",
    version: 1,
    permissions: {
      create: "VEHICLE_CREATE",
      read: "VEHICLE_READ",
      update: "VEHICLE_UPDATE",
      delete: "VEHICLE_DELETE",
      restore: "VEHICLE_RESTORE"
    },
    events: {
      created: "VEHICLE_CREATED",
      updated: "VEHICLE_UPDATED",
      deleted: "VEHICLE_DELETED",
      restored: "VEHICLE_RESTORED"
    },
    fields: [
      { name: "VehicleID", type: "ID", required: true },
      { name: "OrganizationID", type: "REFERENCE", required: true },
      { name: "CarrierID", type: "REFERENCE" },
      { name: "PlateNumber", type: "STRING", unique: true },
      { name: "Model", type: "STRING" },
      { name: "Capacity", type: "NUMBER" },
      { name: "Status", type: "ENUM", default: "ACTIVE" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN" }
    ],
    relations: {
      OrganizationID: { entity: "ORGANIZATION", type: "MANY_TO_ONE" },
      CarrierID: { entity: "CARRIER", type: "MANY_TO_ONE" }
    },
    indexes: {
      unique: ["PlateNumber"],
      search: ["Model", "Status"]
    },
    audit: {
      enabled: true,
      fields: ["PlateNumber", "Model", "Capacity", "Status"]
    }
  },

  // 5. ROUTE
  ROUTE: {
    entity: "ROUTE",
    repository: "RouteRepository",
    table: "Routes",
    id: "RouteID",
    idPrefix: "RTE",
    version: 1,
    permissions: {
      create: "ROUTE_CREATE",
      read: "ROUTE_READ",
      update: "ROUTE_UPDATE",
      delete: "ROUTE_DELETE",
      restore: "ROUTE_RESTORE"
    },
    events: {
      created: "ROUTE_CREATED",
      updated: "ROUTE_UPDATED",
      deleted: "ROUTE_DELETED",
      restored: "ROUTE_RESTORED"
    },
    fields: [
      { name: "RouteID", type: "ID", required: true },
      { name: "OrganizationID", type: "REFERENCE", required: true },
      { name: "StartPoint", type: "STRING", required: true },
      { name: "EndPoint", type: "STRING", required: true },
      { name: "Distance", type: "NUMBER" },
      { name: "Duration", type: "NUMBER" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN" }
    ],
    relations: {
      OrganizationID: { entity: "ORGANIZATION", type: "MANY_TO_ONE" }
    },
    indexes: {
      search: ["StartPoint", "EndPoint"]
    },
    audit: {
      enabled: true,
      fields: ["StartPoint", "EndPoint", "Distance", "Duration"]
    }
  },

  // 6. CARGO
  CARGO: {
    entity: "CARGO",
    repository: "CargoRepository",
    table: "Cargoes",
    id: "CargoID",
    idPrefix: "CRG",
    version: 1,
    permissions: {
      create: "CARGO_CREATE",
      read: "CARGO_READ",
      update: "CARGO_UPDATE",
      delete: "CARGO_DELETE",
      restore: "CARGO_RESTORE"
    },
    events: {
      created: "CARGO_CREATED",
      updated: "CARGO_UPDATED",
      deleted: "CARGO_DELETED",
      restored: "CARGO_RESTORED"
    },
    fields: [
      { name: "CargoID", type: "ID", required: true },
      { name: "OrganizationID", type: "REFERENCE", required: true },
      { name: "Name", type: "STRING", required: true },
      { name: "Weight", type: "NUMBER" },
      { name: "Volume", type: "NUMBER" },
      { name: "Type", type: "STRING" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN" }
    ],
    relations: {
      OrganizationID: { entity: "ORGANIZATION", type: "MANY_TO_ONE" }
    },
    indexes: {
      search: ["Name", "Type"]
    },
    audit: {
      enabled: true,
      fields: ["Name", "Weight", "Volume", "Type"]
    }
  },

  // 7. EVENT_EXECUTION_LOG (единственный вариант, без дублирования)
  EVENT_EXECUTION_LOG: {
    entity: "EVENT_EXECUTION_LOG",
    repository: "EventExecutionLogRepository",
    table: "EventExecutionLog",
    id: "ExecutionID",
    idField: "ExecutionID",
    idPrefix: "ELOG",
    version: 1,
    permissions: {
      create: "EVENT_LOG_CREATE",
      read: "EVENT_LOG_READ",
      update: "EVENT_LOG_UPDATE",
      delete: "EVENT_LOG_DELETE",
      restore: "EVENT_LOG_RESTORE"
    },
    events: {
      created: "EVENT_LOG_CREATED",
      updated: "EVENT_LOG_UPDATED",
      deleted: "EVENT_LOG_DELETED",
      restored: "EVENT_LOG_RESTORED"
    },
    fields: [
      { name: "ExecutionID", type: "ID", required: true },
      { name: "EventID", type: "STRING" },
      { name: "Entity", type: "STRING" },
      { name: "EventType", type: "STRING" },
      { name: "Status", type: "ENUM", default: "PENDING" },
      { name: "Processor", type: "STRING" },
      { name: "Error", type: "STRING" },
      { name: "Timestamp", type: "DATETIME" },
      { name: "CreatedAt", type: "DATETIME" }
    ],
    audit: { enabled: false }
  },

  // 8. FAILED_EVENT (единственный вариант, исправлен)
  FAILED_EVENT: {
    entity: "FAILED_EVENT",
    repository: "FailedEventRepository",
    table: "FailedEvents",
    id: "FailedEventID",
    idField: "FailedEventID",
    idPrefix: "FAIL",
    version: 1,
    permissions: {
      create: "FAILED_EVENT_CREATE",
      read: "FAILED_EVENT_READ",
      update: "FAILED_EVENT_UPDATE",
      delete: "FAILED_EVENT_DELETE",
      restore: "FAILED_EVENT_RESTORE"
    },
    events: {
      created: "FAILED_EVENT_CREATED",
      updated: "FAILED_EVENT_UPDATED",
      deleted: "FAILED_EVENT_DELETED",
      restored: "FAILED_EVENT_RESTORED"
    },
    fields: [
      { name: "FailedEventID", type: "ID", required: true },
      { name: "EventID", type: "STRING" },
      { name: "Entity", type: "STRING" },
      { name: "Payload", type: "STRING" },
      { name: "Error", type: "STRING" },
      { name: "RetryCount", type: "NUMBER", default: 0 },
      { name: "Status", type: "ENUM", default: "PENDING" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" }
    ],
    audit: { enabled: false }
  }
};

// ----- МЕТОДЫ ДОСТУПА -----
EntityMetadata.get = function (entity) {
  return this[entity] || null;
};

EntityMetadata.has = function (entity) {
  return !!this[entity];
};

// ----- list() -----
EntityMetadata.list = function () {
  return Object.keys(this).filter(key => {
    const item = this[key];
    return (
      item &&
      typeof item === "object" &&
      item.entity &&
      item.table &&
      Array.isArray(item.fields)
    );
  });
};

EntityMetadata.health = function () {
  return HealthContract.create(
    "EntityMetadata",
    "OK",
    {
      version: this.version,
      entities: this.list()
    }
  );
};

// ----- МЕТОД REGISTER (улучшен) -----
EntityMetadata.register = function (definition) {
  if (!definition || !definition.entity) {
    throw new Error("EntityMetadata.register: entity name required");
  }
  const entity = definition.entity;

  // Заполняем отсутствующие поля
  if (!definition.table) definition.table = entity + "s";
  if (!definition.id) definition.id = entity + "ID";
  if (!definition.idField) definition.idField = definition.id;
  if (!definition.idPrefix) definition.idPrefix = entity.substring(0, 3);
  if (!definition.version) definition.version = 1;
  if (!definition.permissions) {
    definition.permissions = {
      create: entity + "_CREATE",
      read: entity + "_READ",
      update: entity + "_UPDATE",
      delete: entity + "_DELETE",
      restore: entity + "_RESTORE"
    };
  }
  if (!definition.events) {
    definition.events = {
      created: entity + "_CREATED",
      updated: entity + "_UPDATED",
      deleted: entity + "_DELETED",
      restored: entity + "_RESTORED"
    };
  }
  if (!definition.fields) definition.fields = [];
  if (!definition.relations) definition.relations = {};
  if (!definition.indexes) definition.indexes = { search: [], unique: [] };
  if (!definition.audit) definition.audit = { enabled: true, fields: [] };

  // Преобразуем поля из массива строк в объекты
  if (Array.isArray(definition.fields) && definition.fields.length > 0 && typeof definition.fields[0] === "string") {
    const fieldNames = definition.fields;
    definition.fields = fieldNames.map(name => {
      const field = { name, type: "STRING" };
      // Определяем тип
      if (name === definition.id) {
        field.type = "ID";
        field.required = true;
      } else if (name.endsWith("ID")) {
        field.type = "REFERENCE";
      } else if (name === "CreatedAt" || name === "UpdatedAt" || name === "Timestamp") {
        field.type = "DATETIME";
      } else if (name === "Deleted") {
        field.type = "BOOLEAN";
      } else if (name === "Balance" || name === "CreditLimit" || name === "Revenue" || name === "Cost" || name === "Profit" || name === "Margin" || name === "Weight" || name === "Volume" || name === "Distance" || name === "Duration" || name === "CargoWeight") {
        field.type = "NUMBER";
      }
      return field;
    });
  }

  // Сохраняем
  this[entity] = definition;
  Logger.log("EntityMetadata REGISTERED: " + entity);
  return definition;
};

// ----- ГЛОБАЛИЗАЦИЯ -----
globalThis.EntityMetadata = EntityMetadata;
Logger.log("EntityMetadata READY v" + EntityMetadata.version);