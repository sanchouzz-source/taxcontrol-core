// ============================================================
// BaseRepository v5.7.1
// Enterprise Repository Base
// TaxControl ERP Core
//
// Compatible:
// Database v4.2+
// EntityRegistry v2.3+
// RepositoryFactory v2.7+
// EntityService v5+
// ============================================================

console.log("BaseRepository v5.7.1");

const BaseRepository = {
  version: "5.7.1",

  architecture:
    "EntityService -> RepositoryFactory -> Repository -> Database",

  _initialized: false,
  _adapter: null,
  entity: null,

  // ============================================================
  // INIT
  // ============================================================
  init(database) {
    if (this._initialized) {
      return true;
    }

    this._adapter =
      database ||
      (typeof Database !== "undefined" ? Database : null);

    if (!this._adapter) {
      throw new Error("BaseRepository Database unavailable");
    }

    this._initialized = true;
    Logger.log("BaseRepository READY v" + this.version);
    return true;
  },

  // ============================================================
  // REQUIRE ADAPTER (добавлен)
  // ============================================================
  _requireAdapter() {
    if (!this._initialized) {
      this.init();
    }
    if (!this._adapter) {
      throw new Error("BaseRepository adapter is not initialized");
    }
    return this._adapter;
  },

  // ============================================================
  // FACTORY CREATE
  // ============================================================
  createRepository(entity) {
    const repo = Object.create(this);
    repo.entity = entity;
    repo._initialized = false;
    repo.init();
    return repo;
  },

  // ============================================================
  // META
  // ============================================================
  getMeta() {
    if (!this.entity) {
      throw new Error("Repository entity not defined");
    }
    return EntityRegistry.get(this.entity);
  },

  // ============================================================
  // CREATE (универсальный: статический / экземплярный)
  // ============================================================
  create(entityOrData, dataOrOptions = {}, options = {}) {
    // Убедимся, что адаптер готов
    this._requireAdapter();

    let entity, data, opts;

    if (this.entity) {
      entity = this.entity;
      data = entityOrData || {};
      opts = dataOrOptions || {};
    } else {
      entity = entityOrData;
      data = dataOrOptions;
      opts = options;
    }

    const repo = this.entity ? this : Object.create(this);
    repo.entity = entity;

    const meta = EntityRegistry.get(entity);
    const idField = meta.idField || "ID";
    const payload = { ...data };

    if (!payload[idField]) {
      payload[idField] = IdService.generate(entity);
    }

    repo.applySystemFields(meta, payload, false);

    if (EntityValidator?.validate) {
      EntityValidator.validate(entity, payload);
    }

    const result = this._adapter.insert(entity, payload);

    repo.emit(meta.events?.created, null, result, "CREATE");
    repo.audit("CREATE", payload[idField], null, result);

    return result;
  },

  // ============================================================
  // FIND BY ID (универсальный: статический / экземплярный)
  // ============================================================
  findById(entityOrId, idOrOptions = {}, options = {}) {
    this._requireAdapter();

    let entity, id, opts;

    if (this.entity) {
      entity = this.entity;
      id = entityOrId;
      opts = idOrOptions || {};
    } else {
      entity = entityOrId;
      id = idOrOptions;
      opts = options;
    }

    const result = this._adapter.find(entity, id);
    if (!result) return null;

    const meta = EntityRegistry.get(entity);
    if (
      meta.softDelete !== false &&
      opts.includeDeleted !== true &&
      this.isDeleted(result)
    ) {
      return null;
    }

    return result;
  },

  // ============================================================
  // FIND ALL
  // ============================================================
  findAll(filters = {}, options = {}) {
    this._requireAdapter();

    let rows = this._adapter.query(this.entity, filters);
    const meta = this.getMeta();

    if (meta.softDelete !== false && options.includeDeleted !== true) {
      rows = rows.filter((x) => !this.isDeleted(x));
    }
    return rows;
  },

  findWhere(criteria = {}) {
    return this.findAll(criteria);
  },

  // ============================================================
  // UPDATE
  // ============================================================
  update(id, data = {}) {
    this._requireAdapter();

    const old = this.findById(id, { includeDeleted: true });
    if (!old) {
      throw new Error(this.entity + " not found " + id);
    }

    const payload = { ...data };
    this.applySystemFields(this.getMeta(), payload, true);

    const result = this._adapter.update(this.entity, id, payload);
    this.emit(this.getMeta().events?.updated, old, result, "UPDATE");
    this.audit("UPDATE", id, old, result);
    return result;
  },

  // ============================================================
  // DELETE (soft delete)
  // ============================================================
  delete(id) {
    this._requireAdapter();

    const meta = this.getMeta();
    if (meta.softDelete !== false) {
      return this.update(id, {
        Deleted: true,
        DeletedAt: new Date().toISOString(),
      });
    }
    return this._adapter.delete(this.entity, id);
  },

  restore(id) {
    this._requireAdapter();

    return this.update(id, {
      Deleted: false,
      DeletedAt: null,
    });
  },

  // ============================================================
  // EXISTS
  // ============================================================
  exists(id) {
    return !!this.findById(id);
  },

  existsBy(field, value) {
    return this.findAll({ [field]: value }).length > 0;
  },

  count(filters = {}) {
    return this.findAll(filters).length;
  },

  // ============================================================
  // LEGACY COMPATIBILITY
  // ============================================================
  getById(id, options = {}) {
    return this.findById(id, options);
  },

  getAll(filters = {}, options = {}) {
    return this.findAll(filters, options);
  },

  save(data) {
    const meta = this.getMeta();
    const idField = meta.idField;
    if (data[idField]) {
      return this.update(data[idField], data);
    }
    return this.create(data);
  },

  // ============================================================
  // BULK
  // ============================================================
  bulkCreate(list = []) {
    return list.map((x) => this.create(x));
  },

  bulkUpdate(ids, data) {
    return ids.map((id) => this.update(id, data));
  },

  // ============================================================
  // TRANSACTION
  // ============================================================
  transaction(callback) {
    if (typeof LockService !== "undefined") {
      const lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try {
        return callback();
      } finally {
        lock.releaseLock();
      }
    }
    return callback();
  },

  // ============================================================
  // SYSTEM FIELDS
  // ============================================================
  applySystemFields(meta, data, update) {
    const now = new Date().toISOString();
    if (meta.timestamps !== false) {
      if (!update) {
        data.CreatedAt = data.CreatedAt || now;
      }
      data.UpdatedAt = now;
    }
    if (
      typeof OrganizationContext !== "undefined" &&
      meta.organization !== false &&
      !data.OrganizationID
    ) {
      data.OrganizationID = OrganizationContext.get();
    }
    return data;
  },

  // ============================================================
  // DELETE CHECK
  // ============================================================
  isDeleted(row) {
    return (
      row.Deleted === true ||
      row.Deleted === "true" ||
      row.Deleted === 1
    );
  },

  // ============================================================
  // EVENTS
  // ============================================================
  emit(event, before, after, action) {
    if (!event || !EventBus?.emit) return;
    EventBus.emit(event, {
      entity: this.entity,
      action,
      before,
      after,
      source: "BaseRepository",
      timestamp: new Date().toISOString(),
    });
  },

  // ============================================================
  // AUDIT
  // ============================================================
  audit(action, id, before, after) {
    if (AuditLog?.write) {
      AuditLog.write({
        action,
        entity: this.entity,
        entityId: id,
        before,
        after,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // ============================================================
  // HEALTH
  // ============================================================
  health() {
    return HealthContract.create(
      "BaseRepository",
      this._initialized ? "OK" : "WARNING",
      {
        version: this.version,
        entity: this.entity,
        database: !!this._adapter,
      }
    );
  },

  diagnostics() {
    return {
      version: this.version,
      entity: this.entity,
      initialized: this._initialized,
      adapter: !!this._adapter,
    };
  },
};

// Глобальная регистрация
globalThis.BaseRepository = BaseRepository;
Logger.log("BaseRepository GLOBAL READY v" + BaseRepository.version);