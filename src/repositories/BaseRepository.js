// ============================================================
// BaseRepository v5.4.1
// Enterprise Repository Base
// Единое определение idField во всех методах
// ============================================================

console.log("BaseRepository v5.4.1");

const BaseRepository = {
  version: "5.4.1",
  _adapter: null,

  // ----- ИНИЦИАЛИЗАЦИЯ АДАПТЕРА -----
  init(adapter) {
    this._adapter = adapter || Database;
    if (!this._adapter) {
      throw new Error("Repository adapter not provided");
    }
    Logger.log("BaseRepository initialized with adapter v" + this.version);
  },

  // ----- ПРОВЕРКА АДАПТЕРА -----
  _requireAdapter() {
    if (!this._adapter) {
      throw new Error("BaseRepository adapter not initialized. Call BaseRepository.init(Database) first.");
    }
    if (typeof this._adapter._require === "function") {
      this._adapter._require();
    }
  },

  // ============================================================
  // ОСНОВНЫЕ МЕТОДЫ
  // ============================================================

  // ----- CREATE -----
  create(entity, data = {}) {
    this._requireAdapter();
    const payload = { ...data };
    const meta = this.getMeta(entity);

    if (typeof EntityValidator !== "undefined") {
      EntityValidator.validate(entity, payload);
    }

    this.checkPermission(meta, "create");
    this.beforeCreate(entity, payload, meta);

    // ОБНОВЛЕНО: единое определение idField
    const idField = meta.idField || meta.primaryKey || "id";
    if (!payload[idField]) {
      payload[idField] = IdService.generate(entity);
    }

    this.applySystemFields(meta, payload);

    const result = this._adapter.insert(meta.table, payload);

    this.afterCreate(entity, result, meta);
    this.emit(entity, meta.events?.created, null, result, "CREATE");
    this.audit("CREATE", entity, result[idField], null, result);

    return result;
  },

  // ----- FIND BY ID -----
  findById(entity, id, options = {}) {
    this._requireAdapter();
    const meta = this.getMeta(entity);
    this.checkPermission(meta, "read");

    const record = this._adapter.find(meta.table, id);
    if (!record) return null;

    if (meta.softDelete !== false && !options.includeDeleted) {
      if (this.isDeleted(record, meta)) return null;
    }
    return record;
  },

  // ----- FIND ALL -----
  findAll(entity, filters = {}, options = {}) {
    this._requireAdapter();
    const meta = this.getMeta(entity);
    this.checkPermission(meta, "read");

    let rows = this._adapter.query(meta.table, filters);

    if (meta.softDelete !== false && !options.includeDeleted) {
      rows = rows.filter(r => !this.isDeleted(r, meta));
    }
    return rows;
  },

  // ----- FIND WHERE -----
  findWhere(entity, field, value) {
    return this.findAll(entity, { [field]: value });
  },

  // ----- EXISTS -----
  exists(entity, id) {
    return !!this.findById(entity, id);
  },

  // ----- EXISTS BY -----
  existsBy(entity, field, value) {
    const rows = this.findAll(entity, { [field]: value });
    return rows.length > 0;
  },

  // ----- COUNT -----
  count(entity, filters = {}) {
    return this.findAll(entity, filters).length;
  },

  // ----- PAGINATE -----
  paginate(entity, page = 1, limit = 50, filters = {}, options = {}) {
    const rows = this.findAll(entity, filters, options);
    const start = (page - 1) * limit;
    const data = rows.slice(start, start + limit);
    return {
      data: data,
      page: page,
      limit: limit,
      total: rows.length,
      pages: Math.ceil(rows.length / limit)
    };
  },

  // ----- UPDATE -----
  update(entity, id, data = {}) {
    this._requireAdapter();
    const meta = this.getMeta(entity);
    this.checkPermission(meta, "update");

    const old = this.findById(entity, id, { includeDeleted: true });
    if (!old) throw new Error(entity + " not found");

    const payload = { ...data };
    this._protectSystemFields(meta, payload);

    const full = { ...old, ...payload };
    if (typeof EntityValidator !== "undefined") {
      EntityValidator.validate(entity, full);
    }

    if (typeof Versioning !== "undefined") {
      Versioning.save(entity, id, old);
    }

    this.beforeUpdate(entity, old, payload, meta);
    this.applySystemFields(meta, payload, true);

    const result = this._adapter.update(meta.table, id, payload);
    if (!result) throw new Error("Update failed " + entity);

    this.afterUpdate(entity, old, result, meta);
    this.emit(entity, meta.events?.updated, old, result, "UPDATE");
    this.audit("UPDATE", entity, id, old, result);

    return result;
  },

  // ----- DELETE -----
  delete(entity, id) {
    this._requireAdapter();
    const meta = this.getMeta(entity);
    this.checkPermission(meta, "delete");

    const old = this.findById(entity, id, { includeDeleted: true });
    if (!old) throw new Error(entity + " not found");

    this.beforeDelete(entity, old, meta);

    let result;
    if (meta.softDelete === false) {
      result = this._adapter.delete(meta.table, id);
    } else {
      const fields = this.getDeleteFields(meta);
      const update = {};
      update[fields.deleted] = "true";
      update[fields.date] = new Date().toISOString();
      update[fields.user] = this.getCurrentUser();
      this.applySystemFields(meta, update, true);
      result = this._adapter.update(meta.table, id, update);
    }

    this.afterDelete(entity, old, result, meta);
    this.emit(entity, meta.events?.deleted, old, result, "DELETE");
    this.audit("DELETE", entity, id, old, result);

    return result;
  },

  // ----- RESTORE -----
  restore(entity, id) {
    this._requireAdapter();
    const meta = this.getMeta(entity);
    this.checkPermission(meta, "restore");
    if (meta.softDelete === false) {
      throw new Error("Restore disabled for " + entity);
    }

    const old = this.findById(entity, id, { includeDeleted: true });
    if (!old) throw new Error(entity + " not found");

    this.beforeRestore(entity, old, meta);

    const fields = this.getDeleteFields(meta);
    const update = {};
    update[fields.deleted] = "false";
    update[fields.date] = null;
    update[fields.user] = null;
    this.applySystemFields(meta, update, true);

    const result = this._adapter.update(meta.table, id, update);

    this.afterRestore(entity, old, result, meta);
    this.emit(entity, meta.events?.restored, old, result, "RESTORE");
    this.audit("RESTORE", entity, id, old, result);

    return result;
  },

  // ----- BULK CREATE -----
  bulkCreate(entity, items, options = {}) {
    this._requireAdapter();
    if (!items || !items.length) return [];
    const meta = this.getMeta(entity);
    // ОБНОВЛЕНО: единое определение idField
    const idField = meta.idField || meta.primaryKey || "id";

    if (options.skipHooks === true) {
      const prepared = items.map(item => {
        const payload = { ...item };
        if (!payload[idField]) {
          payload[idField] = IdService.generate(entity);
        }
        this.applySystemFields(meta, payload);
        return payload;
      });
      if (typeof this._adapter.bulkInsert === "function") {
        return this._adapter.bulkInsert(meta.table, prepared);
      }
      const results = [];
      for (const data of prepared) {
        results.push(this._adapter.insert(meta.table, data));
      }
      return results;
    }

    return items.map(item => this.create(entity, item));
  },

  // ----- BULK UPDATE -----
  bulkUpdate(entity, ids, data, options = {}) {
    this._requireAdapter();
    if (!ids || !ids.length) return [];

    if (ids.length > 500) {
      Logger.warn("Large bulk update: " + ids.length + " records. Consider using skipHooks:true for performance.");
    }

    const meta = this.getMeta(entity);

    if (options.skipHooks === true) {
      const payload = { ...data };
      this._protectSystemFields(meta, payload);
      this.applySystemFields(meta, payload, true);
      const results = [];
      for (const id of ids) {
        const result = this._adapter.update(meta.table, id, payload);
        results.push(result);
      }
      return results;
    }

    return ids.map(id => this.update(entity, id, data));
  },

  // ----- TRANSACTION -----
  transaction(callback) {
    this._requireAdapter();
    if (this._adapter.beginTransaction && typeof this._adapter.beginTransaction === "function") {
      this._adapter.beginTransaction();
      try {
        const result = callback();
        if (this._adapter.commit && typeof this._adapter.commit === "function") {
          this._adapter.commit();
        }
        return result;
      } catch (e) {
        if (this._adapter.rollback && typeof this._adapter.rollback === "function") {
          this._adapter.rollback();
        }
        throw e;
      }
    }
    return callback();
  },

  // ============================================================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ============================================================

  // ----- GET META (самодостаточная) -----
  getMeta(entity) {
    if (!entity) {
      throw new Error("Repository entity name is empty");
    }

    if (
      typeof SchemaRegistry !== "undefined" &&
      typeof SchemaRegistry.get === "function"
    ) {
      const schema = SchemaRegistry.get(entity);
      if (schema) {
        return {
          ...schema,
          entity: schema.entity || entity,
          table: schema.table || entity,
          idField: schema.idField || schema.primaryKey || "id"
        };
      }
    }

    if (
      typeof EntityMetadata !== "undefined" &&
      typeof EntityMetadata.get === "function"
    ) {
      const meta = EntityMetadata.get(entity);
      if (meta) {
        return {
          ...meta,
          entity: meta.entity || entity,
          table: meta.table || entity,
          idField: meta.idField || "id"
        };
      }
    }

    if (
      this._adapter &&
      typeof this._adapter.getMetadata === "function"
    ) {
      const meta = this._adapter.getMetadata(entity);
      if (meta) {
        return meta;
      }
    }

    throw new Error("Metadata missing for entity " + entity);
  },

  isDeleted(record, meta) {
    const field = meta.deleteField || "Deleted";
    const val = record[field];
    return (
      val === true ||
      val === "true" ||
      val === 1 ||
      val === "1"
    );
  },

  getDeleteFields(meta) {
    return {
      deleted: meta.deleteField || "Deleted",
      date: meta.deleteDateField || "DeletedAt",
      user: meta.deleteUserField || "DeletedBy"
    };
  },

  // ----- ЗАЩИТА СИСТЕМНЫХ ПОЛЕЙ (обновлено) -----
  _protectSystemFields(meta, data) {
    // ОБНОВЛЕНО: единое определение idField
    const idField = meta.idField || meta.primaryKey || "id";
    const protectedFields = [
      idField,
      "CreatedAt",
      "CreatedBy",
      "OrganizationID",
      "TenantID"
    ];
    for (const field of protectedFields) {
      if (data[field] !== undefined) {
        delete data[field];
      }
    }
  },

  // ----- ПРИМЕНЕНИЕ СИСТЕМНЫХ ПОЛЕЙ -----
  applySystemFields(meta, data, update = false) {
    const now = new Date().toISOString();
    const user = this.getCurrentUser();

    if (meta.timestamps !== false) {
      if (!update) {
        data.CreatedAt = data.CreatedAt || now;
        data.CreatedBy = data.CreatedBy || user;
      }
      data.UpdatedAt = now;
      data.UpdatedBy = user;
    }

    if (typeof OrganizationContext !== "undefined" && meta.organization !== false) {
      if (!data.OrganizationID) {
        data.OrganizationID = OrganizationContext.get();
      }
    }

    if (typeof TenantContext !== "undefined" && meta.tenant !== false) {
      if (!data.TenantID) {
        data.TenantID = TenantContext.get();
      }
    }
  },

  // ----- ПРОВЕРКА ПРАВ -----
  checkPermission(meta, action) {
    if (typeof SecurityGuard === "undefined") return;
    const permission = meta.permissions?.[action];
    if (permission) {
      SecurityGuard.check(permission);
    }
  },

  // ----- АУДИТ -----
  audit(action, entity, entityId, before, after) {
    if (typeof AuditLog === "undefined" || !AuditLog.write) return;
    try {
      AuditLog.write({
        action: action,
        entity: entity,
        entityId: entityId,
        before: before !== null && before !== undefined ? JSON.stringify(before) : null,
        after: after !== null && after !== undefined ? JSON.stringify(after) : null,
        user: this.getCurrentUser(),
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      Logger.warn("Audit failed: " + e.message);
    }
  },

  // ----- СОБЫТИЯ (обновлено) -----
  emit(entity, event, before, after, action) {
    if (typeof EventBus === "undefined" || !event) return;
    const meta = this.getMeta(entity);
    // ОБНОВЛЕНО: единое определение idField
    const idField = meta.idField || meta.primaryKey || "id";
    const entityId = after ? after[idField] : null;
    EventBus.emit(event, {
      entity,
      entityId,
      action,
      before,
      after,
      source: "BaseRepository",
      timestamp: new Date().toISOString()
    });
  },

  // ----- ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ -----
  getCurrentUser() {
    if (typeof UserSession !== "undefined" && UserSession.getCurrent) {
      return UserSession.getCurrent();
    }
    return "SYSTEM";
  },

  // ============================================================
  // HOOKS
  // ============================================================
  beforeCreate() {},
  afterCreate() {},
  beforeUpdate() {},
  afterUpdate() {},
  beforeDelete() {},
  afterDelete() {},
  beforeRestore() {},
  afterRestore() {},

  // ============================================================
  // HEALTH
  // ============================================================
  health() {
    const data = {
      version: this.version,
      architecture: "Repository Adapter Pattern",
      features: [
        "CRUD",
        "SoftDelete",
        "Restore",
        "Permissions",
        "Validation",
        "Versioning",
        "EventBus",
        "OrganizationScope",
        "TenantScope",
        "AuditLog",
        "Transactions",
        "BulkOperations",
        "Pagination",
        "ExistsBy"
      ],
      adapter: {
        name: this._adapter ? this._adapter.constructor.name : "none",
        initialized: !!this._adapter
      }
    };
    if (typeof HealthContract !== "undefined") {
      return HealthContract.create("BaseRepository", "OK", data);
    }
    return { module: "BaseRepository", status: "OK", ...data };
  }
};

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================
if (typeof Database !== "undefined") {
  BaseRepository.init(Database);
}

globalThis.BaseRepository = BaseRepository;

Logger.log("BaseRepository READY v" + BaseRepository.version);