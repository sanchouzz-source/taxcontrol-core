// ============================================================
// EntityMetadata v2.0.0
// TaxControl ERP
//
// Единый каталог метаданных сущностей.
//
// Изменения v2.0.0:
// - убрано автоматическое создание бизнес-сущностей;
// - добавлены все текущие сущности ERP;
// - добавлена строгая проверка EntityRegistry;
// - добавлена диагностика дубликатов;
// - добавлена нормализация определений;
// - добавлены permissions, events, audit, versioning;
// - добавлена управляемая регистрация тестовых сущностей;
// - совместимость с BaseRepository v5.5+;
// - совместимость с SchemaRegistry v4+;
// - расширенный health().
// ============================================================

console.log("EntityMetadata v2.0.0");


const EntityMetadata = {

  version: "2.0.0",

  architecture: "Static Entity Metadata Registry",

  initialized: false,

  locked: false,

  strictMode: true,

  allowTestEntityRegistration: true,


  // ============================================================
  // CLIENT
  // ============================================================

  CLIENT: {

    entity: "CLIENT",

    table: "Clients",

    idField: "ClientID",

    idPrefix: "CLI",

    module: "crm",

    version: 1,

    softDelete: true,

    timestamps: true,

    audit: true,

    versioning: true,

    fields: [

      {
        name: "ClientID",
        type: "ID",
        required: true
      },

      {
        name: "OrganizationID",
        type: "REFERENCE",
        required: true
      },

      {
        name: "Name",
        type: "STRING",
        required: true
      },

      {
        name: "INN",
        type: "STRING",
        unique: true
      },

      {
        name: "Phone",
        type: "STRING"
      },

      {
        name: "Email",
        type: "STRING"
      },

      {
        name: "Address",
        type: "STRING"
      },

      {
        name: "Status",
        type: "ENUM",
        default: "ACTIVE"
      },

      {
        name: "CreatedAt",
        type: "DATETIME"
      },

      {
        name: "UpdatedAt",
        type: "DATETIME"
      },

      {
        name: "Deleted",
        type: "BOOLEAN",
        default: false
      }

    ],

    relations: {

      OrganizationID: {
        entity: "ORGANIZATION",
        type: "MANY_TO_ONE"
      }

    },

    permissions: {

      create: "CLIENT_CREATE",

      read: "CLIENT_READ",

      update: "CLIENT_UPDATE",

      delete: "CLIENT_DELETE"

    },

    events: {

      created: "CLIENT_CREATED",

      updated: "CLIENT_UPDATED",

      deleted: "CLIENT_DELETED",

      restored: "CLIENT_RESTORED"

    }

  },


  // ============================================================
  // TRIP
  // ============================================================

  TRIP: {

    entity: "TRIP",

    table: "Trips",

    idField: "TripID",

    idPrefix: "TRP",

    module: "transport",

    version: 1,

    softDelete: true,

    timestamps: true,

    audit: true,

    versioning: true,

    fields: [

      {
        name: "TripID",
        type: "ID",
        required: true
      },

      {
        name: "OrganizationID",
        type: "REFERENCE",
        required: true
      },

      {
        name: "ClientID",
        type: "REFERENCE"
      },

      {
        name: "VehicleID",
        type: "REFERENCE"
      },

      {
        name: "DriverID",
        type: "REFERENCE"
      },

      {
        name: "RouteID",
        type: "REFERENCE"
      },

      {
        name: "CarrierID",
        type: "REFERENCE"
      },

      {
        name: "TransportOrderID",
        type: "REFERENCE"
      },

      {
        name: "ManagerID",
        type: "REFERENCE"
      },

      {
        name: "LogistID",
        type: "REFERENCE"
      },

      {
        name: "LoadingPoint",
        type: "STRING"
      },

      {
        name: "UnloadingPoint",
        type: "STRING"
      },

      {
        name: "LoadingDate",
        type: "DATETIME"
      },

      {
        name: "UnloadingDate",
        type: "DATETIME"
      },

      {
        name: "Distance",
        type: "NUMBER"
      },

      {
        name: "Cargo",
        type: "STRING"
      },

      {
        name: "Revenue",
        type: "NUMBER",
        default: 0
      },

      {
        name: "PlannedCost",
        type: "NUMBER",
        default: 0
      },

      {
        name: "ActualCost",
        type: "NUMBER",
        default: 0
      },

      {
        name: "IsExpedition",
        type: "BOOLEAN",
        default: false
      },

      {
        name: "CarrierName",
        type: "STRING"
      },

      {
        name: "PostalTrackNumber",
        type: "STRING"
      },

      {
        name: "Status",
        type: "ENUM",
        default: "NEW"
      },

      {
        name: "CreatedAt",
        type: "DATETIME"
      },

      {
        name: "UpdatedAt",
        type: "DATETIME"
      },

      {
        name: "Deleted",
        type: "BOOLEAN",
        default: false
      }

    ],

    relations: {

      OrganizationID: {
        entity: "ORGANIZATION",
        type: "MANY_TO_ONE"
      },

      ClientID: {
        entity: "CLIENT",
        type: "MANY_TO_ONE"
      },

      VehicleID: {
        entity: "VEHICLE",
        type: "MANY_TO_ONE"
      },

      DriverID: {
        entity: "DRIVER",
        type: "MANY_TO_ONE"
      },

      RouteID: {
        entity: "ROUTE",
        type: "MANY_TO_ONE"
      },

      CarrierID: {
        entity: "CARRIER",
        type: "MANY_TO_ONE"
      },

      TransportOrderID: {
        entity: "TRANSPORT_ORDER",
        type: "MANY_TO_ONE"
      }

    },

    permissions: {

      create: "TRIP_CREATE",

      read: "TRIP_READ",

      update: "TRIP_UPDATE",

      delete: "TRIP_DELETE"

    },

    events: {

      created: "TRIP_CREATED",

      updated: "TRIP_UPDATED",

      deleted: "TRIP_DELETED",

      restored: "TRIP_RESTORED",

      statusChanged: "TRIP_STATUS_CHANGED"

    }

  },


  // ============================================================
  // ORGANIZATION
  // ============================================================

  ORGANIZATION: {

    entity: "ORGANIZATION",

    table: "Organizations",

    idField: "OrganizationID",

    idPrefix: "ORG",

    module: "core",

    version: 1,

    softDelete: true,

    timestamps: true,

    audit: true,

    versioning: true,

    fields: [

      {
        name: "OrganizationID",
        type: "ID",
        required: true
      },

      {
        name: "Name",
        type: "STRING",
        required: true
      },

      {
        name: "INN",
        type: "STRING",
        unique: true
      },

      {
        name: "KPP",
        type: "STRING"
      },

      {
        name: "TaxSystem",
        type: "ENUM"
      },

      {
        name: "Status",
        type: "ENUM",
        default: "ACTIVE"
      },

      {
        name: "CreatedAt",
        type: "DATETIME"
      },

      {
        name: "UpdatedAt",
        type: "DATETIME"
      },

      {
        name: "Deleted",
        type: "BOOLEAN",
        default: false
      }

    ],

    relations: {},

    events: {

      created: "ORGANIZATION_CREATED",

      updated: "ORGANIZATION_UPDATED",

      deleted: "ORGANIZATION_DELETED",

      restored: "ORGANIZATION_RESTORED"

    }

  },


  // ============================================================
  // USER
  // ============================================================

  USER: {

    entity: "USER",

    table: "Users",

    idField: "UserID",

    idPrefix: "USR",

    module: "security",

    version: 1,

    softDelete: true,

    timestamps: true,

    audit: true,

    versioning: true,

    fields: [

      {
        name: "UserID",
        type: "ID",
        required: true
      },

      {
        name: "OrganizationID",
        type: "REFERENCE"
      },

      {
        name: "Name",
        type: "STRING",
        required: true
      },

      {
        name: "Email",
        type: "STRING",
        unique: true
      },

      {
        name: "RoleID",
        type: "REFERENCE"
      },

      {
        name: "Status",
        type: "ENUM",
        default: "ACTIVE"
      },

      {
        name: "CreatedAt",
        type: "DATETIME"
      },

      {
        name: "UpdatedAt",
        type: "DATETIME"
      },

      {
        name: "Deleted",
        type: "BOOLEAN",
        default: false
      }

    ],

    relations: {

      OrganizationID: {
        entity: "ORGANIZATION",
        type: "MANY_TO_ONE"
      }

    },

    events: {

      created: "USER_CREATED",

      updated: "USER_UPDATED",

      deleted: "USER_DELETED",

      restored: "USER_RESTORED"

    }

  },


  // ============================================================
  // CLIENT FINANCE PROFILE
  // ============================================================

  CLIENT_FINANCE_PROFILE: {

    entity: "CLIENT_FINANCE_PROFILE",

    table: "ClientFinanceProfiles",

    idField: "ClientFinanceProfileID",

    idPrefix: "CFP",

    module: "finance",

    version: 1,

    softDelete: true,

    timestamps: true,

    audit: true,

    versioning: true,

    fields: [

      {
        name: "ClientFinanceProfileID",
        type: "ID",
        required: true
      },

      {
        name: "OrganizationID",
        type: "REFERENCE"
      },

      {
        name: "ClientID",
        type: "REFERENCE",
        required: true
      },

      {
        name: "CreditLimit",
        type: "NUMBER",
        default: 0
      },

      {
        name: "PaymentDelayDays",
        type: "NUMBER",
        default: 0
      },

      {
        name: "Debt",
        type: "NUMBER",
        default: 0
      },

      {
        name: "Status",
        type: "ENUM",
        default: "ACTIVE"
      },

      {
        name: "CreatedAt",
        type: "DATETIME"
      },

      {
        name: "UpdatedAt",
        type: "DATETIME"
      },

      {
        name: "Deleted",
        type: "BOOLEAN",
        default: false
      }

    ],

    relations: {

      ClientID: {
        entity: "CLIENT",
        type: "ONE_TO_ONE"
      },

      OrganizationID: {
        entity: "ORGANIZATION",
        type: "MANY_TO_ONE"
      }

    },

    events: {

      created: "CLIENT_FINANCE_PROFILE_CREATED",

      updated: "CLIENT_FINANCE_PROFILE_UPDATED",

      deleted: "CLIENT_FINANCE_PROFILE_DELETED",

      restored: "CLIENT_FINANCE_PROFILE_RESTORED"

    }

  },


  // ============================================================
  // FINANCIAL TRANSACTION
  // ============================================================

  FINANCIAL_TRANSACTION: {

    entity: "FINANCIAL_TRANSACTION",

    table: "FinancialTransactions",

    idField: "FinancialTransactionID",

    idPrefix: "FIN",

    module: "finance",

    version: 1,

    softDelete: true,

    timestamps: true,

    audit: true,

    versioning: true,

    fields: [

      {
        name: "FinancialTransactionID",
        type: "ID",
        required: true
      },

      {
        name: "OrganizationID",
        type: "REFERENCE",
        required: true
      },

      {
        name: "ClientID",
        type: "REFERENCE"
      },

      {
        name: "TripID",
        type: "REFERENCE"
      },

      {
        name: "Type",
        type: "ENUM",
        required: true
      },

      {
        name: "Category",
        type: "STRING"
      },

      {
        name: "Amount",
        type: "NUMBER",
        required: true
      },

      {
        name: "TransactionDate",
        type: "DATETIME"
      },

      {
        name: "Description",
        type: "STRING"
      },

      {
        name: "Status",
        type: "ENUM",
        default: "POSTED"
      },

      {
        name: "CreatedAt",
        type: "DATETIME"
      },

      {
        name: "UpdatedAt",
        type: "DATETIME"
      },

      {
        name: "Deleted",
        type: "BOOLEAN",
        default: false
      }

    ],

    relations: {

      OrganizationID: {
        entity: "ORGANIZATION",
        type: "MANY_TO_ONE"
      },

      ClientID: {
        entity: "CLIENT",
        type: "MANY_TO_ONE"
      },

      TripID: {
        entity: "TRIP",
        type: "MANY_TO_ONE"
      }

    },

    events: {

      created: "FINANCIAL_TRANSACTION_CREATED",

      updated: "FINANCIAL_TRANSACTION_UPDATED",

      deleted: "FINANCIAL_TRANSACTION_DELETED",

      restored: "FINANCIAL_TRANSACTION_RESTORED"

    }

  },


  // ============================================================
  // AUDIT
  // ============================================================

  AUDIT: {

    entity: "AUDIT",

    table: "AuditLog",

    idField: "AuditID",

    idPrefix: "AUD",

    module: "audit",

    version: 1,

    softDelete: false,

    timestamps: true,

    audit: false,

    versioning: false,

    immutable: true,

    appendOnly: true,

    fields: [

      {
        name: "AuditID",
        type: "ID",
        required: true
      },

      {
        name: "Entity",
        type: "STRING",
        required: true
      },

      {
        name: "EntityID",
        type: "STRING"
      },

      {
        name: "Action",
        type: "STRING",
        required: true
      },

      {
        name: "UserID",
        type: "REFERENCE"
      },

      {
        name: "Before",
        type: "JSON"
      },

      {
        name: "After",
        type: "JSON"
      },

      {
        name: "Source",
        type: "STRING"
      },

      {
        name: "Timestamp",
        type: "DATETIME"
      },

      {
        name: "CreatedAt",
        type: "DATETIME"
      }

    ],

    relations: {

      UserID: {
        entity: "USER",
        type: "MANY_TO_ONE"
      }

    },

    events: {}

  },


  // ============================================================
  // VERSION
  // ============================================================

  VERSION: {

    entity: "VERSION",

    table: "Versions",

    idField: "VersionID",

    idPrefix: "VER",

    module: "versioning",

    version: 1,

    softDelete: false,

    timestamps: true,

    audit: false,

    versioning: false,

    immutable: true,

    appendOnly: true,

    fields: [

      {
        name: "VersionID",
        type: "ID",
        required: true
      },

      {
        name: "Entity",
        type: "STRING",
        required: true
      },

      {
        name: "EntityID",
        type: "STRING",
        required: true
      },

      {
        name: "Version",
        type: "NUMBER",
        required: true
      },

      {
        name: "Data",
        type: "JSON"
      },

      {
        name: "Action",
        type: "STRING"
      },

      {
        name: "UserID",
        type: "REFERENCE"
      },

      {
        name: "CreatedAt",
        type: "DATETIME"
      }

    ],

    relations: {

      UserID: {
        entity: "USER",
        type: "MANY_TO_ONE"
      }

    },

    events: {}

  },


  // ============================================================
  // KPI
  // ============================================================

  KPI: {

    entity: "KPI",

    table: "KPIMetrics",

    idField: "KPIID",

    idPrefix: "KPI",

    module: "analytics",

    version: 1,

    softDelete: true,

    timestamps: true,

    audit: true,

    versioning: false,

    fields: [

      {
        name: "KPIID",
        type: "ID",
        required: true
      },

      {
        name: "OrganizationID",
        type: "REFERENCE"
      },

      {
        name: "Entity",
        type: "STRING"
      },

      {
        name: "EntityID",
        type: "STRING"
      },

      {
        name: "Metric",
        type: "STRING",
        required: true
      },

      {
        name: "Value",
        type: "NUMBER",
        default: 0
      },

      {
        name: "Period",
        type: "STRING"
      },

      {
        name: "CalculatedAt",
        type: "DATETIME"
      },

      {
        name: "CreatedAt",
        type: "DATETIME"
      },

      {
        name: "UpdatedAt",
        type: "DATETIME"
      },

      {
        name: "Deleted",
        type: "BOOLEAN",
        default: false
      }

    ],

    relations: {

      OrganizationID: {
        entity: "ORGANIZATION",
        type: "MANY_TO_ONE"
      }

    },

    events: {

      created: "KPI_CREATED",

      updated: "KPI_UPDATED",

      deleted: "KPI_DELETED",

      restored: "KPI_RESTORED"

    }

  },


  // ============================================================
  // TRANSPORT ORDER
  // ============================================================

  TRANSPORT_ORDER: {

    entity: "TRANSPORT_ORDER",

    table: "TransportOrders",

    idField: "TransportOrderID",

    idPrefix: "TOR",

    module: "transport",

    version: 1,

    softDelete: true,

    timestamps: true,

    audit: true,

    versioning: true,

    fields: [

      {
        name: "TransportOrderID",
        type: "ID",
        required: true
      },

      {
        name: "OrganizationID",
        type: "REFERENCE",
        required: true
      },

      {
        name: "ClientID",
        type: "REFERENCE"
      },

      {
        name: "RouteID",
        type: "REFERENCE"
      },

      {
        name: "CargoID",
        type: "REFERENCE"
      },

      {
        name: "LoadingPoint",
        type: "STRING"
      },

      {
        name: "UnloadingPoint",
        type: "STRING"
      },

      {
        name: "PlannedLoadingDate",
        type: "DATETIME"
      },

      {
        name: "PlannedUnloadingDate",
        type: "DATETIME"
      },

      {
        name: "Price",
        type: "NUMBER",
        default: 0
      },

      {
        name: "Status",
        type: "ENUM",
        default: "NEW"
      },

      {
        name: "CreatedAt",
        type: "DATETIME"
      },

      {
        name: "UpdatedAt",
        type: "DATETIME"
      },

      {
        name: "Deleted",
        type: "BOOLEAN",
        default: false
      }

    ],

    relations: {

      OrganizationID: {
        entity: "ORGANIZATION",
        type: "MANY_TO_ONE"
      },

      ClientID: {
        entity: "CLIENT",
        type: "MANY_TO_ONE"
      },

      RouteID: {
        entity: "ROUTE",
        type: "MANY_TO_ONE"
      },

      CargoID: {
        entity: "CARGO",
        type: "MANY_TO_ONE"
      }

    },

    events: {

      created: "TRANSPORT_ORDER_CREATED",

      updated: "TRANSPORT_ORDER_UPDATED",

      deleted: "TRANSPORT_ORDER_DELETED",

      restored: "TRANSPORT_ORDER_RESTORED",

      statusChanged: "TRANSPORT_ORDER_STATUS_CHANGED"

    }

  },


  // ============================================================
  // CARRIER
  // ============================================================

  CARRIER: {

    entity: "CARRIER",

    table: "Carriers",

    idField: "CarrierID",

    idPrefix: "CAR",

    module: "transport",

    version: 1,

    softDelete: true,

    timestamps: true,

    audit: true,

    versioning: true,

    fields: [

      {
        name: "CarrierID",
        type: "ID",
        required: true
      },

      {
        name: "OrganizationID",
        type: "REFERENCE"
      },

      {
        name: "Name",
        type: "STRING",
        required: true
      },

      {
        name: "INN",
        type: "STRING",
        unique: true
      },

      {
        name: "Phone",
        type: "STRING"
      },

      {
        name: "Email",
        type: "STRING"
      },

      {
        name: "Status",
        type: "ENUM",
        default: "ACTIVE"
      },

      {
        name: "CreatedAt",
        type: "DATETIME"
      },

      {
        name: "UpdatedAt",
        type: "DATETIME"
      },

      {
        name: "Deleted",
        type: "BOOLEAN",
        default: false
      }

    ],

    relations: {

      OrganizationID: {
        entity: "ORGANIZATION",
        type: "MANY_TO_ONE"
      }

    },

    events: {

      created: "CARRIER_CREATED",

      updated: "CARRIER_UPDATED",

      deleted: "CARRIER_DELETED",

      restored: "CARRIER_RESTORED"

    }

  },


  // ============================================================
  // DRIVER
  // ============================================================

  DRIVER: {

    entity: "DRIVER",

    table: "Drivers",

    idField: "DriverID",

    idPrefix: "DRV",

    module: "transport",

    version: 1,

    softDelete: true,

    timestamps: true,

    audit: true,

    versioning: true,

    fields: [

      {
        name: "DriverID",
        type: "ID",
        required: true
      },

      {
        name: "OrganizationID",
        type: "REFERENCE"
      },

      {
        name: "CarrierID",
        type: "REFERENCE"
      },

      {
        name: "Name",
        type: "STRING",
        required: true
      },

      {
        name: "Phone",
        type: "STRING"
      },

      {
        name: "LicenseNumber",
        type: "STRING"
      },

      {
        name: "Status",
        type: "ENUM",
        default: "ACTIVE"
      },

      {
        name: "CreatedAt",
        type: "DATETIME"
      },

      {
        name: "UpdatedAt",
        type: "DATETIME"
      },

      {
        name: "Deleted",
        type: "BOOLEAN",
        default: false
      }

    ],

    relations: {

      OrganizationID: {
        entity: "ORGANIZATION",
        type: "MANY_TO_ONE"
      },

      CarrierID: {
        entity: "CARRIER",
        type: "MANY_TO_ONE"
      }

    },

    events: {

      created: "DRIVER_CREATED",

      updated: "DRIVER_UPDATED",

      deleted: "DRIVER_DELETED",

      restored: "DRIVER_RESTORED"

    }

  },


  // ============================================================
  // VEHICLE
  // ============================================================

  VEHICLE: {

    entity: "VEHICLE",

    table: "Vehicles",

    idField: "VehicleID",

    idPrefix: "VEH",

    module: "transport",

    version: 1,

    softDelete: true,

    timestamps: true,

    audit: true,

    versioning: true,

    fields: [

      {
        name: "VehicleID",
        type: "ID",
        required: true
      },

      {
        name: "OrganizationID",
        type: "REFERENCE"
      },

      {
        name: "CarrierID",
        type: "REFERENCE"
      },

      {
        name: "RegistrationNumber",
        type: "STRING",
        required: true,
        unique: true
      },

      {
        name: "Brand",
        type: "STRING"
      },

      {
        name: "Model",
        type: "STRING"
      },

      {
        name: "VehicleType",
        type: "ENUM"
      },

      {
        name: "Status",
        type: "ENUM",
        default: "ACTIVE"
      },

      {
        name: "CreatedAt",
        type: "DATETIME"
      },

      {
        name: "UpdatedAt",
        type: "DATETIME"
      },

      {
        name: "Deleted",
        type: "BOOLEAN",
        default: false
      }

    ],

    relations: {

      OrganizationID: {
        entity: "ORGANIZATION",
        type: "MANY_TO_ONE"
      },

      CarrierID: {
        entity: "CARRIER",
        type: "MANY_TO_ONE"
      }

    },

    events: {

      created: "VEHICLE_CREATED",

      updated: "VEHICLE_UPDATED",

      deleted: "VEHICLE_DELETED",

      restored: "VEHICLE_RESTORED"

    }

  },


  // ============================================================
  // ROUTE
  // ============================================================

  ROUTE: {

    entity: "ROUTE",

    table: "Routes",

    idField: "RouteID",

    idPrefix: "RTE",

    module: "transport",

    version: 1,

    softDelete: true,

    timestamps: true,

    audit: true,

    versioning: true,

    fields: [

      {
        name: "RouteID",
        type: "ID",
        required: true
      },

      {
        name: "OrganizationID",
        type: "REFERENCE"
      },

      {
        name: "Name",
        type: "STRING"
      },

      {
        name: "LoadingPoint",
        type: "STRING",
        required: true
      },

      {
        name: "UnloadingPoint",
        type: "STRING",
        required: true
      },

      {
        name: "Distance",
        type: "NUMBER",
        default: 0
      },

      {
        name: "PlannedDuration",
        type: "NUMBER",
        default: 0
      },

      {
        name: "Status",
        type: "ENUM",
        default: "ACTIVE"
      },

      {
        name: "CreatedAt",
        type: "DATETIME"
      },

      {
        name: "UpdatedAt",
        type: "DATETIME"
      },

      {
        name: "Deleted",
        type: "BOOLEAN",
        default: false
      }

    ],

    relations: {

      OrganizationID: {
        entity: "ORGANIZATION",
        type: "MANY_TO_ONE"
      }

    },

    events: {

      created: "ROUTE_CREATED",

      updated: "ROUTE_UPDATED",

      deleted: "ROUTE_DELETED",

      restored: "ROUTE_RESTORED"

    }

  },


  // ============================================================
  // CARGO
  // ============================================================

  CARGO: {

    entity: "CARGO",

    table: "Cargoes",

    idField: "CargoID",

    idPrefix: "CRG",

    module: "transport",

    version: 1,

    softDelete: true,

    timestamps: true,

    audit: true,

    versioning: true,

    fields: [

      {
        name: "CargoID",
        type: "ID",
        required: true
      },

      {
        name: "OrganizationID",
        type: "REFERENCE"
      },

      {
        name: "Name",
        type: "STRING",
        required: true
      },

      {
        name: "CargoType",
        type: "ENUM"
      },

      {
        name: "Weight",
        type: "NUMBER",
        default: 0
      },

      {
        name: "Volume",
        type: "NUMBER",
        default: 0
      },

      {
        name: "Description",
        type: "STRING"
      },

      {
        name: "Status",
        type: "ENUM",
        default: "ACTIVE"
      },

      {
        name: "CreatedAt",
        type: "DATETIME"
      },

      {
        name: "UpdatedAt",
        type: "DATETIME"
      },

      {
        name: "Deleted",
        type: "BOOLEAN",
        default: false
      }

    ],

    relations: {

      OrganizationID: {
        entity: "ORGANIZATION",
        type: "MANY_TO_ONE"
      }

    },

    events: {

      created: "CARGO_CREATED",

      updated: "CARGO_UPDATED",

      deleted: "CARGO_DELETED",

      restored: "CARGO_RESTORED"

    }

  }

};


