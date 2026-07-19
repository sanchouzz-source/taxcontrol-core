console.log("BaseRepository");

const BaseRepository = {

  version: "3.0.0",

  // ---------- НОРМАЛИЗАЦИЯ BOOLEAN (учитывает строки) ----------
  normalizeBoolean(value) {
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (lower === "true") return true;
      if (lower === "false" || lower === "") return false;
    }
    return (
      value === true ||
      value === 1 ||
      value === "1"
    );
  },

  // ---------- НОРМАЛИЗАЦИЯ ЗАПИСИ (приведение Deleted к булеву) ----------
  normalizeRecord(record, meta) {
    if (!record) return record;
    const fields = this.getSoftDeleteFields(meta);
    if (fields && fields.deleted && record[fields.deleted] !== undefined) {
      record[fields.deleted] = this.normalizeBoolean(record[fields.deleted]);
    }
    return record;
  },

  // ---------- CREATE ----------
  create(entity, data = {}) {
    const meta = this.getMeta(entity);
    this.checkPermission(meta, "create");
    this.beforeCreate(entity, data, meta);

    const idField = meta.idField || entity + "ID";
    if (!data[idField]) {
      data[idField] = IdService.generate(entity);
    }

    this.applySystemFields(meta, data);

    const result = Database.insert(meta.table, data);
    // Нормализуем результат перед возвратом
    const normalized = this.normalizeRecord(result, meta);

    this.afterCreate(entity, normalized, meta);
    this.publishEvent(
      entity,
      meta.events?.created,
      AuditConstants.ACTION_CREATE,
      null,
      normalized
    );

    return normalized;
  },

  // ---------- FIND BY ID ----------
  findById(entity, id, options = { includeDeleted: false }) {
    const meta = this.getMeta(entity);
    this.checkPermission(meta, "read");

    const record = Database.find(meta.table, id);
    if (!record) return null;

    if (meta.softDelete !== false) {
      const fields = this.getSoftDeleteFields(meta);
      const isDeleted = this.normalizeBoolean(record[fields.deleted]);
      if (isDeleted && !options.includeDeleted) {
        return null;
      }
    }

    // Нормализуем запись перед возвратом
    return this.normalizeRecord(record, meta);
  },

  // ---------- FIND ALL ----------
  findAll(entity, filters = {}, options = { includeDeleted: false }) {
    const meta = this.getMeta(entity);
    this.checkPermission(meta, "read");

    let records = Database.query(meta.table, filters);

    if (meta.softDelete !== false && !options.includeDeleted) {
      const fields = this.getSoftDeleteFields(meta);
      records = records.filter(rec => {
        const isDeleted = this.normalizeBoolean(rec[fields.deleted]);
        return !isDeleted;
      });
    }

    // Нормализуем каждую запись
    return records.map(rec => this.normalizeRecord(rec, meta));
  },

  // ---------- COUNT ----------
  count(entity, filters = {}, options = { includeDeleted: false }) {
    const records = this.findAll(entity, filters, options);
    return records ? records.length : 0;
  },

  // ---------- EXISTS ----------
  exists(entity, id, options = { includeDeleted: false }) {
    return !!this.findById(entity, id, options);
  },

  // ---------- EXISTS BY ----------
  existsBy(entity, field, value, options = { includeDeleted: false }) {
    const rows = this.findAll(entity, { [field]: value }, options);
    return rows.length > 0;
  },

  // ---------- UPDATE ----------
  update(entity, id, data = {}) {
    const meta = this.getMeta(entity);
    this.checkPermission(meta, "update");

    const existing = this.findById(entity, id, { includeDeleted: false });
    if (!existing) {
      throw new Error(entity + " not found");
    }

    if (typeof Versioning !== "undefined") {
      Versioning.save(entity, id, existing);
    }

    this.beforeUpdate(entity, existing, data, meta);

    const updateData = { ...data };
    this.applySystemFields(meta, updateData, true);

    const result = Database.update(meta.table, id, updateData);
    if (!result) {
      throw new Error(`Update failed for ${entity} ${id}`);
    }

    const updated = Database.find(meta.table, id);
    if (!updated) {
      throw new Error(`Update failed – record not found after update for ${entity} ${id}`);
    }

    const normalized = this.normalizeRecord(updated, meta);
    this.afterUpdate(entity, existing, normalized, meta);
    this.publishEvent(
      entity,
      meta.events?.updated,
      AuditConstants.ACTION_UPDATE,
      existing,
      normalized
    );

    return normalized;
  },

  // ---------- SOFT DELETE FIELDS ----------
  getSoftDeleteFields(meta) {
    return {
      deleted: meta.deleteField || "Deleted",
      deletedAt: meta.deleteDateField || "DeletedAt",
      deletedBy: meta.deleteUserField || "DeletedBy"
    };
  },

  // ---------- DELETE ----------
  delete(entity, id) {
    const meta = this.getMeta(entity);
    this.checkPermission(meta, "delete");

    const existing = this.findById(entity, id, { includeDeleted: false });
    if (!existing) {
      throw new Error(entity + " not found");
    }

    this.beforeDelete(entity, existing, meta);

    let result;

    if (meta.softDelete !== false) {
      if (typeof Versioning !== "undefined") {
        Versioning.save(entity, id, existing);
      }

      const fields = this.getSoftDeleteFields(meta);
      // В БД пишем строку "true"
      const deleted = {
        [fields.deleted]: "true",
        [fields.deletedAt]: new Date().toISOString(),
        [fields.deletedBy]: this.getCurrentUser()
      };

      result = Database.update(meta.table, id, deleted);

      Logger.log("DELETE DEBUG RESULT " + JSON.stringify(result));
      const verify = Database.find(meta.table, id);
      Logger.log("DELETE VERIFY " + JSON.stringify(verify));

      if (!result) {
        throw new Error(`Soft delete failed for ${entity} ${id}`);
      }
    } else {
      result = Database.delete(meta.table, id);
    }

    // После удаления возвращаем результат (может быть объект или true)
    // Для мягкого удаления – нормализуем запись, если она есть
    let normalizedResult = result;
    if (meta.softDelete !== false && result && typeof result === 'object') {
      normalizedResult = this.normalizeRecord(result, meta);
    }

    this.afterDelete(entity, existing, normalizedResult, meta);
    this.publishEvent(
      entity,
      meta.events?.deleted,
      AuditConstants.ACTION_DELETE,
      existing,
      normalizedResult
    );

    return normalizedResult;
  },

  // ---------- RESTORE ----------
  restore(entity, id) {
    const meta = this.getMeta(entity);
    this.checkPermission(meta, "restore");

    if (meta.softDelete === false) {
      throw new Error("Restore is not supported for this entity (softDelete disabled)");
    }

    const existing = this.findById(entity, id, { includeDeleted: true });
    if (!existing) {
      throw new Error(entity + " not found");
    }

    const fields = this.getSoftDeleteFields(meta);
    if (!this.normalizeBoolean(existing[fields.deleted])) {
      throw new Error(entity + " is not deleted, restore not needed");
    }

    // В БД пишем строку "false"
    const updateData = {
      [fields.deleted]: "false",
      [fields.deletedAt]: null,
      [fields.deletedBy]: null
    };

    this.applySystemFields(meta, updateData, true);

    Logger.log(`RESTORE DEBUG: ${entity} ${id} -> ${JSON.stringify(updateData)}`);

    if (typeof Versioning !== "undefined") {
      Versioning.save(entity, id, existing);
    }

    this.beforeUpdate(entity, existing, updateData, meta);

    const result = Database.update(meta.table, id, updateData);
    if (!result) {
      throw new Error(`Restore failed for ${entity} ${id}`);
    }

    const restored = Database.find(meta.table, id);
    if (!restored) {
      throw new Error(`Restore failed – record not found after update for ${entity} ${id}`);
    }

    // Проверяем, что запись теперь видна без includeDeleted
    const verifyAvailable = this.findById(entity, id, { includeDeleted: false });
    if (!verifyAvailable) {
      throw new Error(`Restore succeeded in DB but record is still not visible without includeDeleted for ${entity} ${id}`);
    }
    Logger.log(`RESTORE VERIFY: ${entity} ${id} is now visible without includeDeleted`);

    // Нормализуем запись перед возвратом
    const normalized = this.normalizeRecord(restored, meta);

    this.afterUpdate(entity, existing, normalized, meta);
    this.publishEvent(
      entity,
      meta.events?.restored,
      AuditConstants.ACTION_RESTORE,
      existing,
      normalized
    );

    return normalized;
  },

  // ---------- GET META ----------
  getMeta(entity) {
    const meta = EntityRegistry.get(entity);
    if (!meta) {
      throw new Error("Entity not registered: " + entity);
    }
    return meta;
  },

  // ---------- CHECK PERMISSION ----------
  checkPermission(meta, action) {
    if (typeof SecurityGuard === "undefined") return;
    const permission = meta.permissions?.[action];
    if (permission) {
      SecurityGuard.check(permission);
    }
  },

  // ---------- APPLY SYSTEM FIELDS ----------
  applySystemFields(meta, data, update = false) {
    if (meta.timestamps) {
      const now = new Date().toISOString();
      if (!update) {
        data.CreatedAt = data.CreatedAt || now;
      }
      data.UpdatedAt = now;
    }

    if (meta.organization !== false && typeof OrganizationContext !== "undefined") {
      data.OrganizationID = data.OrganizationID || OrganizationContext.get();
    }
  },

  // ---------- PUBLISH EVENT ----------
  publishEvent(entity, event, action, before, after) {
    if (typeof EventBus === "undefined" || !event) return;
    const entityId = this.extractEntityId(entity, after);
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

  // ---------- EXTRACT ENTITY ID ----------
  extractEntityId(entity, record) {
    if (!record) return "";
    const meta = this.getMeta(entity);
    return record[meta.idField || entity + "ID"] || "";
  },

  // ---------- GET CURRENT USER ----------
  getCurrentUser() {
    if (typeof UserSession !== "undefined" && UserSession.getCurrent) {
      return UserSession.getCurrent();
    }
    return "SYSTEM";
  },

  // ---------- LIFECYCLE HOOKS ----------
  beforeCreate(entity, data, meta) {},
  afterCreate(entity, result, meta) {},
  beforeUpdate(entity, oldData, newData, meta) {},
  afterUpdate(entity, oldData, result, meta) {},
  beforeDelete(entity, data, meta) {},
  afterDelete(entity, oldData, result, meta) {},

  // ---------- HEALTH ----------
  health() {
    return HealthContract.create("BaseRepository", "OK", {
      version: this.version,
      architecture: "EntityRegistry v2.1 compatible",
      features: [
        "CRUD",
        "SoftDelete",
        "Restore",
        "LifecycleHooks",
        "EventBus",
        "Versioning",
        "IncludeDeletedFilter",
        "BooleanNormalization"
      ]
    });
  }
};

globalThis.BaseRepository = BaseRepository;

Logger.log("BaseRepository READY v" + BaseRepository.version);