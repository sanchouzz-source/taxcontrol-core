console.log("EntityMetadata");

const EntityMetadata = {
  version: "0.9.0",

  // ----- МЕТАДАННЫЕ СУЩНОСТЕЙ (только структура таблицы) -----
  CLIENT: {
    entity: "CLIENT",
    table: "Clients",
    idField: "ClientID",
    idPrefix: "CLIENT",
    version: 1,
    softDelete: true,
    timestamps: true,
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
      { name: "INN", type: "STRING", unique: true, length: 12, format: "INN" },
      { name: "Phone", type: "STRING", format: "PHONE" },
      { name: "Email", type: "STRING", unique: true, format: "EMAIL" },
      { name: "Address", type: "STRING" },
      { name: "ManagerID", type: "REFERENCE" },
      { name: "Rating", type: "NUMBER", precision: 1 },
      { name: "Status", type: "ENUM", default: "ACTIVE" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN" }
    ],
    relations: {
      OrganizationID: { entity: "ORGANIZATION", type: "MANY_TO_ONE" },
      ManagerID: { entity: "USER", type: "MANY_TO_ONE" }
    },
    indexes: { unique: ["INN", "Email"], search: ["Name", "Phone", "Status"] },
    audit: { enabled: true, fields: ["Name", "Phone", "Email", "Status"] }
  },

  // ... (остальные сущности аналогично, с idField, softDelete, timestamps)

  // ----- НОВЫЕ СИСТЕМНЫЕ СУЩНОСТИ -----
  ORGANIZATION: {
    entity: "ORGANIZATION",
    table: "Organizations",
    idField: "OrganizationID",
    idPrefix: "ORG",
    version: 1,
    softDelete: true,
    timestamps: true,
    fields: [
      { name: "OrganizationID", type: "ID", required: true },
      { name: "Name", type: "STRING", required: true },
      { name: "INN", type: "STRING", unique: true, length: 12, format: "INN" },
      { name: "Status", type: "ENUM", default: "ACTIVE" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN" }
    ],
    relations: {},
    indexes: { unique: ["INN"], search: ["Name"] },
    audit: { enabled: true, fields: ["Name", "INN", "Status"] }
  },

  USER: {
    entity: "USER",
    table: "Users",
    idField: "UserID",
    idPrefix: "USR",
    version: 1,
    softDelete: true,
    timestamps: true,
    fields: [
      { name: "UserID", type: "ID", required: true },
      { name: "OrganizationID", type: "REFERENCE", required: true },
      { name: "Name", type: "STRING", required: true },
      { name: "Email", type: "STRING", unique: true, format: "EMAIL" },
      { name: "RoleID", type: "REFERENCE" },
      { name: "Status", type: "ENUM", default: "ACTIVE" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN" }
    ],
    relations: {
      OrganizationID: { entity: "ORGANIZATION", type: "MANY_TO_ONE" },
      RoleID: { entity: "ROLE", type: "MANY_TO_ONE" }
    },
    indexes: { unique: ["Email"], search: ["Name", "RoleID", "Status"] },
    audit: { enabled: true, fields: ["Name", "Email", "RoleID", "Status"] }
  },

  ROLE: {
    entity: "ROLE",
    table: "Roles",
    idField: "RoleID",
    idPrefix: "ROL",
    version: 1,
    softDelete: true,
    timestamps: true,
    fields: [
      { name: "RoleID", type: "ID", required: true },
      { name: "Name", type: "STRING", required: true, unique: true },
      { name: "Description", type: "STRING" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN" }
    ],
    relations: {},
    indexes: { unique: ["Name"], search: ["Name"] },
    audit: { enabled: true, fields: ["Name", "Description"] }
  },

  PERMISSION: {
    entity: "PERMISSION",
    table: "Permissions",
    idField: "PermissionID",
    idPrefix: "PRM",
    version: 1,
    softDelete: true,
    timestamps: true,
    fields: [
      { name: "PermissionID", type: "ID", required: true },
      { name: "Name", type: "STRING", required: true, unique: true },
      { name: "Resource", type: "STRING", required: true },
      { name: "Action", type: "STRING", required: true },
      { name: "Description", type: "STRING" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN" }
    ],
    relations: {},
    indexes: { unique: ["Name"], search: ["Resource", "Action"] },
    audit: { enabled: true, fields: ["Name", "Resource", "Action"] }
  },

  // ----- ДОПОЛНИТЕЛЬНЫЕ ERP-СУЩНОСТИ -----
  ORGANIZATION_SETTINGS: {
    entity: "ORGANIZATION_SETTINGS",
    table: "OrganizationSettings",
    idField: "SettingID",
    idPrefix: "SET",
    version: 1,
    softDelete: false,
    timestamps: true,
    fields: [
      { name: "SettingID", type: "ID", required: true },
      { name: "OrganizationID", type: "REFERENCE", required: true },
      { name: "Currency", type: "STRING", default: "RUB" },
      { name: "Timezone", type: "STRING", default: "Europe/Moscow" },
      { name: "TaxSystem", type: "STRING" },
      { name: "DefaultWarehouse", type: "REFERENCE" },
      { name: "FileStorage", type: "STRING" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" }
    ],
    relations: {
      OrganizationID: { entity: "ORGANIZATION", type: "MANY_TO_ONE" }
    },
    indexes: { unique: ["OrganizationID"] },
    audit: { enabled: false }
  },

  FILES: {
    entity: "FILES",
    table: "Files",
    idField: "FileID",
    idPrefix: "FIL",
    version: 1,
    softDelete: true,
    timestamps: true,
    fields: [
      { name: "FileID", type: "ID", required: true },
      { name: "OrganizationID", type: "REFERENCE", required: true },
      { name: "Entity", type: "STRING", required: true },
      { name: "EntityID", type: "STRING", required: true },
      { name: "Name", type: "STRING", required: true },
      { name: "Url", type: "STRING" },
      { name: "Size", type: "NUMBER" },
      { name: "MimeType", type: "STRING" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN" }
    ],
    relations: {
      OrganizationID: { entity: "ORGANIZATION", type: "MANY_TO_ONE" }
    },
    indexes: { search: ["Entity", "EntityID", "Name"] },
    audit: { enabled: true, fields: ["Name", "Entity"] }
  },

  COMMENTS: {
    entity: "COMMENTS",
    table: "Comments",
    idField: "CommentID",
    idPrefix: "CMT",
    version: 1,
    softDelete: true,
    timestamps: true,
    fields: [
      { name: "CommentID", type: "ID", required: true },
      { name: "OrganizationID", type: "REFERENCE", required: true },
      { name: "Entity", type: "STRING", required: true },
      { name: "EntityID", type: "STRING", required: true },
      { name: "Text", type: "STRING", required: true },
      { name: "AuthorID", type: "REFERENCE" },
      { name: "CreatedAt", type: "DATETIME" },
      { name: "UpdatedAt", type: "DATETIME" },
      { name: "Deleted", type: "BOOLEAN" }
    ],
    relations: {
      OrganizationID: { entity: "ORGANIZATION", type: "MANY_TO_ONE" },
      AuthorID: { entity: "USER", type: "MANY_TO_ONE" }
    },
    indexes: { search: ["Entity", "EntityID"] },
    audit: { enabled: true, fields: ["Text", "Entity"] }
  }
};

// ============================================================
// МЕТОДЫ ДОСТУПА
// ============================================================

EntityMetadata.get = function (entity) {
  return this[entity] || null;
};

EntityMetadata.has = function (entity) {
  return !!this[entity];
};

// Исправленный list() – возвращает массив объектов
EntityMetadata.list = function () {
  return Object.values(this).filter(item =>
    item &&
    typeof item === "object" &&
    item.entity &&
    item.table &&
    Array.isArray(item.fields)
  );
};

// Новый метод для поиска по таблице
EntityMetadata.getByTable = function (table) {
  return this.list().find(e => e.table === table) || null;
};

// Проверка согласованности с EntityRegistry
EntityMetadata.validateRegistry = function () {
  const errors = [];
  if (typeof EntityRegistry === "undefined") {
    errors.push("EntityRegistry not loaded");
    return errors;
  }
  this.list().forEach(meta => {
    if (!EntityRegistry.has(meta.entity)) {
      errors.push(`EntityRegistry missing entry for "${meta.entity}"`);
    }
  });
  return errors;
};

EntityMetadata.health = function () {
  const regErrors = this.validateRegistry();
  return HealthContract.create(
    "EntityMetadata",
    regErrors.length === 0 ? "OK" : "WARNING",
    {
      version: this.version,
      entities: this.list().map(e => e.entity),
      validationErrors: regErrors
    }
  );
};

// ============================================================
// МЕТОД REGISTER (с защитой от дублей)
// ============================================================

EntityMetadata.register = function (definition) {
  if (!definition || !definition.entity) {
    throw new Error("EntityMetadata.register: entity name required");
  }
  const entity = definition.entity;
  if (this[entity]) {
    throw new Error(`Entity already registered: ${entity}`);
  }
  // Заполняем defaults
  if (!definition.table) definition.table = entity + "s";
  if (!definition.idField) definition.idField = entity + "ID";
  if (!definition.idPrefix) definition.idPrefix = entity.substring(0, 3);
  if (!definition.version) definition.version = 1;
  if (definition.softDelete === undefined) definition.softDelete = true;
  if (definition.timestamps === undefined) definition.timestamps = true;
  if (!definition.fields) definition.fields = [];
  if (!definition.relations) definition.relations = {};
  if (!definition.indexes) definition.indexes = { search: [], unique: [] };
  if (!definition.audit) definition.audit = { enabled: true, fields: [] };
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
  // Преобразуем поля из строк в объекты с расширенными атрибутами
  if (Array.isArray(definition.fields) && definition.fields.length > 0 && typeof definition.fields[0] === "string") {
    definition.fields = definition.fields.map(name => {
      const field = { name, type: "STRING" };
      if (name === definition.idField) {
        field.type = "ID";
        field.required = true;
      } else if (name.endsWith("ID")) field.type = "REFERENCE";
      else if (["CreatedAt", "UpdatedAt", "Timestamp"].includes(name)) field.type = "DATETIME";
      else if (name === "Deleted") field.type = "BOOLEAN";
      else if (name === "Balance" || name === "CreditLimit" || name === "Revenue" || name === "Cost" || name === "Profit" || name === "Margin" || name === "Weight" || name === "Volume" || name === "Distance" || name === "Duration" || name === "CargoWeight") field.type = "NUMBER";
      return field;
    });
  }
  this[entity] = definition;
  Logger.log("EntityMetadata REGISTERED: " + entity);
  return definition;
};

EntityMetadata.registerOrUpdate = function (definition) {
  const entity = definition.entity;
  if (!entity) throw new Error("Entity name required");
  delete this[entity];
  return this.register(definition);
};

globalThis.EntityMetadata = EntityMetadata;
Logger.log("EntityMetadata READY v" + EntityMetadata.version);