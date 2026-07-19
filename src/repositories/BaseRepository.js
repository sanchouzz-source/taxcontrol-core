console.log("BaseRepository");

const BaseRepository = {

  version: "3.0.0",

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

    this.afterCreate(entity, result, meta);
    this.publishEvent(
      entity,
      meta.events?.created,
      AuditConstants.ACTION_CREATE,
      null,
      result
    );

    return result;
  },

  // ---------- FIND BY ID (с учётом soft delete) ----------
  findById(entity, id, options = { includeDeleted: false }) {
    const meta = this.getMeta(entity);
    this.checkPermission(meta, "read");

    const record = Database.find(meta.table, id);
    if (!record) return null;

    if (meta.softDelete !== false) {
      const fields = this.getSoftDeleteFields(meta);
      const isDeleted = record[fields.deleted] === true;
      if (isDeleted && !options.includeDeleted) {
        return null;
      }
    }

    return record;
  },

  // ---------- FIND ALL (с фильтрацией удалённых) ----------
  findAll(entity, filters = {}, options = { includeDeleted: false }) {
    const meta = this.getMeta(entity);
    this.checkPermission(meta, "read");

    let records = Database.query(meta.table, filters);

    if (meta.softDelete !== false && !options.includeDeleted) {
      const fields = this.getSoftDeleteFields(meta);
      records = records.filter(rec => rec[fields.deleted] !== true);
    }

    return records;
  },

  // ---------- COUNT ----------
  count(entity, filters = {}, options = { includeDeleted: false }) {
    const records = this.findAll(entity, filters, options);
    return records ? records.length : 0;
  },

  // ---------- EXISTS (по ID) ----------
  exists(entity, id, options = { includeDeleted: false }) {
    return !!this.findById(entity, id, options);
  },

  // ---------- EXISTS BY (по полю) ----------
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

    // 1. Сохраняем версию ДО изменения
    if (typeof Versioning !== "undefined") {
      Versioning.save(entity, id, existing);
    }

    this.beforeUpdate(entity, existing, data, meta);

    // Передаём только изменяемые поля (данные от пользователя)
    const updateData = { ...data };
    this.applySystemFields(meta, updateData, true); // добавляет UpdatedAt и OrganizationID (если нужно)

    // 2. Обновляем в БД
    const result = Database.update(meta.table, id, updateData);
    if (!result) {
      throw new Error(`Update failed for ${entity} ${id}`);
    }

    // Повторно читаем обновлённую запись
    const updated = Database.find(meta.table, id);
    if (!updated) {
      throw new Error(`Update failed – record not found after update for ${entity} ${id}`);
    }

    this.afterUpdate(entity, existing, updated, meta);

    // 3. Публикуем событие (EventBus + Audit)
    this.publishEvent(
      entity,
      meta.events?.updated,
      AuditConstants.ACTION_UPDATE,
      existing,
      updated
    );

    return updated;
  },

  // ---------- SOFT DELETE FIELDS ----------
  getSoftDeleteFields(meta) {
    return {
      deleted: meta.deleteField || "Deleted",
      deletedAt: meta.deleteDateField || "DeletedAt",
      deletedBy: meta.deleteUserField || "DeletedBy"
    };
  },

  // ---------- DELETE (с отладочными логами) ----------
  delete(entity, id) {
    const meta = this.getMeta(entity);
    this.checkPermission(meta, "delete");

    // Ищем только НЕ удалённую запись
    const existing = this.findById(entity, id, { includeDeleted: false });
    if (!existing) {
      throw new Error(entity + " not found");
    }

    this.beforeDelete(entity, existing, meta);

    let result;

    if (meta.softDelete !== false) {
      // 1. Сохраняем версию ДО изменения
      if (typeof Versioning !== "undefined") {
        Versioning.save(entity, id, existing);
      }

      const fields = this.getSoftDeleteFields(meta);
      const deleted = {
        [fields.deleted]: true,
        [fields.deletedAt]: new Date().toISOString(),
        [fields.deletedBy]: this.getCurrentUser()
      };

      // 2. Обновляем в БД (только изменяемые поля)
      result = Database.update(meta.table, id, deleted);

      // ---------- ВРЕМЕННОЕ ЛОГИРОВАНИЕ (как вы просили) ----------
      Logger.log("DELETE DEBUG RESULT " + JSON.stringify(result));

      const verify = Database.find(meta.table, id);
      Logger.log("DELETE VERIFY " + JSON.stringify(verify));
      // --------------------------------------------------------------

      // Проверяем успешность обновления
      if (!result) {
        throw new Error(`Soft delete failed for ${entity} ${id}`);
      }
    } else {
      // Жёсткое удаление – версионирование не нужно
      result = Database.delete(meta.table, id);
    }

    this.afterDelete(entity, existing, result, meta);

    // 3. Публикуем событие
    this.publishEvent(
      entity,
      meta.events?.deleted,
      AuditConstants.ACTION_DELETE,
      existing,
      result
    );

    return result;
  },

  // ---------- RESTORE ----------
  restore(entity, id) {
    const meta = this.getMeta(entity);
    this.checkPermission(meta, "restore");

    if (meta.softDelete === false) {
      throw new Error("Restore is not supported for this entity (softDelete disabled)");
    }

    // Ищем запись ВКЛЮЧАЯ удалённые (нам нужна именно удалённая)
    const existing = this.findById(entity, id, { includeDeleted: true });
    if (!existing) {
      throw new Error(entity + " not found");
    }

    const fields = this.getSoftDeleteFields(meta);
    if (existing[fields.deleted] !== true) {
      throw new Error(entity + " is not deleted, restore not needed");
    }

    // Подготавливаем только изменяемые поля
    const updateData = {
      [fields.deleted]: false,
      [fields.deletedAt]: null,
      [fields.deletedBy]: null,
      UpdatedAt: new Date().toISOString() // обновляем время
    };

    Logger.log(`RESTORE DEBUG: ${entity} ${id} -> ${JSON.stringify(updateData)}`);

    // 1. Сохраняем версию ДО восстановления
    if (typeof Versioning !== "undefined") {
      Versioning.save(entity, id, existing);
    }

    this.beforeUpdate(entity, existing, updateData, meta);

    // 2. Обновляем в БД
    const result = Database.update(meta.table, id, updateData);
    if (!result) {
      throw new Error(`Restore failed for ${entity} ${id}`);
    }

    // Повторно читаем для подтверждения
    const restored = Database.find(meta.table, id);
    if (!restored) {
      throw new Error(`Restore failed – record not found after update for ${entity} ${id}`);
    }

    this.afterUpdate(entity, existing, restored, meta);

    // 3. Публикуем событие
    this.publishEvent(
      entity,
      meta.events?.restored,
      AuditConstants.ACTION_RESTORE,
      existing,
      restored
    );

    return restored;
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

  // ---------- PUBLISH EVENT (EventBus + Audit) ----------
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
    // Audit уже передан через action, можно дополнительно логировать отдельно при необходимости
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

  // ---------- LIFECYCLE HOOKS (пустые, переопределяются в наследниках) ----------
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
        "IncludeDeletedFilter"
      ]
    });
  }
};

globalThis.BaseRepository = BaseRepository;

Logger.log("BaseRepository READY v" + BaseRepository.version);