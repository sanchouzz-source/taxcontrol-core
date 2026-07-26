console.log("SchemaRegistry v4.0.4");

const SchemaRegistry = {
  version: "4.0.4",
  status: "REGISTERED",
  initialized: false,
  initAttempts: 0,
  maxInitAttempts: 3,
  initError: null,

  // ===== НОВЫЙ ФЛАГ =====
  autoFallbackFields: true,

  schemas: {},          // entity → meta
  tableIndex: {},       // table → entity
  fieldCache: {},       // table → { fieldName: field }
  migrationHandlers: {},
  hooks: {},
  relations: {},

  // Системные таблицы
  systemTables: [
    "__TEST_DATABASE",
    "__TEST_EVENTS",
    "__TEST_REPOSITORY"
  ],

  systemSchemas: {
    "__TEST_DATABASE": {
      entity: "__TEST_DATABASE",
      table: "__TEST_DATABASE",
      idField: "id",
      version: 1,
      system: true,
      fields: [
        { name: "id", type: "STRING", required: true },
        { name: "createdAt", type: "DATE" },
        { name: "value", type: "STRING" }
      ]
    },
    "__TEST_EVENTS": {
      entity: "__TEST_EVENTS",
      table: "__TEST_EVENTS",
      idField: "id",
      version: 1,
      system: true,
      fields: [
        { name: "id", type: "STRING", required: true },
        { name: "event", type: "STRING" }
      ]
    },
    "__TEST_REPOSITORY": {
      entity: "__TEST_REPOSITORY",
      table: "__TEST_REPOSITORY",
      idField: "id",
      version: 1,
      system: true,
      fields: [
        { name: "id", type: "STRING", required: true }
      ]
    }
  },

  // ============================================================
  // INIT
  // ============================================================
  init() {
    if (this.initialized) return;
    if (this.initAttempts >= this.maxInitAttempts) {
      const msg = `SchemaRegistry init failed after ${this.maxInitAttempts} attempts: ${this.initError || 'unknown error'}`;
      throw new Error(msg);
    }
    this.initAttempts++;
    this.status = "INITIALIZING";

    if (typeof EntityMetadata === "undefined") {
      this.status = "WAITING_METADATA";
      Logger.warn("SchemaRegistry waiting EntityMetadata...");
      return;
    }

    try {
      let entities = [];

      if (typeof EntityMetadata.list === "function") {
        entities = EntityMetadata.list();
      } else if (EntityMetadata.entities) {
        entities = Object.values(EntityMetadata.entities);
      }

      Logger.log(`SchemaRegistry loading ${entities.length} metadata entries`);

      for (const meta of entities) {
        if (!meta) continue;
        const entity = meta.entity || meta.name || meta.code;
        const table = meta.table || meta.tableName;
        if (!entity || !table) {
          Logger.warn("Schema skip invalid metadata: " + JSON.stringify(meta));
          continue;
        }
        this.register(entity, meta);
      }

      // Регистрация системных схем
      for (const table of this.systemTables) {
        const schema = this.systemSchemas[table];
        if (schema) {
          this.register(schema.entity, schema);
          Logger.log("System schema registered: " + table);
        }
      }

      // Синхронизация с EntityRegistry
      if (typeof EntityRegistry !== "undefined") {
        Object.keys(EntityRegistry)
          .filter(k => {
            return EntityRegistry[k] &&
                   typeof EntityRegistry[k] === "object" &&
                   EntityRegistry[k].entity;
          })
          .forEach(entity => {
            const meta = EntityRegistry[entity];
            if (!this.schemas[entity]) {
              this.register(entity, meta);
              Logger.log("Synchronized from EntityRegistry: " + entity);
            }
          });
      }

      this.initialized = true;
      this.status = "READY";
      this.initError = null;
      Logger.log(
        `SchemaRegistry READY v${this.version} TABLES=${Object.keys(this.tableIndex).length}`
      );
    } catch (e) {
      this.status = "FAILED";
      this.initError = e.message;
      Logger.error("SchemaRegistry INIT FAILED " + e.message);
      throw e;
    }
  },

  // ============================================================
  // REGISTER
  // ============================================================
  register(entity, meta) {
    if (!entity || !meta.table) {
      Logger.warn(
        "SchemaRegistry skip invalid entity " + entity
      );
      return false;
    }

    const schema = {
      entity,
      table: meta.table,
      idField: meta.idField || "id",
      version: meta.version || 1,

      module: meta.module || "core",

      system: meta.system === true,

      category:
        meta.system === true
        ? "SYSTEM"
        : "BUSINESS",

      softDelete:
        meta.softDelete !== false,

      timestamps:
        meta.timestamps !== false,

      fields:
        meta.fields || [],

      relations:
        meta.relations || {},

      indexes:
        meta.indexes || []
    };

    this.schemas[entity] = schema;
    this.tableIndex[schema.table] = entity;

    this.fieldCache[schema.table] = {};

    schema.fields.forEach(field => {
      this.fieldCache[schema.table][field.name] = field;
    });

    if (schema.relations) {
      this.relations[entity] = schema.relations;
    }

    Logger.debug(
      "SCHEMA REGISTERED "
      + entity
      + " -> "
      + schema.table
    );

    return true;
  },

  // ============================================================
  // СИСТЕМНЫЕ ТАБЛИЦЫ
  // ============================================================
  isSystemTable(table) {
    return this.systemTables.includes(table);
  },

  // ============================================================
  // НОРМАЛИЗАЦИЯ ENTITY / TABLE
  // ============================================================
  resolveEntity(value) {
    this.init();
    if (!value) throw new Error("Empty entity");

    const key = String(value).trim().toUpperCase();

    if (this.schemas[key]) return key;
    if (this.schemas[value]) return value;
    if (this.tableIndex[value]) return this.tableIndex[value];

    throw new Error(
      "Unknown entity/table: " + value
    );
  },

  resolveTable(value) {
    this.init();
    const entity = this.resolveEntity(value);
    const meta = this.schemas[entity] || this.systemSchemas[entity];
    if (!meta) throw new Error(`No metadata for entity: ${entity}`);
    return meta.table;
  },

  // ============================================================
  // ПЕРЕЗАГРУЗКА
  // ============================================================
  reinitialize() {
    Logger.log("SchemaRegistry reinitializing...");
    this.initialized = false;
    this.initAttempts = 0;
    this.schemas = {};
    this.tableIndex = {};
    this.fieldCache = {};
    this.hooks = {};
    this.relations = {};
    this.init();
  },

  // ============================================================
  // ДИАГНОСТИКА ИНИЦИАЛИЗАЦИИ
  // ============================================================
  getInitReport() {
    this.init();
    return {
      status: this.status,
      initialized: this.initialized,
      attempts: this.initAttempts,
      maxAttempts: this.maxInitAttempts,
      error: this.initError,
      metadataLoaded: typeof EntityMetadata !== "undefined",
      entityCount: Object.keys(this.schemas).length,
      tableCount: Object.keys(this.tableIndex).length,
    };
  },

  // ============================================================
  // БАЗОВЫЕ ГЕТТЕРЫ (с autoFallbackFields)
  // ============================================================
  list() {
    this.init();
    return Object.values(this.schemas);
  },

  getAll() {
    return this.list();
  },

  has(entity) {
    this.init();
    return !!this.schemas[entity];
  },

  count() {
    this.init();
    return Object.keys(this.schemas).length;
  },

  tables() {
    this.init();
    return Object.keys(this.tableIndex);
  },

  // ----- GET (с автоподстановкой полей) -----
  get(entity) {
    this.init();
    const meta = this.schemas[entity] || null;
    if (!meta) return null;

    // Если флаг включён и fields отсутствуют или пусты – подставляем дефолтные
    if (this.autoFallbackFields && (!meta.fields || meta.fields.length === 0)) {
      return {
        ...meta,
        fields: [
          { name: "id", type: "STRING", required: true },
          { name: "createdAt", type: "DATE" },
          { name: "updatedAt", type: "DATE" }
        ]
      };
    }
    return meta;
  },

  // ----- GET BY TABLE (с автоподстановкой) -----
  getByTable(table) {
    this.init();
    const entity = this.tableIndex[table];
    if (entity && this.schemas[entity]) {
      const meta = this.schemas[entity];
      if (this.autoFallbackFields && (!meta.fields || meta.fields.length === 0)) {
        return {
          ...meta,
          fields: [
            { name: "id", type: "STRING", required: true },
            { name: "createdAt", type: "DATE" },
            { name: "updatedAt", type: "DATE" }
          ]
        };
      }
      return meta;
    }
    if (this.systemSchemas[table]) {
      const meta = this.systemSchemas[table];
      if (this.autoFallbackFields && (!meta.fields || meta.fields.length === 0)) {
        return {
          ...meta,
          fields: [
            { name: "id", type: "STRING", required: true },
            { name: "createdAt", type: "DATE" },
            { name: "updatedAt", type: "DATE" }
          ]
        };
      }
      return meta;
    }
    return null;
  },

  getEntityByTable(table) {
    this.init();
    return this.tableIndex[table] || null;
  },

  getIdField(table) {
    this.init();
    const meta = this.getByTable(table);
    if (!meta) throw new Error(`Schema not registered for table: ${table}`);
    return meta.idField || null;
  },

  getSoftDelete(table) {
    this.init();
    const meta = this.getByTable(table);
    if (!meta) return true;
    return meta.softDelete !== false;
  },

  getTimestamps(table) {
    this.init();
    const meta = this.getByTable(table);
    if (!meta) return true;
    return meta.timestamps !== false;
  },

  getFields(table) {
    this.init();
    const meta = this.getByTable(table);
    if (!meta) return null;
    // Возвращаем уже обогащённые поля из getByTable
    return meta.fields || [];
  },

  getField(table, fieldName) {
    this.init();
    // Если поле есть в кэше – возвращаем оттуда
    if (this.fieldCache[table] && this.fieldCache[table][fieldName]) {
      return this.fieldCache[table][fieldName];
    }
    // Иначе пробуем получить через getFields и найти
    const fields = this.getFields(table);
    if (!fields) return null;
    return fields.find(f => f.name === fieldName) || null;
  },

  getRelations(table) {
    this.init();
    const meta = this.getByTable(table);
    if (!meta) return null;
    return meta.relations || null;
  },

  getIndexes(table) {
    this.init();
    const meta = this.getByTable(table);
    if (!meta) return null;
    return meta.indexes || null;
  },

  getSchemaVersion(entity) {
    this.init();
    const meta = this.get(entity);
    if (!meta) return null;
    return meta.version || 1;
  },

  // ============================================================
  // ВАЛИДАЦИЯ
  // ============================================================
  validate(table, data, options = {}) {
    this.init();
    const entity = this.getEntityByTable(table);
    if (!entity) throw new Error(`Table not registered: ${table}`);
    const meta = this.get(entity);
    const fields = meta.fields || [];
    const strict = options.strict === true;

    if (strict) {
      const schemaFieldNames = fields.map(f => f.name);
      for (const key of Object.keys(data)) {
        if (!schemaFieldNames.includes(key)) {
          throw new Error(`Unknown field "${key}" in table "${table}"`);
        }
      }
    }

    for (const field of fields) {
      if (options.partial && data[field.name] === undefined) continue;
      if (field.required && (data[field.name] === undefined || data[field.name] === null || data[field.name] === "")) {
        throw new Error(`Missing required field: ${field.name}`);
      }
      const value = data[field.name];
      if (value !== undefined && value !== null) {
        if (field.type === "NUMBER" && isNaN(Number(value))) {
          throw new Error(`Field ${field.name} must be a number`);
        }
        if (field.type === "BOOLEAN" && typeof value !== "boolean" && value !== "true" && value !== "false") {
          throw new Error(`Field ${field.name} must be boolean`);
        }
        if (field.type === "STRING" && field.maxLength && String(value).length > field.maxLength) {
          throw new Error(`Field ${field.name} exceeds max length ${field.maxLength}`);
        }
        if (field.format === "EMAIL" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new Error(`Field ${field.name} must be a valid email`);
        }
        if (field.format === "INN" && !/^\d{10}$|^\d{12}$/.test(value)) {
          throw new Error(`Field ${field.name} must be a valid INN (10 or 12 digits)`);
        }
      }
    }
    return true;
  },

  applyDefaults(table, data) {
    this.init();
    const entity = this.getEntityByTable(table);
    if (!entity) throw new Error(`Table not registered: ${table}`);
    const meta = this.get(entity);
    const fields = meta.fields || [];
    const result = { ...data };
    for (const field of fields) {
      if (field.default !== undefined && result[field.name] === undefined) {
        result[field.name] = field.default;
      }
    }
    return result;
  },

  // ============================================================
  // УНИКАЛЬНОСТЬ
  // ============================================================
  checkUnique(table, fieldName, value, excludeId) {
    this.init();
    const field = this.getField(table, fieldName);
    if (!field) throw new Error(`Field ${fieldName} not found in table ${table}`);
    if (!field.unique) return true;

    if (typeof Database === "undefined") {
      throw new Error("Database not available for uniqueness check");
    }

    const entity = this.getEntityByTable(table);
    if (!entity) throw new Error(`Entity not found for table: ${table}`);

    let result;
    try {
      result = Database.query(entity, { [fieldName]: value }, { includeDeleted: true });
    } catch (e) {
      result = Database.query(entity, { [fieldName]: value });
    }
    const records = result.data || result || [];
    const idField = this.getIdField(table);
    for (const rec of records) {
      if (excludeId !== undefined && String(rec[idField]) === String(excludeId)) continue;
      throw new Error(`Duplicate value for ${fieldName}: ${value}`);
    }
    return true;
  },

  // ============================================================
  // СВЯЗИ
  // ============================================================
  validateRelations(table, data) {
    this.init();
    const entity = this.getEntityByTable(table);
    if (!entity) throw new Error(`Table not registered: ${table}`);
    const relations = this.getRelations(table);
    if (!relations) return true;

    for (const [field, config] of Object.entries(relations)) {
      if (data[field] === undefined || data[field] === null) continue;
      const refEntity = config.entity;
      if (!refEntity) continue;
      const refMeta = this.get(refEntity);
      if (!refMeta) {
        throw new Error(`Relation ${field} references unknown entity ${refEntity}`);
      }
      const refTable = refMeta.table;
      const resolvedTable = Database.resolveTable ? Database.resolveTable(refEntity) : refTable;
      const refRecord = Database.find(resolvedTable, data[field]);
      if (!refRecord) {
        throw new Error(`Referenced record not found: ${field}=${data[field]} (entity ${refEntity})`);
      }
      if (refRecord.Deleted === true || refRecord.Deleted === "true") {
        throw new Error(`Referenced record is deleted: ${field}=${data[field]}`);
      }
    }
    return true;
  },

  checkAllRelations() {
    if (!this.initialized) return [];
    const errors = [];
    for (const [entity, meta] of Object.entries(this.schemas)) {
      if (!meta.relations) continue;
      for (const [field, config] of Object.entries(meta.relations)) {
        const refEntity = config.entity;
        if (!refEntity) continue;
        if (!this.get(refEntity)) {
          errors.push(`Entity ${entity} relation ${field} references missing entity ${refEntity}`);
        }
      }
    }
    return errors;
  },

  // ============================================================
  // ХУКИ
  // ============================================================
  registerHook(entity, hookName, fn) {
    if (!this.hooks[hookName]) this.hooks[hookName] = {};
    if (!this.hooks[hookName][entity]) this.hooks[hookName][entity] = [];
    this.hooks[hookName][entity].push(fn);
    Logger.debug(`Hook registered: ${hookName} for ${entity}`);
  },

  runHooks(entity, hookName, context) {
    this.init();
    const hookMap = this.hooks[hookName];
    if (!hookMap) return;
    const fns = hookMap[entity];
    if (!fns) return;
    for (const fn of fns) {
      try {
        fn(context);
      } catch (e) {
        Logger.error(`Hook ${hookName} for ${entity} failed: ${e.message}`);
        throw e;
      }
    }
  },

  // ============================================================
  // МИГРАЦИИ
  // ============================================================
  registerMigration(entity, fromVersion, toVersion, handler) {
    const key = `${entity}:${fromVersion}->${toVersion}`;
    this.migrationHandlers[key] = handler;
    Logger.log(`Migration registered: ${key}`);
  },

  migrate(entity, fromVersion, toVersion) {
    this.init();
    const meta = this.get(entity);
    if (!meta) throw new Error(`Entity ${entity} not found`);
    const key = `${entity}:${fromVersion}->${toVersion}`;
    if (typeof this.migrationHandlers[key] === "function") {
      Logger.log(`Running migration ${entity} v${fromVersion}->v${toVersion}`);
      this.migrationHandlers[key]();
      return true;
    } else {
      Logger.warn(`No migration handler for ${entity} v${fromVersion}->v${toVersion}`);
      return false;
    }
  },

  // ============================================================
  // СРАВНЕНИЕ СХЕМЫ С ТАБЛИЦЕЙ
  // ============================================================
  compareTable(table) {
    this.init();
    const meta = this.getByTable(table);
    if (!meta) throw new Error(`Schema not registered for table: ${table}`);
    const fields = meta.fields || [];
    const expectedColumns = fields.map(f => f.name);

    let actualColumns = [];
    try {
      if (typeof SpreadsheetAdapter !== "undefined") {
        const sheet = SpreadsheetAdapter.getSheet(table);
        if (sheet) {
          actualColumns = SpreadsheetAdapter.getHeaders(sheet) || [];
        }
      } else {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = ss.getSheetByName(table);
        if (sheet) {
          const lastCol = sheet.getLastColumn();
          if (lastCol > 0) {
            actualColumns = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
          }
        }
      }
    } catch (e) {
      return { table, error: e.message };
    }

    const missingColumns = expectedColumns.filter(c => !actualColumns.includes(c));
    const extraColumns = actualColumns.filter(c => !expectedColumns.includes(c));
    let columnOrderChanged = false;
    if (actualColumns.length === expectedColumns.length && missingColumns.length === 0 && extraColumns.length === 0) {
      for (let i = 0; i < expectedColumns.length; i++) {
        if (expectedColumns[i] !== actualColumns[i]) {
          columnOrderChanged = true;
          break;
        }
      }
    }

    return {
      table,
      expected: expectedColumns,
      actual: actualColumns,
      missingColumns,
      extraColumns,
      columnOrderChanged,
      status: missingColumns.length === 0 && extraColumns.length === 0 && !columnOrderChanged ? "SYNC" : "MIGRATION_REQUIRED"
    };
  },

  // ============================================================
  // ПРАВА ДОСТУПА
  // ============================================================
  getPermissions(table) {
    this.init();
    const meta = this.getByTable(table);
    return meta?.permissions || null;
  },

  can(user, action, entity) {
    const perms = this.getPermissions(entity);
    if (!perms) return true;
    const allowed = perms[action] || [];
    if (allowed.length === 0) return true;
    return allowed.includes(user.role) || allowed.includes(user.id);
  },

  // ============================================================
  // СИСТЕМНАЯ ПРОВЕРКА
  // ============================================================
  checkSystemSchemas() {
    const result = [];
    for (const table of this.systemTables) {
      const exists = !!this.getByTable(table);
      result.push({
        table,
        registered: exists,
        status: exists ? "OK" : "MISSING"
      });
    }
    return result;
  },

  // ============================================================
  // ДИАГНОСТИКА
  // ============================================================
  diagnostics() {
    this.init();
    const businessEntities = Object.values(this.schemas)
      .filter(m => m.category === "BUSINESS")
      .length;
    const systemEntities = Object.values(this.schemas)
      .filter(m => m.category === "SYSTEM")
      .length;

    return {
      version: this.version,
      status: this.status,
      initialized: this.initialized,
      businessEntities,
      systemEntities,
      tables: Object.keys(this.tableIndex).length,
      relations: Object.keys(this.relations).length,
      hooks: Object.keys(this.hooks).length,
      systemCheck: this.checkSystemSchemas()
    };
  },

  // ============================================================
  // HEALTH
  // ============================================================
  health() {
    const relationErrors = this.initialized ? this.checkAllRelations() : [];
    return {
      module: "SchemaRegistry",
      version: this.version,
      status: this.status,
      initialized: this.initialized,
      schemas: Object.keys(this.schemas).length,
      systemSchemas: Object.keys(this.systemSchemas).length,
      tables: Object.keys(this.tableIndex).length,
      metadataLoaded: typeof EntityMetadata !== "undefined",
      initAttempts: this.initAttempts,
      error: this.initError,
      relationErrors: relationErrors
    };
  }
};

globalThis.SchemaRegistry = SchemaRegistry;
Logger.log("SchemaRegistry REGISTERED v" + SchemaRegistry.version);