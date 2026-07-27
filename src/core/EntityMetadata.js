// ============================================================
// EntityMetadata v2.1.2
// TaxControl ERP Core
//
// Enterprise Entity Contract Registry
//
// Compatible:
// EntityRegistry v2.3+
// SchemaRegistry v4+
// EntityValidator v1+
// EntityService v5+
// BaseRepository v5.6+
// RepositoryFactory v2.7+
//
// Fixes:
// - Validation relaxed for system fields (OrganizationID, CreatedAt, UpdatedAt, Deleted, *At, *ID)
// - Added applyDefaults() to set default values
// - Added USER entity stub
// ============================================================

console.log("EntityMetadata v2.1.2");

const EntityMetadata = {
  version: "2.1.2",
  apiVersion: "2.0",

  architecture: "EntityMetadata -> EntityRegistry -> SchemaRegistry -> Repository",

  initialized: false,
  locked: false,
  strictMode: true,
  allowTestEntityRegistration: true,

  // ---- Хранилище зарегистрированных сущностей ----
  entities: {},

  // ============================================================
  // СУЩНОСТИ (определения)
  // ============================================================

  CLIENT: {
    entity: "CLIENT",
    table: "Clients",
    repository: "ClientRepository",
    repositoryContract: "BaseRepositoryV5",
    idField: "ClientID",
    idPrefix: "CLI",
    idGeneration: {
      strategy: "AUTO",
      service: "IdService"
    },
    module: "crm",
    version: 2,
    softDelete: true,
    timestamps: true,
    audit: true,
    versioning: true,

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
      { name: "ClientID", type: "ID", required: false, generated: true },
      { name: "OrganizationID", type: "REFERENCE", required: true },
      { name: "Name", type: "STRING", required: true },
      { name: "INN", type: "STRING", unique: true },
      { name: "Phone", type: "STRING" },
      { name: "Email", type: "STRING" },
      { name: "ManagerID", type: "REFERENCE" },
      { name: "Rating", type: "NUMBER", default: 0 },
      { name: "Address", type: "STRING" },
      { name: "Status", type: "ENUM", default: "ACTIVE" },
      { name: "CreatedBy", type: "REFERENCE" },
      { name: "UpdatedBy", type: "REFERENCE" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN", default: false }
    ],

    relations: {
      OrganizationID: { entity: "ORGANIZATION", type: "MANY_TO_ONE" },
      ManagerID: { entity: "USER", type: "MANY_TO_ONE" }
    }
  },

  TRIP: {
    entity: "TRIP",
    table: "Trips",
    repository: "TripRepository",
    repositoryContract: "BaseRepositoryV5",
    idField: "TripID",
    idPrefix: "TRP",
    idGeneration: {
      strategy: "AUTO",
      service: "IdService"
    },
    module: "transport",
    version: 2,
    softDelete: true,
    timestamps: true,
    audit: true,
    versioning: true,

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
      { name: "TripID", type: "ID", required: false, generated: true },
      { name: "OrganizationID", type: "REFERENCE", required: true },
      { name: "ClientID", type: "REFERENCE" },
      { name: "VehicleID", type: "REFERENCE" },
      { name: "DriverID", type: "REFERENCE" },
      { name: "RouteID", type: "REFERENCE" },
      { name: "CarrierID", type: "REFERENCE" },
      { name: "TransportOrderID", type: "REFERENCE" },
      { name: "ManagerID", type: "REFERENCE" },
      { name: "LogistID", type: "REFERENCE" },
      { name: "Revenue", type: "NUMBER", default: 0 },
      { name: "PlannedCost", type: "NUMBER", default: 0 },
      { name: "ActualCost", type: "NUMBER", default: 0 },
      { name: "Status", type: "ENUM", default: "NEW" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN", default: false }
    ],

    relations: {
      ClientID: { entity: "CLIENT", type: "MANY_TO_ONE" },
      OrganizationID: { entity: "ORGANIZATION", type: "MANY_TO_ONE" }
    }
  },

  ORGANIZATION: {
    entity: "ORGANIZATION",
    table: "Organizations",
    repository: "OrganizationRepository",
    repositoryContract: "BaseRepositoryV5",
    idField: "OrganizationID",
    idPrefix: "ORG",
    idGeneration: {
      strategy: "AUTO",
      service: "IdService"
    },
    module: "core",
    version: 2,

    permissions: {
      create: "ORGANIZATION_CREATE",
      read: "ORGANIZATION_READ",
      update: "ORGANIZATION_UPDATE",
      delete: "ORGANIZATION_DELETE",
      restore: "ORGANIZATION_RESTORE"
    },

    events: {
      created: "ORGANIZATION_CREATED",
      updated: "ORGANIZATION_UPDATED",
      deleted: "ORGANIZATION_DELETED",
      restored: "ORGANIZATION_RESTORED"
    },

    fields: [
      { name: "OrganizationID", type: "ID", required: false, generated: true },
      { name: "Name", type: "STRING", required: true },
      { name: "INN", type: "STRING", unique: true },
      { name: "KPP", type: "STRING" },
      { name: "Type", type: "ENUM" },
      { name: "TaxSystem", type: "ENUM" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN", default: false }
    ]
  },

  TRANSPORT_ORDER: {
    entity: "TRANSPORT_ORDER",
    table: "TransportOrders",
    repository: "TransportOrderRepository",
    repositoryContract: "BaseRepositoryV5",
    idField: "TransportOrderID",
    idPrefix: "ORD",
    idGeneration: {
      strategy: "AUTO",
      service: "IdService"
    },
    module: "transport",
    version: 2,
    softDelete: true,

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
      { name: "TransportOrderID", type: "ID", required: false, generated: true },
      { name: "OrganizationID", type: "REFERENCE", required: true },
      { name: "ClientID", type: "REFERENCE", required: true },
      { name: "CarrierID", type: "REFERENCE" },
      { name: "RouteID", type: "REFERENCE" },
      { name: "CargoID", type: "REFERENCE" },
      { name: "Status", type: "ENUM", default: "NEW" },
      { name: "OrderDate", type: "DATE" },
      { name: "Price", type: "NUMBER", default: 0 },
      { name: "Comment", type: "STRING" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN", default: false }
    ],

    relations: {
      ClientID: { entity: "CLIENT", type: "MANY_TO_ONE" },
      CarrierID: { entity: "CARRIER", type: "MANY_TO_ONE" }
    }
  },

  VEHICLE: {
    entity: "VEHICLE",
    table: "Vehicles",
    repository: "VehicleRepository",
    repositoryContract: "BaseRepositoryV5",
    idField: "VehicleID",
    idPrefix: "CAR",
    idGeneration: {
      strategy: "AUTO",
      service: "IdService"
    },
    module: "transport",

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
      { name: "VehicleID", type: "ID", required: false, generated: true },
      { name: "OrganizationID", type: "REFERENCE" },
      { name: "Number", type: "STRING", required: true },
      { name: "Brand", type: "STRING" },
      { name: "Model", type: "STRING" },
      { name: "VIN", type: "STRING" },
      { name: "Year", type: "NUMBER" },
      { name: "Mileage", type: "NUMBER", default: 0 },
      { name: "Status", type: "ENUM", default: "ACTIVE" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN", default: false }
    ]
  },

  DRIVER: {
    entity: "DRIVER",
    table: "Drivers",
    repository: "DriverRepository",
    repositoryContract: "BaseRepositoryV5",
    idField: "DriverID",
    idPrefix: "DRV",
    idGeneration: {
      strategy: "AUTO",
      service: "IdService"
    },
    module: "transport",

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
      { name: "DriverID", type: "ID", required: false, generated: true },
      { name: "OrganizationID", type: "REFERENCE" },
      { name: "FullName", type: "STRING", required: true },
      { name: "Phone", type: "STRING" },
      { name: "LicenseNumber", type: "STRING" },
      { name: "Status", type: "ENUM", default: "ACTIVE" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN", default: false }
    ]
  },

  CARRIER: {
    entity: "CARRIER",
    table: "Carriers",
    repository: "CarrierRepository",
    repositoryContract: "BaseRepositoryV5",
    idField: "CarrierID",
    idPrefix: "CAR",
    idGeneration: {
      strategy: "AUTO",
      service: "IdService"
    },
    module: "transport",
    version: 2,

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
      { name: "CarrierID", type: "ID", required: false, generated: true },
      { name: "OrganizationID", type: "REFERENCE", required: true },
      { name: "Name", type: "STRING", required: true },
      { name: "INN", type: "STRING" },
      { name: "Phone", type: "STRING" },
      { name: "Email", type: "STRING" },
      { name: "Status", type: "ENUM", default: "ACTIVE" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN", default: false }
    ]
  },

  CARGO: {
    entity: "CARGO",
    table: "Cargo",
    repository: "CargoRepository",
    repositoryContract: "BaseRepositoryV5",
    idField: "CargoID",
    idPrefix: "CRG",
    idGeneration: {
      strategy: "AUTO",
      service: "IdService"
    },
    module: "transport",

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
      { name: "CargoID", type: "ID", required: false, generated: true },
      { name: "OrganizationID", type: "REFERENCE" },
      { name: "Name", type: "STRING", required: true },
      { name: "Description", type: "STRING" },
      { name: "Weight", type: "NUMBER", default: 0 },
      { name: "Volume", type: "NUMBER", default: 0 },
      { name: "Unit", type: "STRING" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN", default: false }
    ]
  },

  ROUTE: {
    entity: "ROUTE",
    table: "Routes",
    repository: "RouteRepository",
    repositoryContract: "BaseRepositoryV5",
    idField: "RouteID",
    idPrefix: "RTE",
    idGeneration: {
      strategy: "AUTO",
      service: "IdService"
    },
    module: "transport",

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
      { name: "RouteID", type: "ID", required: false, generated: true },
      { name: "OrganizationID", type: "REFERENCE" },
      { name: "Name", type: "STRING", required: true },
      { name: "From", type: "STRING" },
      { name: "To", type: "STRING" },
      { name: "Distance", type: "NUMBER" },
      { name: "Duration", type: "NUMBER" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN", default: false }
    ]
  },

  FINANCIAL_TRANSACTION: {
    entity: "FINANCIAL_TRANSACTION",
    table: "FinancialTransactions",
    repository: "FinancialTransactionRepository",
    repositoryContract: "BaseRepositoryV5",
    idField: "TransactionID",
    idPrefix: "FIN",
    idGeneration: {
      strategy: "AUTO",
      service: "IdService"
    },
    module: "finance",
    version: 2,

    permissions: {
      create: "FINANCIAL_TRANSACTION_CREATE",
      read: "FINANCIAL_TRANSACTION_READ",
      update: "FINANCIAL_TRANSACTION_UPDATE",
      delete: "FINANCIAL_TRANSACTION_DELETE",
      restore: "FINANCIAL_TRANSACTION_RESTORE"
    },

    events: {
      created: "FINANCIAL_TRANSACTION_CREATED",
      updated: "FINANCIAL_TRANSACTION_UPDATED",
      deleted: "FINANCIAL_TRANSACTION_DELETED",
      restored: "FINANCIAL_TRANSACTION_RESTORED"
    },

    fields: [
      { name: "TransactionID", type: "ID", required: false, generated: true },
      { name: "OrganizationID", type: "REFERENCE", required: true },
      { name: "ClientID", type: "REFERENCE" },
      { name: "TripID", type: "REFERENCE" },
      { name: "Type", type: "ENUM", required: true },
      { name: "Amount", type: "NUMBER", required: true, default: 0 },
      { name: "Direction", type: "ENUM" },
      { name: "Date", type: "DATE" },
      { name: "Comment", type: "STRING" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" }
    ]
  },

  CLIENT_FINANCE_PROFILE: {
    entity: "CLIENT_FINANCE_PROFILE",
    table: "ClientFinanceProfiles",
    repository: "ClientFinanceProfileRepository",
    repositoryContract: "BaseRepositoryV5",
    idField: "ProfileID",
    idPrefix: "CFP",
    idGeneration: {
      strategy: "AUTO",
      service: "IdService"
    },
    module: "finance",

    permissions: {
      create: "CLIENT_FINANCE_PROFILE_CREATE",
      read: "CLIENT_FINANCE_PROFILE_READ",
      update: "CLIENT_FINANCE_PROFILE_UPDATE",
      delete: "CLIENT_FINANCE_PROFILE_DELETE",
      restore: "CLIENT_FINANCE_PROFILE_RESTORE"
    },

    events: {
      created: "CLIENT_FINANCE_PROFILE_CREATED",
      updated: "CLIENT_FINANCE_PROFILE_UPDATED",
      deleted: "CLIENT_FINANCE_PROFILE_DELETED",
      restored: "CLIENT_FINANCE_PROFILE_RESTORED"
    },

    fields: [
      { name: "ProfileID", type: "ID", required: false, generated: true },
      { name: "ClientID", type: "REFERENCE", required: true },
      { name: "CreditLimit", type: "NUMBER", default: 0 },
      { name: "Debt", type: "NUMBER", default: 0 },
      { name: "PaymentTerms", type: "NUMBER" },
      { name: "Status", type: "ENUM", default: "ACTIVE" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" }
    ]
  },

  KPI: {
    entity: "KPI",
    table: "KPI",
    repository: "KPIRepository",
    repositoryContract: "BaseRepositoryV5",
    idField: "KPIID",
    idPrefix: "KPI",
    idGeneration: {
      strategy: "AUTO",
      service: "IdService"
    },
    module: "analytics",

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
      { name: "KPIID", type: "ID", required: false, generated: true },
      { name: "OrganizationID", type: "REFERENCE" },
      { name: "Name", type: "STRING", required: true },
      { name: "Value", type: "NUMBER", default: 0 },
      { name: "Period", type: "STRING" },
      { name: "Category", type: "STRING" },
      { name: "CreatedAt", type: "DATETIME" }
    ]
  },

  AUDIT: {
    entity: "AUDIT",
    table: "AuditLog",
    repository: "AuditRepository",
    repositoryContract: "BaseRepositoryV5",
    idField: "AuditID",
    idPrefix: "AUD",
    idGeneration: {
      strategy: "AUTO",
      service: "IdService"
    },
    module: "system",

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

    fields: [
      { name: "AuditID", type: "ID", required: false, generated: true },
      { name: "OrganizationID", type: "REFERENCE" },
      { name: "Entity", type: "STRING", required: true },
      { name: "EntityID", type: "STRING", required: true },
      { name: "Action", type: "ENUM", required: true },
      { name: "Before", type: "OBJECT" },
      { name: "After", type: "OBJECT" },
      { name: "UserID", type: "STRING" },
      { name: "CreatedAt", type: "DATETIME" }
    ]
  },

  VERSION: {
    entity: "VERSION",
    table: "EntityVersions",
    repository: "VersionRepository",
    repositoryContract: "BaseRepositoryV5",
    idField: "VersionID",
    idPrefix: "VER",
    idGeneration: {
      strategy: "AUTO",
      service: "IdService"
    },
    module: "system",

    permissions: {
      create: "VERSION_CREATE",
      read: "VERSION_READ",
      update: "VERSION_UPDATE",
      delete: "VERSION_DELETE",
      restore: "VERSION_RESTORE"
    },

    events: {
      created: "VERSION_CREATED",
      updated: "VERSION_UPDATED",
      deleted: "VERSION_DELETED",
      restored: "VERSION_RESTORED"
    },

    fields: [
      { name: "VersionID", type: "ID", required: false, generated: true },
      { name: "Entity", type: "STRING", required: true },
      { name: "EntityID", type: "STRING", required: true },
      { name: "Version", type: "NUMBER", default: 1 },
      { name: "Snapshot", type: "OBJECT" },
      { name: "CreatedAt", type: "DATETIME" }
    ]
  },

  // ============================================================
  // НОВАЯ СУЩНОСТЬ USER (заглушка)
  // ============================================================
  USER: {
    entity: "USER",
    table: "Users",
    repository: "UserRepository",
    repositoryContract: "BaseRepositoryV5",
    idField: "UserID",
    idPrefix: "USR",
    idGeneration: {
      strategy: "AUTO",
      service: "IdService"
    },
    module: "core",
    version: 1,

    permissions: {
      create: "USER_CREATE",
      read: "USER_READ",
      update: "USER_UPDATE",
      delete: "USER_DELETE",
      restore: "USER_RESTORE"
    },

    events: {
      created: "USER_CREATED",
      updated: "USER_UPDATED",
      deleted: "USER_DELETED",
      restored: "USER_RESTORED"
    },

    fields: [
      { name: "UserID", type: "ID", required: false, generated: true },
      { name: "OrganizationID", type: "REFERENCE", required: true },
      { name: "Name", type: "STRING", required: true },
      { name: "Email", type: "STRING", unique: true },
      { name: "Role", type: "STRING", default: "USER" },
      { name: "Status", type: "ENUM", default: "ACTIVE" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN", default: false }
    ],

    relations: {
      OrganizationID: { entity: "ORGANIZATION", type: "MANY_TO_ONE" }
    }
  }
  // ---- КОНЕЦ ОПРЕДЕЛЕНИЙ ----
};

// ============================================================
// АВТО-РЕГИСТРАЦИЯ ВСЕХ СУЩНОСТЕЙ
// ============================================================
(function autoRegister() {
  const self = EntityMetadata;
  self.entities = self.entities || {};

  const keys = Object.keys(self).filter(key => {
    const item = self[key];
    return (
      item &&
      typeof item === 'object' &&
      item.entity &&
      item.table &&
      Array.isArray(item.fields)
    );
  });

  for (const key of keys) {
    const entity = self[key];
    if (!self.entities[entity.entity]) {
      self.entities[entity.entity] = entity;
    } else {
      Logger.warn(`Entity ${entity.entity} already registered, skipping`);
    }
  }

  Logger.log(
    `EntityMetadata auto-registered ${Object.keys(self.entities).length} entities`
  );
})();

// ============================================================
// API
// ============================================================

EntityMetadata.register = function (name, meta) {
  if (!name || !meta) {
    throw new Error("Invalid entity metadata");
  }
  if (this.entities[name]) {
    Logger.warn(`Entity ${name} already registered, overwriting`);
  }
  this.entities[name] = meta;
};

EntityMetadata.get = function (name) {
  return this.entities?.[name] || null;
};

EntityMetadata.list = function () {
  return Object.keys(this.entities || {});
};

// ============================================================
// ПРИМЕНЕНИЕ ЗНАЧЕНИЙ ПО УМОЛЧАНИЮ
// ============================================================
EntityMetadata.applyDefaults = function (entity, data) {
  const meta = this.get(entity);
  if (!meta) {
    Logger.warn(`Cannot apply defaults: metadata for ${entity} not found`);
    return data;
  }

  const result = { ...data };
  const fields = meta.fields || [];

  for (const field of fields) {
    if (result[field.name] === undefined && field.default !== undefined) {
      result[field.name] = field.default;
    }
  }

  return result;
};

// ============================================================
// ВАЛИДАЦИЯ (смягчённая для системных полей)
// ============================================================
EntityMetadata.validate = function (entity, data) {
  const meta = this.get(entity);
  if (!meta) {
    throw new Error("Metadata missing " + entity);
  }

  const errors = [];
  const fields = meta.fields || [];
  const allowed = fields.map(f => f.name);

  // Неизвестные поля – пропускаем системные (OrganizationID, *At, *ID, Deleted)
  Object.keys(data).forEach(key => {
    if (!allowed.includes(key)) {
      // Разрешаем системные поля
      const isSystemField =
        key === "OrganizationID" ||
        key === "TenantID" ||
        key === "CreatedBy" ||
        key === "UpdatedBy" ||
        key === "Deleted" ||
        key.endsWith("At") ||
        key.endsWith("ID");
      if (!isSystemField) {
        errors.push("Unknown field: " + key);
      }
    }
  });

  // Обязательные поля (игнорируем generated)
  fields.forEach(field => {
    if (field.required && (data[field.name] === undefined || data[field.name] === "")) {
      // Пропускаем generated поля, т.к. они генерируются автоматически
      if (!field.generated) {
        errors.push("Required field missing: " + field.name);
      }
    }
  });

  if (errors.length) {
    throw new Error(
      "ENTITY VALIDATION FAILED " + entity + ": " + errors.join(", ")
    );
  }

  return true;
};

// ============================================================
// HEALTH
// ============================================================
EntityMetadata.health = function () {
  const entities = this.list();
  return HealthContract.create(
    "EntityMetadata",
    "OK",
    {
      version: this.version,
      apiVersion: this.apiVersion,
      entities: entities,
      count: entities.length
    }
  );
};

// ============================================================
// ГЛОБАЛЬНЫЙ ЭКСПОРТ
// ============================================================

globalThis.EntityMetadata = EntityMetadata;

Logger.log("EntityMetadata GLOBAL READY v" + EntityMetadata.version);