// ============================================================
// INTERNAL HELPERS
// ============================================================

EntityMetadata._isDefinition = function (value) {

  return !!(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    value.entity &&
    value.table &&
    Array.isArray(value.fields)
  );

};


EntityMetadata._clone = function (value) {

  if (
    value === undefined ||
    value === null
  ) {
    return value;
  }

  return JSON.parse(
    JSON.stringify(value)
  );

};


EntityMetadata._normalizeEntityName = function (entity) {

  if (
    entity &&
    typeof entity === "object"
  ) {

    entity =
      entity.entity ||
      entity.name ||
      entity.code ||
      null;

  }

  if (
    entity === undefined ||
    entity === null
  ) {
    return "";
  }

  return String(entity)
    .trim()
    .toUpperCase();

};


EntityMetadata._normalizeDefinition = function (definition) {

  const normalized =
    this._clone(definition || {});

  normalized.entity =
    this._normalizeEntityName(
      normalized.entity
    );

  if (!normalized.entity) {
    throw new Error(
      "EntityMetadata: entity required"
    );
  }

  if (!normalized.table) {
    normalized.table =
      normalized.entity + "s";
  }

  if (!normalized.idField) {
    normalized.idField =
      normalized.entity + "ID";
  }

  if (!normalized.idPrefix) {
    normalized.idPrefix =
      normalized.entity
        .replace(/[^A-Z0-9]/g, "")
        .substring(0, 3);
  }

  if (!normalized.module) {
    normalized.module = "core";
  }

  if (
    normalized.version === undefined
  ) {
    normalized.version = 1;
  }

  if (
    normalized.softDelete === undefined
  ) {
    normalized.softDelete = true;
  }

  if (
    normalized.timestamps === undefined
  ) {
    normalized.timestamps = true;
  }

  if (
    normalized.audit === undefined
  ) {
    normalized.audit = true;
  }

  if (
    normalized.versioning === undefined
  ) {
    normalized.versioning = true;
  }

  if (!Array.isArray(normalized.fields)) {
    normalized.fields = [];
  }

  if (
    !normalized.relations ||
    typeof normalized.relations !== "object" ||
    Array.isArray(normalized.relations)
  ) {
    normalized.relations = {};
  }

  if (
    !normalized.permissions ||
    typeof normalized.permissions !== "object" ||
    Array.isArray(normalized.permissions)
  ) {
    normalized.permissions = {};
  }

  if (
    !normalized.events ||
    typeof normalized.events !== "object" ||
    Array.isArray(normalized.events)
  ) {
    normalized.events = {};
  }

  if (
    !normalized.hooks ||
    typeof normalized.hooks !== "object" ||
    Array.isArray(normalized.hooks)
  ) {
    normalized.hooks = {};
  }

  if (!Array.isArray(normalized.indexes)) {
    normalized.indexes = [];
  }

  return normalized;

};


