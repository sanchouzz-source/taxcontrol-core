console.log("SchemaRegistry");

const SchemaRegistry = {
  version: "3.3.0",
  status: "REGISTERED",
  initialized: false,
  initAttempts: 0,
  maxInitAttempts: 3,
  initError: null,

  schemas: {},          // entity → meta (полный объект из EntityMetadata)
  tableIndex: {},       // table → entity
  fieldCache: {},       // table → { fieldName: { type, required, unique, default, ... } }
  migrationHandlers: {},
  hooks: {},
  relations: {},

  // ----- ИНИЦИАЛИЗАЦИЯ (мягкий режим с защитой) -----
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
      Logger.warn("SchemaRegistry waiting for EntityMetadata...");
      return;
    }

    try {
      const entities = EntityMetadata.list(); // теперь возвращает массив объектов
      for (const meta of entities) {
        if (!meta || !meta.table) continue;
        const entity = meta.entity;
        this.schemas[entity] = meta;
        this.tableIndex[meta.table] = entity;
        if (meta.fields) {
          this.fieldCache[meta.table] = {};
          for (const field of meta.fields) {
            this.fieldCache[meta.table][field.name] = field;
          }
        }
        // Кешируем хуки
        if (meta.hooks) {
          for (const [hookName, hookFns] of Object.entries(meta.hooks)) {
            if (!this.hooks[hookName]) this.hooks[hookName] = {};
            this.hooks[hookName][entity] = hookFns;
          }
        }
        // Кешируем связи
        if (meta.relations) {
          this.relations[entity] = meta.relations;
        }
      }
      this.status = "READY";
      this.initialized = true;
      this.initError = null;
      Logger.log("SchemaRegistry READY v" + this.version);
    } catch (e) {
      this.status = "FAILED";
      this.initError = e.message;
      Logger.error("SchemaRegistry INIT FAILED " + e.message);
      throw e;
    }
  },

  // ----- ПЕРЕЗАГРУЗКА -----
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

  // ----- ДИАГНОСТИКА ИНИЦИАЛИЗАЦИИ -----
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

  // ----- ПОЛУЧЕНИЕ СХЕМЫ -----
  get(entity) {
    this.init();
    return this.schemas[entity] || null;
  },
  getByTable(table) {
    this.init();
    const entity = this.tableIndex[table];
    if (!entity) return null;
    return this.schemas[entity];
  },
  getEntityByTable(table) {
    this.init();
    return this.tableIndex[table] || null;
  },

  // ----- ОСНОВНЫЕ МЕТАДАННЫЕ -----
  getIdField(table) {
    this.init();
    const meta = this.getByTable(table);
    if (!meta) throw new Error(`Schema not registered for table: ${table}`);
    return meta.idField || null;
  },

  getSoftDelete(table) {
    this.init();
    const meta = this.getByTable(table);
    if (!meta) return true; // по умолчанию включено
    return meta.softDelete !== false;
  },

  getTimestamps(table) {
    this.init();
    const meta = this.getByTable(table);
    if (!meta) return true; // по умолчанию включено
    return meta.timestamps !== false;
  },

  getFields(table) {
    this.init();
    const meta = this.getByTable(table);
    if (!meta) return null;
    return meta.fields || [];
  },

  getField(table, fieldName) {
    this.init();
    const fields = this.fieldCache[table];
    if (!fields) return null;
    return fields[fieldName] || null;
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

  // ----- ВАЛИДАЦИЯ (с partial и strict) -----
  validate(table, data, options = {}) {
    this.init();
    const meta = this.getByTable(table);
    if (!meta) throw new Error(`Schema not registered for table: ${table}`);
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

  // ----- ПРИМЕНЕНИЕ ЗНАЧЕНИЙ ПО УМОЛЧАНИЮ (возвращает копию) -----
  applyDefaults(table, data) {
    this.init();
    const meta = this.getByTable(table);
    if (!meta) throw new Error(`Schema not registered for table: ${table}`);
    const fields = meta.fields || [];
    const result = { ...data };
    for (const field of fields) {
      if (field.default !== undefined && result[field.name] === undefined) {
        result[field.name] = field.default;
      }
    }
    return result;
  },

  // ----- УНИКАЛЬНОСТЬ (с учётом includeDeleted) -----
  checkUnique(table, fieldName, value, excludeId) {
    this.init();
    const field = this.getField(table, fieldName);
    if (!field) throw new Error(`Field ${fieldName} not found in table ${table}`);
    if (!field.unique) return true;

    if (typeof Database === "undefined") {
      throw new Error("Database not available for uniqueness check");
    }
    let result;
    try {
      result = Database.query(table, { [fieldName]: value }, { includeDeleted: true });
    } catch (e) {
      result = Database.query(table, { [fieldName]: value });
    }
    const records = result.data || result || [];
    const idField = this.getIdField(table);
    for (const rec of records) {
      if (excludeId !== undefined && String(rec[idField]) === String(excludeId)) continue;
      throw new Error(`Duplicate value for ${fieldName}: ${value}`);
    }
    return true;
  },

  // ----- ПРОВЕРКА СВЯЗЕЙ (валидация существования сущностей и записей) -----
  validateRelations(table, data) {
    this.init();
    const relations = this.getRelations(table);
    if (!relations) return true;
    for (const [field, config] of Object.entries(relations)) {
      if (data[field] === undefined || data[field] === null) continue;
      const refEntity = config.entity;
      if (!refEntity) continue;
      // Проверяем, что сущность существует в EntityMetadata
      const refMeta = this.get(refEntity);
      if (!refMeta) {
        throw new Error(`Relation ${field} references unknown entity ${refEntity}`);
      }
      // Проверяем существование записи
      const refTable = refMeta.table;
      const resolvedTable = Database.resolveTable ? Database.resolveTable(refTable) : refTable;
      const refRecord = Database.find(resolvedTable, data[field]);
      if (!refRecord) {
        throw new Error(`Referenced record not found: ${field}=${data[field]} (table ${refTable})`);
      }
      if (refRecord.Deleted === true || refRecord.Deleted === "true") {
        throw new Error(`Referenced record is deleted: ${field}=${data[field]}`);
      }
    }
    return true;
  },

  // ----- ПРОВЕРКА ВСЕХ СВЯЗЕЙ (для health) -----
  checkAllRelations() {
    this.init();
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

  // ----- ХУКИ (регистрация и выполнение) -----
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

  // ----- МИГРАЦИИ -----
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

  // ----- СРАВНЕНИЕ СХЕМЫ С ТАБЛИЦЕЙ (Schema diff) -----
  compareTable(table) {
    this.init();
    const meta = this.getByTable(table);
    if (!meta) throw new Error(`Schema not registered for table: ${table}`);
    const fields = meta.fields || [];
    const expectedColumns = fields.map(f => f.name);

    let actualColumns = [];
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(table);
      if (sheet) {
        const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        actualColumns = headerRow || [];
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

  // ----- ПРАВА ДОСТУПА (permissions) -----
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

  // ----- HEALTH (с проверкой связей) -----
  health() {
    const relationErrors = this.initialized ? this.checkAllRelations() : [];
    return {
      module: "SchemaRegistry",
      version: this.version,
      status: this.status,
      initialized: this.initialized,
      schemas: Object.keys(this.schemas).length,
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