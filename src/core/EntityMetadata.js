console.log("EntityMetadata");

const EntityMetadata = {
  version: "0.6.0",

  // ----- СУЩЕСТВУЮЩИЕ СУЩНОСТИ (CLIENT, TRIP, CLIENT_FINANCE_PROFILE, KPI, AUDIT) -----
  CLIENT: {
    entity: "CLIENT",
    table: "Clients",
    id: "ClientID",
    idPrefix: "CLIENT",
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
      { name: "INN", type: "STRING" },
      { name: "Phone", type: "STRING" },
      { name: "Email", type: "STRING" },
      { name: "Address", type: "STRING" },
      { name: "ManagerID", type: "REFERENCE" },
      { name: "Rating", type: "NUMBER" },
      { name: "Status", type: "ENUM", default: "ACTIVE" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN" }
    ]
  },

  AUDIT: {
    entity: "AUDIT",
    table: "AuditLog",
    id: "AuditID",
    idPrefix: "AUD",
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
    timestamps: true
  },

  TRIP: {
    entity: "TRIP",
    table: "Trips",
    id: "TripID",
    idPrefix: "TRIP",
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
    ]
  },

  CLIENT_FINANCE_PROFILE: {
    entity: "CLIENT_FINANCE_PROFILE",
    table: "ClientFinanceProfiles",
    id: "FinanceProfileID",
    idPrefix: "FP",
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
    ]
  },

  KPI: {
    entity: "KPI",
    table: "KPIMetrics",
    id: "KPIID",
    idPrefix: "KPI",
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
    ]
  }
};

// ----- МЕТОДЫ ДОСТУПА -----
EntityMetadata.get = function (entity) {
  return this[entity] || null;
};

EntityMetadata.has = function (entity) {
  return !!this[entity];
};

// ----- ИСПРАВЛЕННЫЙ МЕТОД list() -----
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

// ----- МЕТОД REGISTER -----
EntityMetadata.register = function (definition) {
  if (!definition || !definition.entity) {
    throw new Error("EntityMetadata.register: entity name required");
  }
  const entity = definition.entity;

  // 1. Заполняем отсутствующие поля значениями по умолчанию
  if (!definition.table) definition.table = entity + "s";
  if (!definition.id) definition.id = entity + "ID";
  // ----- УЛУЧШЕНИЕ: явно устанавливаем idField из id -----
  if (!definition.idField) definition.idField = definition.id;
  if (!definition.idPrefix) definition.idPrefix = entity.substring(0, 3);
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

  // 2. Преобразуем поля (если переданы как массив строк)
  if (Array.isArray(definition.fields) && definition.fields.length > 0 && typeof definition.fields[0] === "string") {
    const fieldNames = definition.fields;
    definition.fields = fieldNames.map(name => {
      const field = { name, type: "STRING" };
      if (name === definition.id) {
        field.type = "ID";
      } else if (name.endsWith("ID")) {
        field.type = "REFERENCE";
      } else if (name === "CreatedAt" || name === "UpdatedAt") {
        field.type = "DATETIME";
      } else if (name === "Deleted") {
        field.type = "BOOLEAN";
      }
      return field;
    });
  }

  // 3. Сохраняем в объект
  this[entity] = definition;
  Logger.log("EntityMetadata REGISTERED: " + entity);
  return definition;
};

// ----- РЕГИСТРАЦИЯ НОВЫХ СУЩНОСТЕЙ -----

// 1. TRANSPORT_ORDER
EntityMetadata.register({
  entity: "TRANSPORT_ORDER",
  repository: "TransportOrderRepository",
  table: "TransportOrders",
  id: "TransportOrderID",
  idPrefix: "TO",
  fields: [
    "TransportOrderID",
    "OrganizationID",
    "ClientID",
    "CarrierID",
    "RouteID",
    "CargoID",
    "DriverID",
    "VehicleID",
    "OrderNumber",
    "LoadingAddress",
    "DeliveryAddress",
    "CargoWeight",
    "Status",
    "CreatedAt",
    "UpdatedAt",
    "Deleted"
  ]
});

// 2. CARRIER
EntityMetadata.register({
  entity: "CARRIER",
  repository: "CarrierRepository",
  table: "Carriers",
  id: "CarrierID",
  idPrefix: "CAR",
  fields: [
    "CarrierID",
    "OrganizationID",
    "Name",
    "INN",
    "Phone",
    "Email",
    "Status",
    "CreatedAt",
    "UpdatedAt",
    "Deleted"
  ]
});

// 3. DRIVER
EntityMetadata.register({
  entity: "DRIVER",
  repository: "DriverRepository",
  table: "Drivers",
  id: "DriverID",
  idPrefix: "DRV",
  fields: [
    "DriverID",
    "OrganizationID",
    "CarrierID",
    "Name",
    "Phone",
    "LicenseNumber",
    "Status",
    "CreatedAt",
    "UpdatedAt",
    "Deleted"
  ]
});

// 4. VEHICLE
EntityMetadata.register({
  entity: "VEHICLE",
  repository: "VehicleRepository",
  table: "Vehicles",
  id: "VehicleID",
  idPrefix: "VEH",
  fields: [
    "VehicleID",
    "OrganizationID",
    "CarrierID",
    "PlateNumber",
    "Model",
    "Capacity",
    "Status",
    "CreatedAt",
    "UpdatedAt",
    "Deleted"
  ]
});

// 5. ROUTE
EntityMetadata.register({
  entity: "ROUTE",
  repository: "RouteRepository",
  table: "Routes",
  id: "RouteID",
  idPrefix: "RTE",
  fields: [
    "RouteID",
    "OrganizationID",
    "StartPoint",
    "EndPoint",
    "Distance",
    "Duration",
    "CreatedAt",
    "UpdatedAt",
    "Deleted"
  ]
});

// 6. CARGO
EntityMetadata.register({
  entity: "CARGO",
  repository: "CargoRepository",
  table: "Cargoes",
  id: "CargoID",
  idPrefix: "CRG",
  fields: [
    "CargoID",
    "OrganizationID",
    "Name",
    "Weight",
    "Volume",
    "Type",
    "CreatedAt",
    "UpdatedAt",
    "Deleted"
  ]
});

// 7. EVENT EXECUTION LOG
EntityMetadata.register({
  entity: "EVENT_EXECUTION",
  repository: "EventExecutionLogRepository",
  table: "EventExecutionLog",
  id: "ExecutionID",
  idField: "ExecutionID",
  idPrefix: "EXEC",
  fields: [
    "ExecutionID",
    "EventID",
    "Entity",
    "Type",
    "Status",
    "Processor",
    "Error",
    "CreatedAt"
  ]
});

// 8. FAILED EVENTS
EntityMetadata.register({
  entity: "FAILED_EVENT",
  repository: "FailedEventRepository",
  table: "FailedEvents",
  id: "FailedEventID",
  idField: "FailedEventID",
  idPrefix: "FAIL",
  fields: [
    "FailedEventID",
    "EventID",
    "Entity",
    "Type",
    "Payload",
    "Error",
    "RetryCount",
    "Status",
    "CreatedAt",
    "UpdatedAt"
  ]
});

// ----- ГЛОБАЛИЗАЦИЯ -----
globalThis.EntityMetadata = EntityMetadata;
Logger.log("EntityMetadata READY v" + EntityMetadata.version);