// ============================================================
// GET
// ============================================================

EntityMetadata.get = function (entity) {

  const entityName =
    this._normalizeEntityName(entity);

  if (!entityName) {
    return null;
  }

  return this[entityName] || null;

};


// ============================================================
// REQUIRE
// ============================================================

EntityMetadata.require = function (entity) {

  const entityName =
    this._normalizeEntityName(entity);

  const metadata =
    this.get(entityName);

  if (!metadata) {

    throw new Error(
      "EntityMetadata not found: " +
      entityName
    );

  }

  return metadata;

};


// ============================================================
// HAS
// ============================================================

EntityMetadata.has = function (entity) {

  return !!this.get(entity);

};


// ============================================================
// REGISTER
// ============================================================

EntityMetadata.register = function (
  definition,
  options = {}
) {

  if (this.locked) {

    throw new Error(
      "EntityMetadata is locked"
    );

  }

  const normalized =
    this._normalizeDefinition(
      definition
    );

  const entity =
    normalized.entity;

  if (
    this[entity] &&
    options.overwrite !== true
  ) {

    if (
      options.silent === true
    ) {
      return this[entity];
    }

    throw new Error(
      "EntityMetadata already registered: " +
      entity
    );

  }

  if (
    this[entity] &&
    options.overwrite === true
  ) {

    Logger.warn(
      "EntityMetadata overwrite " +
      entity
    );

  }

  this[entity] =
    normalized;

  if (options.silent !== true) {

    Logger.log(
      "EntityMetadata REGISTERED " +
      entity
    );

  }

  return normalized;

};


