// ============================================================
// Database v5.2.0
// TaxControl ERP Core
//
// Storage Engine
//
// Repository
//      |
// Database
//      |
// SpreadsheetAdapter
//
// Compatible:
// SpreadsheetAdapter v4.3+
// RepositoryFactory v2.5.8+
// EntityService v5.0+
// SystemInit v2.5+
// ============================================================

console.log("Database v5.2.0");

const Database = {
  version: "5.2.0",

  architecture:
    "Repository -> Database -> SpreadsheetAdapter",

  initialized: false,
  initializing: false,
  status: "CREATED",
  lastError: null,
  startedAt: null,
  duration: 0,

  _adapter: null,
  _metaCache: {},

  _stats: {
    queries: 0,
    inserts: 0,
    updates: 0,
    deletes: 0,
    restores: 0,
    bulkInserts: 0,
    adapterCalls: 0,
    transactions: 0
  },

  // ============================================================
  // INIT
  // ============================================================

  init(adapter) {
    if (this.initialized) {
      Logger.debug("Database already initialized");
      return true;
    }

    if (this.initializing) {
      throw new Error("Database initialization already running");
    }

    this.initializing = true;
    this.status = "INITIALIZING";
    this.startedAt = new Date().toISOString();
    const start = Date.now();

    try {
      this._adapter = adapter || SpreadsheetAdapter;

      if (!this._adapter) {
        throw new Error("SpreadsheetAdapter unavailable");
      }

      // Инициализация адаптера, если есть
      if (this._adapter.init && typeof this._adapter.init === "function") {
        this._adapter.init();
      }

      this.buildMetadata();

      this.initialized = true;
      this.status = "READY";
      this.duration = Date.now() - start;
      this.lastError = null;

      Logger.log(
        "Database READY v" +
          this.version +
          " adapter=" +
          this.adapterName() +
          " entities=" +
          this.list().length +
          " (" + this.duration + "ms)"
      );

      return true;
    } catch (e) {
      this.status = "FAILED";
      this.lastError = e.message;
      this.initialized = false;
      Logger.error("Database INIT FAILED " + e.message);
      throw e;
    } finally {
      this.initializing = false;
    }
  },

  // ============================================================
  // REQUIRE
  // ============================================================

  _require() {
    if (!this.initialized) {
      this.init();
    }
  },

  // ============================================================
  // ADAPTER INFO
  // ============================================================

  adapterName() {
    return this._adapter?.version
      ? "SpreadsheetAdapter v" + this._adapter.version
      : "unknown";
  },

  // ============================================================
  // METADATA (с поддержкой SchemaManager)
  // ============================================================

  buildMetadata() {
    this._metaCache = {};

    let entities = [];

    // 1. Пытаемся через SchemaManager (новый источник)
    if (
      typeof SchemaManager !== "undefined" &&
      typeof SchemaManager.getTables === "function"
    ) {
      entities = SchemaManager.getTables();
    }
    // 2. Fallback на SchemaRegistry
    else if (
      typeof SchemaRegistry !== "undefined" &&
      typeof SchemaRegistry.list === "function"
    ) {
      const registryEntities = SchemaRegistry.list();
      entities = registryEntities.map(e =>
        typeof e === "string" ? e : e.entity || e.name
      ).filter(Boolean);
    }

    if (!entities.length) {
      Logger.warn("Database: no entities found from SchemaManager or SchemaRegistry");
      return;
    }

    // Загружаем метаданные для каждой сущности
    for (const entity of entities) {
      if (!entity) continue;
      let meta = null;

      // Пробуем через SchemaRegistry
      if (
        typeof SchemaRegistry !== "undefined" &&
        typeof SchemaRegistry.get === "function"
      ) {
        try {
          meta = SchemaRegistry.get(entity);
        } catch (e) {}
      }

      // Если не найдено, пробуем через SchemaManager
      if (!meta && typeof SchemaManager !== "undefined" && SchemaManager.get) {
        try {
          meta = SchemaManager.get(entity);
        } catch (e) {}
      }

      if (meta) {
        this._metaCache[entity] = meta;
      } else {
        Logger.debug("Database: no metadata for " + entity);
      }
    }

    Logger.log(
      "Database metadata loaded " + Object.keys(this._metaCache).length
    );
  },

  getMeta(entity) {
    this._require();

    entity = this.resolveEntity(entity);

    let meta = this._metaCache[entity];

    if (!meta) {
      // Попытка перезагрузить метаданные
      this.buildMetadata();
      meta = this._metaCache[entity];
    }

    if (!meta) {
      throw new Error("Database metadata missing " + entity);
    }

    return meta;
  },

  resolveEntity(entity) {
    if (typeof EntityRegistry !== "undefined" && EntityRegistry.resolve) {
      return EntityRegistry.resolve(entity);
    }
    return entity;
  },

  table(entity) {
    return this.getMeta(entity).table;
  },

  idField(entity) {
    const meta = this.getMeta(entity);
    return meta.idField || meta.primaryKey || "id";
  },

  // ============================================================
  // CREATE
  // ============================================================

  insert(entity, data) {
    this._require();

    const meta = this.getMeta(entity);

    if (!this._adapter.appendObject) {
      throw new Error("Adapter appendObject missing");
    }

    this._adapter.appendObject(meta.table, data);

    this._stats.inserts++;
    this._stats.adapterCalls++;

    return { ...data };
  },

  // ============================================================
  // BULK
  // ============================================================

  bulkInsert(entity, items = []) {
    if (!items.length) return [];

    const meta = this.getMeta(entity);

    let result;
    if (this._adapter.bulkInsert) {
      result = this._adapter.bulkInsert(meta.table, items);
    } else {
      result = items.map((x) => this.insert(entity, x));
    }

    this._stats.bulkInserts++;
    this._stats.adapterCalls++;

    return result;
  },

  // ============================================================
  // READ
  // ============================================================

  find(entity, id) {
    this._require();

    if (!this._adapter.findById) {
      throw new Error("Adapter findById missing");
    }

    const meta = this.getMeta(entity);
    const result = this._adapter.findById(
      meta.table,
      this.idField(entity),
      id
    );

    this._stats.adapterCalls++;

    return result;
  },

  // get – алиас для find
  get(entity, id) {
    return this.find(entity, id);
  },

  findAll(entity) {
    this._require();

    const meta = this.getMeta(entity);

    if (!this._adapter.findAll) {
      throw new Error("Adapter findAll missing");
    }

    const rows = this._adapter.findAll(meta.table);

    this._stats.queries++;
    this._stats.adapterCalls++;

    return Array.isArray(rows) ? rows : [];
  },

  // Исправлен query – без дублирования счётчиков
  query(entity, filters = {}) {
    const rows = this.findAll(entity);

    // findAll уже увеличивает счётчики, здесь только фильтрация
    return rows.filter((row) => {
      return Object.keys(filters).every(
        (key) => String(row[key]) === String(filters[key])
      );
    });
  },

  findWhere(entity, criteria = {}) {
    return this.query(entity, criteria);
  },

  findOne(entity, criteria = {}) {
    const rows = this.query(entity, criteria);
    return rows.length ? rows[0] : null;
  },

  count(entity, filters = {}) {
    return this.query(entity, filters).length;
  },

  exists(entity, id) {
    return !!this.find(entity, id);
  },

  existsBy(entity, field, value) {
    const rows = this.query(entity, { [field]: value });
    return rows.length > 0;
  },

  paginate(entity, page = 1, limit = 50, filters = {}) {
    const rows = this.query(entity, filters);
    const start = (page - 1) * limit;
    return {
      page,
      limit,
      total: rows.length,
      data: rows.slice(start, start + limit)
    };
  },

  // ============================================================
  // UPDATE
  // ============================================================

  update(entity, id, data) {
    this._require();

    if (!this._adapter.updateById) {
      throw new Error("Adapter updateById missing");
    }

    const meta = this.getMeta(entity);
    const result = this._adapter.updateById(
      meta.table,
      this.idField(entity),
      id,
      data
    );

    this._stats.updates++;
    this._stats.adapterCalls++;

    return result;
  },

  // ============================================================
  // DELETE
  // ============================================================

  delete(entity, id) {
    this._require();

    if (!this._adapter.delete) {
      throw new Error("Adapter delete missing");
    }

    const meta = this.getMeta(entity);
    const result = this._adapter.delete(
      meta.table,
      this.idField(entity),
      id
    );

    this._stats.deletes++;
    this._stats.adapterCalls++;

    return result;
  },

  softDelete(entity, id) {
    return this.update(entity, id, {
      Deleted: true,
      DeletedAt: new Date().toISOString()
    });
  },

  restore(entity, id) {
    this._require();

    if (!this._adapter.restore) {
      throw new Error("Adapter restore missing");
    }

    const meta = this.getMeta(entity);
    const result = this._adapter.restore(
      meta.table,
      this.idField(entity),
      id
    );

    this._stats.restores++;
    this._stats.adapterCalls++;

    return result;
  },

  // ============================================================
  // TRANSACTION
  // ============================================================

  transaction(callback) {
    this._require();

    this._stats.transactions++;

    if (this._adapter.transaction) {
      return this._adapter.transaction(callback);
    }

    return callback();
  },

  // ============================================================
  // CACHE
  // ============================================================

  clearCache() {
    this._metaCache = {};

    if (this._adapter.clearCache) {
      this._adapter.clearCache();
    }
  },

  refreshMetadata() {
    this.buildMetadata();
    return this._metaCache;
  },

  // ============================================================
  // RESET
  // ============================================================

  reset() {
    Logger.warn("Database RESET");

    this.initialized = false;
    this.initializing = false;
    this.status = "CREATED";
    this.lastError = null;
    this.startedAt = null;
    this.duration = 0;

    this._metaCache = {};

    this._stats = {
      queries: 0,
      inserts: 0,
      updates: 0,
      deletes: 0,
      restores: 0,
      bulkInserts: 0,
      adapterCalls: 0,
      transactions: 0
    };

    if (this._adapter && this._adapter.clearCache) {
      this._adapter.clearCache();
    }

    Logger.log("Database RESET COMPLETE");
    return true;
  },

  // ============================================================
  // STATUS / SUMMARY
  // ============================================================

  getStatus() {
    return {
      status: this.status,
      initialized: this.initialized,
      adapter: this.adapterName(),
      entities: this.list().length
    };
  },

  summary() {
    return {
      status: this.status,
      entities: this.list().length,
      adapter: this.adapterName(),
      initialized: this.initialized
    };
  },

  // ============================================================
  // HELPERS
  // ============================================================

  has(entity) {
    try {
      this.getMeta(entity);
      return true;
    } catch (e) {
      return false;
    }
  },

  list() {
    return Object.keys(this._metaCache);
  },

  // ============================================================
  // DIAGNOSTICS
  // ============================================================

  diagnostics() {
    return {
      module: "Database",
      version: this.version,
      status: this.status,
      initialized: this.initialized,
      initializing: this.initializing,
      startedAt: this.startedAt,
      duration: this.duration,
      architecture: this.architecture,
      adapter: this.adapterName(),
      entities: this.list(),
      stats: this._stats,
      error: this.lastError,
      dependencies: {
        SchemaRegistry: typeof SchemaRegistry !== "undefined",
        SchemaManager: typeof SchemaManager !== "undefined",
        SpreadsheetAdapter: typeof SpreadsheetAdapter !== "undefined",
        EntityRegistry: typeof EntityRegistry !== "undefined"
      }
    };
  },

  memory() {
    return {
      metadata: Object.keys(this._metaCache).length,
      stats: { ...this._stats }
    };
  },

  // ============================================================
  // HEALTH
  // ============================================================

  health() {
    const hasEntities = this.list().length > 0;
    const isReady = this.initialized && hasEntities;

    let status = "WARNING";
    if (this.status === "FAILED") {
      status = "FAILED";
    } else if (isReady) {
      status = "OK";
    }

    const data = this.diagnostics();

    if (
      typeof HealthContract !== "undefined" &&
      typeof HealthContract.create === "function"
    ) {
      return HealthContract.create("Database", status, data);
    }

    return {
      module: "Database",
      status: status,
      ...data
    };
  }
};

globalThis.Database = Database;

Logger.log("Database REGISTERED v" + Database.version);