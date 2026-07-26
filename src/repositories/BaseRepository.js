// ============================================================
// BaseRepository v5.5.0
// Enterprise Repository Base
// TaxControl ERP Core
//
// Возможности:
// - универсальный CRUD;
// - мягкое удаление и восстановление;
// - проверка прав;
// - EntityValidator;
// - Versioning;
// - EventBus;
// - AuditLog;
// - Organization/Tenant scope;
// - пакетные операции;
// - пагинация;
// - транзакционный интерфейс;
// - защищённое получение метаданных;
// - диагностика и HealthContract.
// ============================================================

console.log("BaseRepository v5.5.0");


const BaseRepository = {

  version: "5.5.0",

  architecture: "Repository Adapter Pattern",

  _adapter: null,

  _initializedAt: null,


  // ============================================================
  // ИНИЦИАЛИЗАЦИЯ
  // ============================================================

  init(adapter) {

    const resolvedAdapter =
      adapter ||
      (
        typeof Database !== "undefined"
          ? Database
          : null
      );

    if (!resolvedAdapter) {
      throw new Error(
        "BaseRepository.init: repository adapter not provided"
      );
    }

    this._adapter = resolvedAdapter;
    this._initializedAt = new Date().toISOString();

    Logger.log(
      "BaseRepository initialized with adapter v" +
      this.version
    );

    return true;

  },


  // ============================================================
  // ПРОВЕРКА АДАПТЕРА
  // ============================================================

  _requireAdapter() {

    if (!this._adapter) {
      throw new Error(
        "BaseRepository adapter not initialized. " +
        "Call BaseRepository.init(Database) first."
      );
    }

    if (
      typeof this._adapter._require === "function"
    ) {
      this._adapter._require();
    }

    return this._adapter;

  },


  // ============================================================
  // CREATE
  // ============================================================

  create(entity, data = {}, options = {}) {

    this._requireAdapter();
    this.requireEntity(entity);

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      throw new Error(
        "BaseRepository.create: data must be an object"
      );
    }

    const meta = this.getMeta(entity);
    const payload = { ...data };

    this.checkPermission(
      meta,
      "create"
    );

    if (
      options.skipValidation !== true &&
      typeof EntityValidator !== "undefined" &&
      typeof EntityValidator.validate === "function"
    ) {
      EntityValidator.validate(
        entity,
        payload
      );
    }

    this.beforeSave(
      entity,
      null,
      payload,
      meta,
      "CREATE"
    );

    this.beforeCreate(
      entity,
      payload,
      meta
    );

    const idField =
      meta.idField ||
      meta.primaryKey ||
      entity + "ID";

    if (!payload[idField]) {

      if (
        typeof IdService === "undefined" ||
        typeof IdService.generate !== "function"
      ) {
        throw new Error(
          "IdService unavailable for entity " +
          entity
        );
      }

      payload[idField] =
        IdService.generate(entity);

    }

    this.applySystemFields(
      meta,
      payload,
      false
    );

    const result =
      this._adapter.insert(
        meta.table,
        payload
      );

    if (!result) {
      throw new Error(
        "Create failed " + entity
      );
    }

    this.afterCreate(
      entity,
      result,
      meta
    );

    this.afterSave(
      entity,
      null,
      result,
      meta,
      "CREATE"
    );

    this.emit(
      entity,
      meta.events?.created,
      null,
      result,
      "CREATE"
    );

    this.audit(
      "CREATE",
      entity,
      result[idField] || payload[idField],
      null,
      result
    );

    return result;

  },


  // ============================================================
  // FIND BY ID
  // ============================================================

  findById(entity, id, options = {}) {

    this._requireAdapter();
    this.requireEntity(entity);
    this.requireId(entity, id, "findById");

    const meta = this.getMeta(entity);

    this.checkPermission(
      meta,
      "read"
    );

    const record =
      this._adapter.find(
        meta.table,
        id
      );

    if (!record) {
      return null;
    }

    if (
      meta.softDelete !== false &&
      options.includeDeleted !== true &&
      this.isDeleted(record, meta)
    ) {
      return null;
    }

    return record;

  },


  // ============================================================
  // FIND ALL
  // ============================================================

  findAll(entity, filters = {}, options = {}) {

    this._requireAdapter();
    this.requireEntity(entity);

    const meta = this.getMeta(entity);

    this.checkPermission(
      meta,
      "read"
    );

    const safeFilters =
      filters &&
      typeof filters === "object" &&
      !Array.isArray(filters)
        ? filters
        : {};

    let rows =
      this._adapter.query(
        meta.table,
        safeFilters
      );

    if (!Array.isArray(rows)) {
      rows = [];
    }

    if (
      meta.softDelete !== false &&
      options.includeDeleted !== true
    ) {
      rows = rows.filter(
        (record) =>
          !this.isDeleted(record, meta)
      );
    }

    return rows;

  },


  // ============================================================
  // FIND WHERE
  // ============================================================

  findWhere(
    entity,
    field,
    value,
    options = {}
  ) {

    this.requireEntity(entity);

    if (!field) {
      throw new Error(
        "BaseRepository.findWhere: field required"
      );
    }

    return this.findAll(
      entity,
      {
        [field]: value
      },
      options
    );

  },


  // ============================================================
  // EXISTS
  // ============================================================

  exists(entity, id, options = {}) {

    return !!this.findById(
      entity,
      id,
      options
    );

  },


  // ============================================================
  // EXISTS BY
  // ============================================================

  existsBy(
    entity,
    field,
    value,
    options = {}
  ) {

    const rows =
      this.findWhere(
        entity,
        field,
        value,
        options
      );

    return rows.length > 0;

  },


  // ============================================================
  // COUNT
  // ============================================================

  count(
    entity,
    filters = {},
    options = {}
  ) {

    return this.findAll(
      entity,
      filters,
      options
    ).length;

  },


  // ============================================================
  // PAGINATION
  // ============================================================

  paginate(
    entity,
    page = 1,
    limit = 50,
    filters = {},
    options = {}
  ) {

    const normalizedPage =
      Math.max(
        1,
        Number(page) || 1
      );

    const normalizedLimit =
      Math.max(
        1,
        Number(limit) || 50
      );

    const rows =
      this.findAll(
        entity,
        filters,
        options
      );

    const start =
      (normalizedPage - 1) *
      normalizedLimit;

    const data =
      rows.slice(
        start,
        start + normalizedLimit
      );

    return {

      data,

      page: normalizedPage,

      limit: normalizedLimit,

      total: rows.length,

      pages:
        rows.length === 0
          ? 0
          : Math.ceil(
              rows.length /
              normalizedLimit
            )

    };

  },


  // ============================================================
  // UPDATE
  // ============================================================

  update(
    entity,
    id,
    data = {},
    options = {}
  ) {

    this._requireAdapter();
    this.requireEntity(entity);
    this.requireId(entity, id, "update");

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      throw new Error(
        "BaseRepository.update: data must be an object"
      );
    }

    const meta = this.getMeta(entity);

    this.checkPermission(
      meta,
      "update"
    );

    const old =
      this.findById(
        entity,
        id,
        {
          includeDeleted: true
        }
      );

    if (!old) {
      throw new Error(
        entity + " not found: " + id
      );
    }

    const payload = { ...data };

    this._protectSystemFields(
      meta,
      payload
    );

    const full = {
      ...old,
      ...payload
    };

    if (
      options.skipValidation !== true &&
      typeof EntityValidator !== "undefined" &&
      typeof EntityValidator.validate === "function"
    ) {
      EntityValidator.validate(
        entity,
        full
      );
    }

    if (
      options.skipVersioning !== true &&
      typeof Versioning !== "undefined" &&
      typeof Versioning.save === "function"
    ) {
      Versioning.save(
        entity,
        id,
        old
      );
    }

    this.beforeSave(
      entity,
      old,
      payload,
      meta,
      "UPDATE"
    );

    this.beforeUpdate(
      entity,
      old,
      payload,
      meta
    );

    this.applySystemFields(
      meta,
      payload,
      true
    );

    const result =
      this._adapter.update(
        meta.table,
        id,
        payload
      );

    if (!result) {
      throw new Error(
        "Update failed " +
        entity +
        ": " +
        id
      );
    }

    this.afterUpdate(
      entity,
      old,
      result,
      meta
    );

    this.afterSave(
      entity,
      old,
      result,
      meta,
      "UPDATE"
    );

    this.emit(
      entity,
      meta.events?.updated,
      old,
      result,
      "UPDATE"
    );

    this.audit(
      "UPDATE",
      entity,
      id,
      old,
      result
    );

    return result;

  },


  // ============================================================
  // DELETE
  // ============================================================

  delete(entity, id, options = {}) {

    this._requireAdapter();
    this.requireEntity(entity);
    this.requireId(entity, id, "delete");

    const meta = this.getMeta(entity);

    this.checkPermission(
      meta,
      "delete"
    );

    const old =
      this.findById(
        entity,
        id,
        {
          includeDeleted: true
        }
      );

    if (!old) {
      throw new Error(
        entity + " not found: " + id
      );
    }

    if (
      meta.softDelete !== false &&
      this.isDeleted(old, meta) &&
      options.allowRepeatedDelete !== true
    ) {
      return old;
    }

    this.beforeDelete(
      entity,
      old,
      meta
    );

    let result;

    if (meta.softDelete === false) {

      result =
        this._adapter.delete(
          meta.table,
          id
        );

    } else {

      const fields =
        this.getDeleteFields(meta);

      const update = {};

      update[fields.deleted] = true;
      update[fields.date] =
        new Date().toISOString();
      update[fields.user] =
        this.getCurrentUser();

      this.applySystemFields(
        meta,
        update,
        true
      );

      result =
        this._adapter.update(
          meta.table,
          id,
          update
        );

    }

    if (!result) {
      throw new Error(
        "Delete failed " +
        entity +
        ": " +
        id
      );
    }

    this.afterDelete(
      entity,
      old,
      result,
      meta
    );

    this.emit(
      entity,
      meta.events?.deleted,
      old,
      result,
      "DELETE"
    );

    this.audit(
      "DELETE",
      entity,
      id,
      old,
      result
    );

    return result;

  },


  // ============================================================
  // RESTORE
  // ============================================================

  restore(entity, id, options = {}) {

    this._requireAdapter();
    this.requireEntity(entity);
    this.requireId(entity, id, "restore");

    const meta = this.getMeta(entity);

    this.checkPermission(
      meta,
      "restore"
    );

    if (meta.softDelete === false) {
      throw new Error(
        "Restore disabled for " + entity
      );
    }

    const old =
      this.findById(
        entity,
        id,
        {
          includeDeleted: true
        }
      );

    if (!old) {
      throw new Error(
        entity + " not found: " + id
      );
    }

    if (
      !this.isDeleted(old, meta) &&
      options.allowActiveRestore !== true
    ) {
      return old;
    }

    this.beforeRestore(
      entity,
      old,
      meta
    );

    const fields =
      this.getDeleteFields(meta);

    const update = {};

    update[fields.deleted] = false;
    update[fields.date] = null;
    update[fields.user] = null;

    this.applySystemFields(
      meta,
      update,
      true
    );

    this.beforeSave(
      entity,
      old,
      update,
      meta,
      "RESTORE"
    );

    const result =
      this._adapter.update(
        meta.table,
        id,
        update
      );

    if (!result) {
      throw new Error(
        "Restore failed " +
        entity +
        ": " +
        id
      );
    }

    this.afterRestore(
      entity,
      old,
      result,
      meta
    );

    this.afterSave(
      entity,
      old,
      result,
      meta,
      "RESTORE"
    );

    this.emit(
      entity,
      meta.events?.restored,
      old,
      result,
      "RESTORE"
    );

    this.audit(
      "RESTORE",
      entity,
      id,
      old,
      result
    );

    return result;

  },


  // ============================================================
  // BULK CREATE
  // ============================================================

  bulkCreate(
    entity,
    items = [],
    options = {}
  ) {

    this._requireAdapter();
    this.requireEntity(entity);

    if (!Array.isArray(items)) {
      throw new Error(
        "BaseRepository.bulkCreate: items must be an array"
      );
    }

    if (items.length === 0) {
      return [];
    }

    const meta = this.getMeta(entity);

    this.checkPermission(
      meta,
      "create"
    );

    const idField =
      meta.idField ||
      meta.primaryKey ||
      entity + "ID";

    if (options.skipHooks === true) {

      const prepared =
        items.map((item, index) => {

          if (
            !item ||
            typeof item !== "object" ||
            Array.isArray(item)
          ) {
            throw new Error(
              "BaseRepository.bulkCreate: invalid item at index " +
              index
            );
          }

          const payload = {
            ...item
          };

          if (!payload[idField]) {

            if (
              typeof IdService === "undefined" ||
              typeof IdService.generate !== "function"
            ) {
              throw new Error(
                "IdService unavailable for " +
                entity
              );
            }

            payload[idField] =
              IdService.generate(entity);

          }

          if (
            options.skipValidation !== true &&
            typeof EntityValidator !== "undefined" &&
            typeof EntityValidator.validate === "function"
          ) {
            EntityValidator.validate(
              entity,
              payload
            );
          }

          this.applySystemFields(
            meta,
            payload,
            false
          );

          return payload;

        });

      if (
        typeof this._adapter.bulkInsert === "function"
      ) {
        return this._adapter.bulkInsert(
          meta.table,
          prepared
        );
      }

      const results = [];

      for (const payload of prepared) {
        results.push(
          this._adapter.insert(
            meta.table,
            payload
          )
        );
      }

      return results;

    }

    return items.map(
      (item) =>
        this.create(
          entity,
          item,
          options
        )
    );

  },


  // ============================================================
  // BULK UPDATE
  // ============================================================

  bulkUpdate(
    entity,
    ids = [],
    data = {},
    options = {}
  ) {

    this._requireAdapter();
    this.requireEntity(entity);

    if (!Array.isArray(ids)) {
      throw new Error(
        "BaseRepository.bulkUpdate: ids must be an array"
      );
    }

    if (ids.length === 0) {
      return [];
    }

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      throw new Error(
        "BaseRepository.bulkUpdate: data must be an object"
      );
    }

    if (ids.length > 500) {
      Logger.warn(
        "Large bulk update: " +
        ids.length +
        " records. Consider using skipHooks:true."
      );
    }

    const meta = this.getMeta(entity);

    this.checkPermission(
      meta,
      "update"
    );

    if (options.skipHooks === true) {

      const payload = {
        ...data
      };

      this._protectSystemFields(
        meta,
        payload
      );

      this.applySystemFields(
        meta,
        payload,
        true
      );

      const results = [];

      for (const id of ids) {

        this.requireId(
          entity,
          id,
          "bulkUpdate"
        );

        const result =
          this._adapter.update(
            meta.table,
            id,
            {
              ...payload
            }
          );

        results.push(result);

      }

      return results;

    }

    return ids.map(
      (id) =>
        this.update(
          entity,
          id,
          data,
          options
        )
    );

  },


  // ============================================================
  // TRANSACTION
  // ============================================================

  transaction(callback) {

    this._requireAdapter();

    if (typeof callback !== "function") {
      throw new Error(
        "BaseRepository.transaction: callback required"
      );
    }

    const hasBegin =
      typeof this._adapter.beginTransaction ===
      "function";

    if (!hasBegin) {
      return callback(this);
    }

    this._adapter.beginTransaction();

    try {

      const result =
        callback(this);

      if (
        typeof this._adapter.commit ===
        "function"
      ) {
        this._adapter.commit();
      }

      return result;

    } catch (e) {

      if (
        typeof this._adapter.rollback ===
        "function"
      ) {
        try {
          this._adapter.rollback();
        } catch (rollbackError) {
          Logger.error(
            "Transaction rollback failed: " +
            rollbackError.message
          );
        }
      }

      throw e;

    }

  },


  // ============================================================
  // GET META
  //
  // Приоритет:
  // 1. SchemaRegistry
  // 2. EntityRegistry
  // 3. Database
  // 4. EntityMetadata
  // ============================================================

  getMeta(entity) {

    this.requireEntity(entity);

    let meta = null;

    if (
      typeof SchemaRegistry !== "undefined" &&
      typeof SchemaRegistry.get === "function"
    ) {
      meta = SchemaRegistry.get(entity);
    }

    if (
      !meta &&
      typeof EntityRegistry !== "undefined" &&
      typeof EntityRegistry.get === "function"
    ) {
      meta = EntityRegistry.get(entity);
    }

    if (
      !meta &&
      typeof Database !== "undefined" &&
      typeof Database.getMetadata === "function"
    ) {
      meta = Database.getMetadata(entity);
    }

    if (
      !meta &&
      typeof EntityMetadata !== "undefined" &&
      typeof EntityMetadata.get === "function"
    ) {
      meta = EntityMetadata.get(entity);
    }

    if (!meta) {
      throw new Error(
        "Metadata missing for entity " +
        entity
      );
    }

    if (!meta.table) {
      throw new Error(
        "Metadata table missing for entity " +
        entity
      );
    }

    return meta;

  },


  // ============================================================
  // ПРОВЕРКА УДАЛЕНИЯ
  // ============================================================

  isDeleted(record, meta) {

    if (!record) {
      return false;
    }

    const field =
      meta.deleteField ||
      "Deleted";

    const value =
      record[field];

    return (
      value === true ||
      value === "true" ||
      value === 1 ||
      value === "1" ||
      value === "yes" ||
      value === "YES"
    );

  },


  // ============================================================
  // ПОЛЯ SOFT DELETE
  // ============================================================

  getDeleteFields(meta) {

    return {

      deleted:
        meta.deleteField ||
        "Deleted",

      date:
        meta.deleteDateField ||
        "DeletedAt",

      user:
        meta.deleteUserField ||
        "DeletedBy"

    };

  },


  // ============================================================
  // ЗАЩИТА СИСТЕМНЫХ ПОЛЕЙ
  // ============================================================

  _protectSystemFields(meta, data) {

    const idField =
      meta.idField ||
      meta.primaryKey ||
      "id";

    const protectedFields = [

      idField,

      "CreatedAt",

      "CreatedBy",

      "OrganizationID",

      "TenantID"

    ];

    protectedFields.forEach(
      (field) => {

        if (
          Object.prototype.hasOwnProperty.call(
            data,
            field
          )
        ) {
          delete data[field];
        }

      }
    );

    return data;

  },


  // ============================================================
  // СИСТЕМНЫЕ ПОЛЯ
  // ============================================================

  applySystemFields(
    meta,
    data,
    update = false
  ) {

    const now =
      new Date().toISOString();

    const user =
      this.getCurrentUser();

    if (meta.timestamps !== false) {

      if (!update) {

        data.CreatedAt =
          data.CreatedAt ||
          now;

        data.CreatedBy =
          data.CreatedBy ||
          user;

      }

      data.UpdatedAt = now;
      data.UpdatedBy = user;

    }

    if (
      typeof OrganizationContext !== "undefined" &&
      meta.organization !== false &&
      !data.OrganizationID
    ) {

      if (
        typeof OrganizationContext.get === "function"
      ) {
        data.OrganizationID =
          OrganizationContext.get();
      }

    }

    if (
      typeof TenantContext !== "undefined" &&
      meta.tenant !== false &&
      !data.TenantID
    ) {

      if (
        typeof TenantContext.get === "function"
      ) {
        data.TenantID =
          TenantContext.get();
      }

    }

    return data;

  },


  // ============================================================
  // ПРОВЕРКА ПРАВ
  // ============================================================

  checkPermission(meta, action) {

    if (
      typeof SecurityGuard === "undefined" ||
      typeof SecurityGuard.check !== "function"
    ) {
      return true;
    }

    const permission =
      meta.permissions?.[action];

    if (!permission) {
      return true;
    }

    SecurityGuard.check(permission);

    return true;

  },


  // ============================================================
  // AUDIT
  // ============================================================

  audit(
    action,
    entity,
    entityId,
    before,
    after
  ) {

    if (
      typeof AuditLog === "undefined" ||
      typeof AuditLog.write !== "function"
    ) {
      return false;
    }

    try {

      AuditLog.write({

        action,

        entity,

        entityId,

        before:
          before !== null &&
          before !== undefined
            ? this.safeStringify(before)
            : null,

        after:
          after !== null &&
          after !== undefined
            ? this.safeStringify(after)
            : null,

        user:
          this.getCurrentUser(),

        timestamp:
          new Date().toISOString()

      });

      return true;

    } catch (e) {

      Logger.warn(
        "Audit failed " +
        entity +
        " " +
        action +
        ": " +
        e.message
      );

      return false;

    }

  },


  // ============================================================
  // SAFE STRINGIFY
  // ============================================================

  safeStringify(value) {

    try {
      return JSON.stringify(value);
    } catch (e) {

      Logger.warn(
        "Object serialization failed: " +
        e.message
      );

      return "[Unserializable object]";

    }

  },


  // ============================================================
  // EVENTS
  // ============================================================

  emit(
    entity,
    event,
    before,
    after,
    action
  ) {

    if (
      typeof EventBus === "undefined" ||
      typeof EventBus.emit !== "function" ||
      !event
    ) {
      return false;
    }

    try {

      const meta =
        this.getMeta(entity);

      const idField =
        meta.idField ||
        meta.primaryKey ||
        "id";

      const entityId =
        after?.[idField] ??
        before?.[idField] ??
        null;

      EventBus.emit(
        event,
        {

          entity,

          entityId,

          action,

          before,

          after,

          source:
            "BaseRepository",

          timestamp:
            new Date().toISOString()

        }
      );

      return true;

    } catch (e) {

      Logger.warn(
        "Event emit failed " +
        entity +
        " " +
        action +
        ": " +
        e.message
      );

      return false;

    }

  },


  // ============================================================
  // ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ
  // ============================================================

  getCurrentUser() {

    if (
      typeof UserSession !== "undefined" &&
      typeof UserSession.getCurrent === "function"
    ) {

      const user =
        UserSession.getCurrent();

      if (user) {
        return user;
      }

    }

    return "SYSTEM";

  },


  // ============================================================
  // ПРОВЕРКИ АРГУМЕНТОВ
  // ============================================================

  requireEntity(entity) {

    if (
      entity === undefined ||
      entity === null ||
      entity === ""
    ) {
      throw new Error(
        "BaseRepository: entity required"
      );
    }

    return true;

  },


  requireId(entity, id, method) {

    if (
      id === undefined ||
      id === null ||
      id === ""
    ) {
      throw new Error(
        "BaseRepository." +
        method +
        ": id required for " +
        entity
      );
    }

    return true;

  },


  // ============================================================
  // HOOKS
  // ============================================================

  beforeSave() {},

  afterSave() {},

  beforeCreate() {},

  afterCreate() {},

  beforeUpdate() {},

  afterUpdate() {},

  beforeDelete() {},

  afterDelete() {},

  beforeRestore() {},

  afterRestore() {},


  // ============================================================
  // DIAGNOSTICS
  // ============================================================

  diagnostics() {

    const adapterName =
      this._adapter
        ? (
            this._adapter.name ||
            this._adapter.module ||
            this._adapter.constructor?.name ||
            "Object"
          )
        : null;

    return {

      version:
        this.version,

      architecture:
        this.architecture,

      initialized:
        !!this._adapter,

      initializedAt:
        this._initializedAt,

      adapter: {

        available:
          !!this._adapter,

        name:
          adapterName,

        version:
          this._adapter?.version ||
          null

      },

      repositoryFactory: {

        available:
          typeof RepositoryFactory !==
          "undefined",

        initialized:
          typeof RepositoryFactory !==
            "undefined"
            ? !!RepositoryFactory.initialized
            : false,

        count:
          typeof RepositoryFactory !==
            "undefined" &&
          typeof RepositoryFactory.count ===
            "function"
            ? RepositoryFactory.count()
            : 0

      },

      timestamp:
        new Date().toISOString()

    };

  },


  // ============================================================
  // HEALTH
  // ============================================================

  health() {

    const diagnostics =
      this.diagnostics();

    const data = {

      version:
        this.version,

      architecture:
        this.architecture,

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

        "ExistsBy",

        "LifecycleHooks",

        "SafeMetadataFallback",

        "Diagnostics"

      ],

      adapter:
        diagnostics.adapter,

      repositoryFactory:
        diagnostics.repositoryFactory,

      initializedAt:
        this._initializedAt

    };

    const status =
      this._adapter
        ? "OK"
        : "WARNING";

    if (
      typeof HealthContract !== "undefined" &&
      typeof HealthContract.create === "function"
    ) {
      return HealthContract.create(
        "BaseRepository",
        status,
        data
      );
    }

    return {

      module:
        "BaseRepository",

      status,

      ...data

    };

  }

};


// ============================================================
// GLOBAL EXPORT
// Экспорт выполняется до отложенной инициализации, чтобы
// SystemInit и другие модули видели BaseRepository.
// ============================================================

globalThis.BaseRepository =
  BaseRepository;


// ============================================================
// ИНИЦИАЛИЗАЦИЯ BASE REPOSITORY
// ============================================================

function initBaseRepository() {

  if (
    BaseRepository._adapter
  ) {

    Logger.debug(
      "BaseRepository already initialized"
    );

    return true;

  }

  if (
    typeof Database !== "undefined"
  ) {

    BaseRepository.init(
      Database
    );

    Logger.log(
      "BaseRepository READY v" +
      BaseRepository.version
    );

    return true;

  }

  Logger.warn(
    "Database not ready. BaseRepository initialization delayed."
  );

  return false;

}


// ============================================================
// SYSTEM INIT REGISTRATION
// ============================================================

if (
  typeof SystemInit !== "undefined" &&
  typeof SystemInit.register === "function"
) {

  SystemInit.register(
    "BaseRepository",
    initBaseRepository
  );

} else {

  initBaseRepository();

}