// ============================================================
// REGISTER MANY
// ============================================================

EntityMetadata.registerMany = function (
  definitions,
  options = {}
) {

  if (!Array.isArray(definitions)) {

    throw new Error(
      "EntityMetadata.registerMany: array required"
    );

  }

  return definitions.map(
    definition =>
      this.register(
        definition,
        options
      )
  );

};


// ============================================================
// UNREGISTER
// ============================================================

EntityMetadata.unregister = function (entity) {

  if (this.locked) {

    throw new Error(
      "EntityMetadata is locked"
    );

  }

  const entityName =
    this._normalizeEntityName(entity);

  if (!this[entityName]) {
    return false;
  }

  delete this[entityName];

  Logger.log(
    "EntityMetadata UNREGISTERED " +
    entityName
  );

  return true;

};


// ============================================================
// LIST
// ============================================================

EntityMetadata.list = function () {

  return Object.keys(this)
    .map(key => this[key])
    .filter(
      item => this._isDefinition(item)
    );

};


// ============================================================
// ENTITY NAMES
// ============================================================

EntityMetadata.entities = function () {

  return this.list()
    .map(meta => meta.entity);

};


// ============================================================
// FIND TABLE
// ============================================================

EntityMetadata.getByTable = function (table) {

  if (!table) {
    return null;
  }

  const tableName =
    String(table).trim();

  return this.list()
    .find(
      meta =>
        meta.table === tableName
    ) || null;

};


// ============================================================
// FIND BY MODULE
// ============================================================

EntityMetadata.getByModule = function (moduleName) {

  if (!moduleName) {
    return [];
  }

  return this.list()
    .filter(
      meta =>
        meta.module === moduleName
    );

};


// ============================================================
// FIELD
// ============================================================

EntityMetadata.getField = function (
  entity,
  fieldName
) {

  const meta =
    this.get(entity);

  if (
    !meta ||
    !Array.isArray(meta.fields)
  ) {
    return null;
  }

  return meta.fields.find(
    field =>
      field &&
      field.name === fieldName
  ) || null;

};


// ============================================================
// RELATION
// ============================================================

EntityMetadata.getRelation = function (
  entity,
  fieldName
) {

  const meta =
    this.get(entity);

  if (
    !meta ||
    !meta.relations
  ) {
    return null;
  }

  return meta.relations[fieldName] || null;

};


// ============================================================
// TEST ENTITY REGISTRATION
// ============================================================

EntityMetadata.registerTestEntity = function (
  entity,
  sourceMeta = {}
) {

  const entityName =
    this._normalizeEntityName(entity);

  if (
    !entityName.startsWith("__TEST_")
  ) {

    throw new Error(
      "EntityMetadata.registerTestEntity: " +
      "only __TEST_ entities are allowed"
    );

  }

  if (this.has(entityName)) {
    return this.get(entityName);
  }

  if (
    this.allowTestEntityRegistration !== true
  ) {

    throw new Error(
      "Test entity registration disabled: " +
      entityName
    );

  }

  const idField =
    sourceMeta.idField ||
    entityName + "ID";

  const definition = {

    entity: entityName,

    table:
      sourceMeta.table ||
      entityName,

    idField,

    idPrefix:
      sourceMeta.idPrefix ||
      "TST",

    module: "test",

    version: 1,

    system: true,

    test: true,

    softDelete: true,

    timestamps: true,

    audit: false,

    versioning: false,

    fields: [

      {
        name: idField,
        type: "ID",
        required: true
      },

      {
        name: "Name",
        type: "STRING"
      },

      {
        name: "Value",
        type: "STRING"
      },

      {
        name: "CreatedAt",
        type: "DATETIME"
      },

      {
        name: "UpdatedAt",
        type: "DATETIME"
      },

      {
        name: "Deleted",
        type: "BOOLEAN",
        default: false
      }

    ],

    relations: {},

    events: {}

  };

  Logger.log(
    "EntityMetadata SYSTEM REGISTER " +
    entityName
  );

  return this.register(
    definition,
    {
      silent: true
    }
  );

};


// ============================================================
// COMPARE WITH ENTITY REGISTRY
// ============================================================

EntityMetadata.compareWithRegistry = function (
  options = {}
) {

  const result = {

    available: false,

    registryEntities: [],

    metadataEntities:
      this.entities(),

    missingMetadata: [],

    orphanMetadata: [],

    registeredTestEntities: []

  };

  if (
    typeof EntityRegistry === "undefined" ||
    typeof EntityRegistry.list !== "function"
  ) {
    return result;
  }

  result.available = true;

  const registryEntities =
    EntityRegistry.list()
      .map(entity =>
        this._normalizeEntityName(entity)
      )
      .filter(Boolean);

  result.registryEntities =
    registryEntities;

  registryEntities.forEach(entity => {

    if (this.has(entity)) {
      return;
    }

    if (
      entity.startsWith("__TEST_") &&
      options.registerTestEntities !== false
    ) {

      let sourceMeta = {};

      try {

        if (
          typeof EntityRegistry.get === "function"
        ) {

          sourceMeta =
            EntityRegistry.get(entity) ||
            {};

        }

      } catch (error) {

        sourceMeta = {};

      }

      this.registerTestEntity(
        entity,
        sourceMeta
      );

      result.registeredTestEntities.push(
        entity
      );

      return;
    }

    result.missingMetadata.push(
      entity
    );

  });

  const registrySet =
    new Set(registryEntities);

  this.entities()
    .forEach(entity => {

      if (
        !registrySet.has(entity) &&
        !["ORGANIZATION", "USER"].includes(entity)
      ) {

        result.orphanMetadata.push(
          entity
        );

      }

    });

  return result;

};


// ============================================================
// BACKWARD COMPATIBILITY
// ============================================================

EntityMetadata.syncFromRegistry = function (
  options = {}
) {

  const comparison =
    this.compareWithRegistry({
      registerTestEntities:
        options.registerTestEntities !== false
    });

  if (
    comparison.missingMetadata.length
  ) {

    const message =
      "EntityMetadata missing definitions: " +
      comparison.missingMetadata.join(", ");

    if (
      options.throwOnMissing === true ||
      this.strictMode === true
    ) {

      throw new Error(message);

    }

    Logger.warn(message);

  }

  return comparison;

};


// ============================================================
// VALIDATE FIELD DEFINITIONS
// ============================================================

EntityMetadata.validateFields = function (
  meta
) {

  const errors = [];

  const fieldNames =
    new Set();

  meta.fields.forEach(
    (field, index) => {

      if (
        !field ||
        typeof field !== "object"
      ) {

        errors.push(
          meta.entity +
          " field #" +
          index +
          " invalid"
        );

        return;
      }

      if (!field.name) {

        errors.push(
          meta.entity +
          " field #" +
          index +
          " missing name"
        );

        return;
      }

      if (fieldNames.has(field.name)) {

        errors.push(
          meta.entity +
          " duplicate field " +
          field.name
        );

      }

      fieldNames.add(field.name);

      if (!field.type) {

        errors.push(
          meta.entity +
          "." +
          field.name +
          " missing type"
        );

      }

    }
  );

  if (!fieldNames.has(meta.idField)) {

    errors.push(
      meta.entity +
      " idField not found in fields: " +
      meta.idField
    );

  }

  if (
    meta.timestamps === true
  ) {

    if (!fieldNames.has("CreatedAt")) {

      errors.push(
        meta.entity +
        " timestamps enabled but CreatedAt missing"
      );

    }

    if (
      !meta.immutable &&
      !fieldNames.has("UpdatedAt")
    ) {

      errors.push(
        meta.entity +
        " timestamps enabled but UpdatedAt missing"
      );

    }

  }

  if (
    meta.softDelete === true &&
    !fieldNames.has("Deleted")
  ) {

    errors.push(
      meta.entity +
      " softDelete enabled but Deleted missing"
    );

  }

  return errors;

};


// ============================================================
// VALIDATE RELATIONS
// ============================================================

EntityMetadata.validateRelations = function (
  meta,
  options = {}
) {

  const errors = [];

  const warnings = [];

  const relations =
    meta.relations || {};

  Object.keys(relations)
    .forEach(fieldName => {

      const relation =
        relations[fieldName];

      if (
        !relation ||
        !relation.entity
      ) {

        errors.push(
          meta.entity +
          "." +
          fieldName +
          " invalid relation"
        );

        return;
      }

      if (
        !this.getField(
          meta.entity,
          fieldName
        )
      ) {

        errors.push(
          meta.entity +
          " relation field missing: " +
          fieldName
        );

      }

      if (
        !this.has(relation.entity)
      ) {

        const message =
          meta.entity +
          "." +
          fieldName +
          " references missing entity " +
          relation.entity;

        if (
          options.strictRelations === true
        ) {
          errors.push(message);
        } else {
          warnings.push(message);
        }

      }

    });

  return {
    errors,
    warnings
  };

};


// ============================================================
// VALIDATE UNIQUENESS
// ============================================================

EntityMetadata.validateUniqueness = function () {

  const errors = [];

  const entityMap =
    new Map();

  const tableMap =
    new Map();

  this.list()
    .forEach(meta => {

      if (entityMap.has(meta.entity)) {

        errors.push(
          "Duplicate entity: " +
          meta.entity
        );

      }

      entityMap.set(
        meta.entity,
        true
      );

      if (tableMap.has(meta.table)) {

        errors.push(
          "Duplicate table " +
          meta.table +
          ": " +
          tableMap.get(meta.table) +
          ", " +
          meta.entity
        );

      } else {

        tableMap.set(
          meta.table,
          meta.entity
        );

      }

    });

  return errors;

};


// ============================================================
// VALIDATE
// ============================================================

EntityMetadata.validate = function (
  options = {}
) {

  const errors = [];

  const warnings = [];

  const definitions =
    this.list();

  definitions.forEach(meta => {

    if (!meta.entity) {

      errors.push(
        "Metadata missing entity"
      );

    }

    if (!meta.table) {

      errors.push(
        meta.entity +
        " missing table"
      );

    }

    if (!meta.idField) {

      errors.push(
        meta.entity +
        " missing idField"
      );

    }

    if (
      !Array.isArray(meta.fields) ||
      !meta.fields.length
    ) {

      errors.push(
        meta.entity +
        " has no fields"
      );

      return;
    }

    errors.push(
      ...this.validateFields(meta)
    );

    const relationValidation =
      this.validateRelations(
        meta,
        options
      );

    errors.push(
      ...relationValidation.errors
    );

    warnings.push(
      ...relationValidation.warnings
    );

  });

  errors.push(
    ...this.validateUniqueness()
  );

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    entityCount: definitions.length
  };

};


// ============================================================
// INITIALIZE
// ============================================================

EntityMetadata.init = function (
  options = {}
) {

  if (
    this.initialized &&
    options.force !== true
  ) {

    return this.health();

  }

  Logger.log(
    "EntityMetadata INIT v" +
    this.version
  );

  let registryComparison = null;

  if (
    options.compareRegistry !== false &&
    typeof EntityRegistry !== "undefined"
  ) {

    registryComparison =
      this.compareWithRegistry({
        registerTestEntities:
          options.registerTestEntities !== false
      });

    if (
      registryComparison.missingMetadata.length
    ) {

      const message =
        "EntityMetadata missing definitions: " +
        registryComparison
          .missingMetadata
          .join(", ");

      if (
        options.strict !== false &&
        this.strictMode === true
      ) {

        throw new Error(message);

      }

      Logger.warn(message);

    }

  }

  const validation =
    this.validate({
      strictRelations:
        options.strictRelations === true
    });

  if (!validation.valid) {

    throw new Error(
      "EntityMetadata validation failed: " +
      validation.errors.join("; ")
    );

  }

  this.initialized = true;

  if (options.lock === true) {
    this.lock();
  }

  Logger.log(
    "EntityMetadata INITIALIZED entities=" +
    validation.entityCount
  );

  return {
    version: this.version,
    initialized: true,
    entityCount:
      validation.entityCount,
    registryComparison,
    warnings:
      validation.warnings
  };

};


// ============================================================
// LOCK
// ============================================================

EntityMetadata.lock = function () {

  if (this.locked) {
    return true;
  }

  this.list()
    .forEach(meta => {

      if (Array.isArray(meta.fields)) {

        meta.fields.forEach(field => {
          Object.freeze(field);
        });

        Object.freeze(meta.fields);

      }

      if (
        meta.relations &&
        typeof meta.relations === "object"
      ) {

        Object.keys(meta.relations)
          .forEach(key => {

            const relation =
              meta.relations[key];

            if (
              relation &&
              typeof relation === "object"
            ) {
              Object.freeze(relation);
            }

          });

        Object.freeze(meta.relations);

      }

      if (
        meta.permissions &&
        typeof meta.permissions === "object"
      ) {
        Object.freeze(
          meta.permissions
        );
      }

      if (
        meta.events &&
        typeof meta.events === "object"
      ) {
        Object.freeze(
          meta.events
        );
      }

      if (
        meta.hooks &&
        typeof meta.hooks === "object"
      ) {
        Object.freeze(
          meta.hooks
        );
      }

      Object.freeze(meta);

    });

  this.locked = true;

  Logger.log(
    "EntityMetadata LOCKED"
  );

  return true;

};


// ============================================================
// UNLOCK
// ============================================================

EntityMetadata.unlock = function () {

  /*
   * Object.freeze необратим.
   * Метод оставлен для явного контракта.
   */

  throw new Error(
    "EntityMetadata.unlock is not supported; " +
    "reload project to rebuild metadata"
  );

};


// ============================================================
// DIAGNOSTICS
// ============================================================

EntityMetadata.diagnostics = function () {

  const validation =
    this.validate();

  let registryComparison = null;

  try {

    registryComparison =
      this.compareWithRegistry({
        registerTestEntities: false
      });

  } catch (error) {

    registryComparison = {
      available: false,
      error: error.message
    };

  }

  const definitions =
    this.list();

  return {

    version:
      this.version,

    architecture:
      this.architecture,

    initialized:
      this.initialized,

    locked:
      this.locked,

    strictMode:
      this.strictMode,

    entityCount:
      definitions.length,

    entities:
      definitions.map(
        meta => meta.entity
      ),

    tables:
      definitions.map(
        meta => meta.table
      ),

    modules:
      Array.from(
        new Set(
          definitions.map(
            meta => meta.module
          )
        )
      ),

    validation: {

      valid:
        validation.valid,

      errors:
        validation.errors,

      warnings:
        validation.warnings

    },

    registry:
      registryComparison,

    timestamp:
      new Date().toISOString()

  };

};


// ============================================================
// HEALTH
// ============================================================

EntityMetadata.health = function () {

  const diagnostics =
    this.diagnostics();

  let status = "OK";

  if (
    !diagnostics.validation.valid
  ) {
    status = "ERROR";
  } else if (
    diagnostics.registry &&
    Array.isArray(
      diagnostics.registry.missingMetadata
    ) &&
    diagnostics.registry.missingMetadata.length
  ) {
    status = "WARNING";
  }

  const details = {

    version:
      this.version,

    architecture:
      this.architecture,

    initialized:
      this.initialized,

    locked:
      this.locked,

    entityCount:
      diagnostics.entityCount,

    entities:
      diagnostics.entities,

    modules:
      diagnostics.modules,

    validation:
      diagnostics.validation,

    registry:
      diagnostics.registry,

    features: [

      "StaticMetadata",

      "StrictRegistryValidation",

      "ControlledTestEntities",

      "FieldValidation",

      "RelationValidation",

      "DuplicateDetection",

      "BaseRepositoryV5Compatibility",

      "SchemaRegistryCompatibility",

      "Diagnostics",

      "OptionalLock"

    ]

  };

  if (
    typeof HealthContract !== "undefined" &&
    typeof HealthContract.create === "function"
  ) {

    return HealthContract.create(
      "EntityMetadata",
      status,
      details
    );

  }

  return {

    module: "EntityMetadata",

    status,

    ...details

  };

};


// ============================================================
// EXPORT
// ============================================================

globalThis.EntityMetadata =
  EntityMetadata;


// ============================================================
// READY
// ============================================================

Logger.log(
  "EntityMetadata READY v" +
  EntityMetadata.version +
  " definitions=" +
  EntityMetadata.list().length
);