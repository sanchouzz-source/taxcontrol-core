// ============================================================
// BaseRepository v6.4.0
// Enterprise Repository Base
// TaxControl ERP Core
//
// Sprint 5 CORE-005
//
// Compatible:
// Database v5.2+
// EntityRegistry v2.4+
// RepositoryFactory v3+
// EntityService v5+
// ERPDiagnostics v6+
// RepositoryHealthReport v2+
// ERPControlCenter v1+
//
// Fixed in v6.4.0:
// - BaseRepository is the only owner of entity CRUD events
// - soft delete emits DELETED instead of UPDATED
// - restore emits RESTORED instead of UPDATED
// - every lifecycle event contains the canonical entityId
//
// Fixed in v6.3.1:
// - update() correctly reads the old row in a bound repository
// - delete() correctly calls update() in both supported API modes
// - restore() correctly calls update() in both supported API modes
// - bulkInsert() fallback correctly calls create() in a bound repository
// - bulkInsert() applies IDs, validation and system fields before native bulk insert
// - the technical BASE repository is no longer registered as a business entity
//
// Supported API modes:
//
// 1. Bound repository:
//    const repo = BaseRepository.createRepository("CLIENT");
//    repo.update(id, data);
//
// 2. Direct BaseRepository API:
//    BaseRepository.update("CLIENT", id, data);
// ============================================================

console.log("BaseRepository v6.4.0");

const BaseRepository = {
  version: "6.4.0",

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

    /*
     * BaseRepository itself is an infrastructure prototype, not an ERP entity.
     * It must not be registered under the artificial key BASE.
     *
     * A repository for a concrete entity is registered by RepositoryFactory
     * or by the entity-specific repository file.
     */

    return true;
  },

  // ============================================================
  // RESET
  // ============================================================

  reset() {
    Logger.warn("BaseRepository RESET");

    this._initialized = false;
    this._adapter = null;
    this.entity = null;

    Logger.log("BaseRepository RESET COMPLETE");

    return true;
  },

  // ============================================================
  // READY
  // ============================================================

  ready() {
    return this._initialized && !!this._adapter;
  },

  // ============================================================
  // DEPENDENCIES
  // ============================================================

  dependencies() {
    return {
      Database: typeof Database !== "undefined",
      EntityRegistry: typeof EntityRegistry !== "undefined",
      RepositoryFactory: typeof RepositoryFactory !== "undefined",
      RepositoryRegistry: typeof RepositoryRegistry !== "undefined",
      EventBus: typeof EventBus !== "undefined",
    };
  },

  // ============================================================
  // REQUIRE
  // ============================================================

  _requireAdapter() {
    if (!this._initialized) {
      this.init();
    }

    if (!this._adapter) {
      throw new Error("BaseRepository adapter missing");
    }

    return this._adapter;
  },

  _requireEntity(entity, operation) {
    if (!entity) {
      throw new Error(
        "BaseRepository." + operation + ": entity missing"
      );
    }

    return entity;
  },

  _requireId(id, operation) {
    if (id === undefined || id === null || id === "") {
      throw new Error(
        "BaseRepository." + operation + ": id missing"
      );
    }

    return id;
  },

  _requireData(data, operation) {
    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      throw new Error(
        "BaseRepository." + operation +
          ": data must be an object"
      );
    }

    return data;
  },

  // ============================================================
  // ADAPTER CALL
  // ============================================================

  _callAdapter(method, ...args) {
    const adapter = this._requireAdapter();

    if (
      !adapter[method] ||
      typeof adapter[method] !== "function"
    ) {
      throw new Error(
        "Adapter method '" + method + "' not found"
      );
    }

    return adapter[method](...args);
  },

  // ============================================================
  // ENTITY RESOLVE
  // ============================================================

  resolveEntity(entity) {
    if (
      typeof EntityRegistry !== "undefined" &&
      typeof EntityRegistry.resolve === "function"
    ) {
      try {
        return EntityRegistry.resolve(entity);
      } catch (e) {
        // The original value is returned below.
      }
    }

    return entity;
  },

  // ============================================================
  // ENTITY METADATA
  // ============================================================

  getEntityMeta(entity) {
    if (typeof EntityRegistry === "undefined") {
      throw new Error("EntityRegistry unavailable");
    }

    if (
      !EntityRegistry.get ||
      typeof EntityRegistry.get !== "function"
    ) {
      throw new Error("EntityRegistry.get unavailable");
    }

    const meta = EntityRegistry.get(entity);

    if (!meta) {
      throw new Error(
        "Metadata not found for entity: " + entity
      );
    }

    return meta;
  },

  // ============================================================
  // FACTORY
  // ============================================================

  createRepository(entity) {
    const resolvedEntity = this.resolveEntity(entity);

    this._requireEntity(
      resolvedEntity,
      "createRepository"
    );

    const repository = Object.create(this);

    repository.entity = resolvedEntity;
    repository._initialized = false;
    repository._adapter = null;

    repository.init(
      this._adapter ||
        (typeof Database !== "undefined" ? Database : null)
    );

    return repository;
  },

  // ============================================================
  // META
  // ============================================================

  getMeta(entity = null) {
    const name = entity || this.entity;

    this._requireEntity(name, "getMeta");

    return this.getEntityMeta(name);
  },

  getRepositoryName() {
    return (this.entity || "BASE") + "Repository";
  },

  // ============================================================
  // CREATE PAYLOAD
  // ============================================================

  _prepareCreatePayload(entity, data) {
    this._requireEntity(entity, "create");
    this._requireData(data, "create");

    const meta = this.getEntityMeta(entity);
    const payload = { ...data };
    const idField = meta.idField || "ID";

    if (!payload[idField]) {
      if (
        typeof IdService === "undefined" ||
        typeof IdService.generate !== "function"
      ) {
        throw new Error(
          "BaseRepository.create: IdService unavailable"
        );
      }

      payload[idField] = IdService.generate(entity);
    }

    this.applySystemFields(meta, payload, false);

    if (
      typeof EntityValidator !== "undefined" &&
      typeof EntityValidator.validate === "function"
    ) {
      EntityValidator.validate(entity, payload);
    }

    return {
      meta,
      payload,
      idField,
    };
  },

  // ============================================================
  // CREATE
  // ============================================================

  create(entityOrData, dataOrOptions = {}, options = {}) {
    this._requireAdapter();

    let entity;
    let data;

    if (this.entity) {
      entity = this.entity;
      data = entityOrData || {};
    } else {
      entity = this.resolveEntity(entityOrData);
      data = dataOrOptions || {};
    }

    const prepared = this._prepareCreatePayload(
      entity,
      data
    );

    let result = this._callAdapter(
      "insert",
      entity,
      prepared.payload
    );

    if (!result || typeof result !== "object") {
      result = { ...prepared.payload };
    }

    this.emit(
      prepared.meta.events?.created,
      null,
      result,
      "CREATE",
      entity
    );

    this.audit(
      "CREATE",
      entity,
      prepared.payload[prepared.idField],
      null,
      result
    );

    return result;
  },

  // ============================================================
  // FIND BY ID
  // ============================================================

  findById(entityOrId, idOrOptions = {}, options = {}) {
    this._requireAdapter();

    let entity;
    let id;
    let opts;

    if (this.entity) {
      entity = this.entity;
      id = entityOrId;
      opts = idOrOptions || {};
    } else {
      entity = this.resolveEntity(entityOrId);
      id = idOrOptions;
      opts = options || {};
    }

    this._requireEntity(entity, "findById");
    this._requireId(id, "findById");

    const result = this._callAdapter(
      "find",
      entity,
      id
    );

    if (!result) {
      return null;
    }

    const meta = this.getEntityMeta(entity);

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

    if (!this.entity) {
      throw new Error(
        "findAll requires repository entity"
      );
    }

    let rows =
      this._callAdapter(
        "query",
        this.entity,
        filters
      ) || [];

    const meta = this.getMeta();

    if (
      meta.softDelete !== false &&
      options.includeDeleted !== true
    ) {
      rows = rows.filter(
        (row) => !this.isDeleted(row)
      );
    }

    return rows;
  },

  findWhere(criteria = {}) {
    return this.findAll(criteria);
  },

  // ============================================================
  // FIND ONE
  // ============================================================

  findOne(criteria = {}) {
    const rows = this.findAll(criteria);

    return rows.length ? rows[0] : null;
  },

  // ============================================================
  // UPDATE
  // ============================================================

  update(entityOrId, idOrData = {}, data = {}) {
    this._requireAdapter();

    let entity;
    let id;
    let payload;

    if (this.entity) {
      entity = this.entity;
      id = entityOrId;
      payload = idOrData || {};
    } else {
      entity = this.resolveEntity(entityOrId);
      id = idOrData;
      payload = data || {};
    }

    this._requireEntity(entity, "update");
    this._requireId(id, "update");
    this._requireData(payload, "update");

    /*
     * IMPORTANT:
     *
     * A bound repository accepts findById(id, options).
     * BaseRepository accepts findById(entity, id, options).
     *
     * v6.3.0 always used the second form. For a bound repository,
     * the entity name therefore became the record ID.
     */
    const old = this.entity
      ? this.findById(
          id,
          { includeDeleted: true }
        )
      : this.findById(
          entity,
          id,
          { includeDeleted: true }
        );

    if (!old) {
      throw new Error(entity + " not found " + id);
    }

    payload = { ...payload };

    const meta = this.getEntityMeta(entity);

    this.applySystemFields(meta, payload, true);

    let result = this._callAdapter(
      "update",
      entity,
      id,
      payload
    );

    if (!result || typeof result !== "object") {
      result = {
        ...old,
        ...payload,
      };
    }

    this.emit(
      meta.events?.updated,
      old,
      result,
      "UPDATE",
      entity
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

  delete(entityOrId, id = null) {
    this._requireAdapter();

    let entity;
    let key;

    if (this.entity) {
      entity = this.entity;
      key = entityOrId;
    } else {
      entity = this.resolveEntity(entityOrId);
      key = id;
    }

    this._requireEntity(entity, "delete");
    this._requireId(key, "delete");

    const meta = this.getEntityMeta(entity);

    const old = this.entity
      ? this.findById(
          key,
          { includeDeleted: true }
        )
      : this.findById(
          entity,
          key,
          { includeDeleted: true }
        );

    if (!old) {
      throw new Error(entity + " not found " + key);
    }

    if (meta.softDelete !== false) {
      const payload = {
        Deleted: true,
        DeletedAt: new Date().toISOString(),
      };

      this.applySystemFields(
        meta,
        payload,
        true
      );

      let result = this._callAdapter(
        "update",
        entity,
        key,
        payload
      );

      if (
        !result ||
        typeof result !== "object"
      ) {
        result = {
          ...old,
          ...payload,
        };
      }

      this.emit(
        meta.events?.deleted,
        old,
        result,
        "DELETE",
        entity
      );

      this.audit(
        "DELETE",
        entity,
        key,
        old,
        result
      );

      return result;
    }

    const result = this._callAdapter(
      "delete",
      entity,
      key
    );

    this.emit(
      meta.events?.deleted,
      old,
      null,
      "DELETE",
      entity
    );

    this.audit(
      "DELETE",
      entity,
      key,
      old,
      null
    );

    return result;
  },

  // ============================================================
  // RESTORE
  // ============================================================

  restore(entityOrId, id = null) {
    this._requireAdapter();

    let entity;
    let key;

    if (this.entity) {
      entity = this.entity;
      key = entityOrId;
    } else {
      entity = this.resolveEntity(entityOrId);
      key = id;
    }

    this._requireEntity(entity, "restore");
    this._requireId(key, "restore");

    const meta = this.getEntityMeta(entity);
    const old = this.entity
      ? this.findById(
          key,
          { includeDeleted: true }
        )
      : this.findById(
          entity,
          key,
          { includeDeleted: true }
        );

    if (!old) {
      throw new Error(entity + " not found " + key);
    }

    const payload = {
      Deleted: false,
      DeletedAt: null,
    };

    this.applySystemFields(
      meta,
      payload,
      true
    );

    let result = this._callAdapter(
      "update",
      entity,
      key,
      payload
    );

    if (
      !result ||
      typeof result !== "object"
    ) {
      result = {
        ...old,
        ...payload,
      };
    }

    this.emit(
      meta.events?.restored,
      old,
      result,
      "RESTORE",
      entity
    );

    this.audit(
      "RESTORE",
      entity,
      key,
      old,
      result
    );

    return result;
  },

  // ============================================================
  // EXISTS
  // ============================================================

  exists(entityOrId, id = null) {
    if (this.entity) {
      return !!this.findById(entityOrId);
    }

    return !!this.findById(entityOrId, id);
  },

  existsBy(field, value) {
    return this.findAll({
      [field]: value,
    }).length > 0;
  },

  // ============================================================
  // COUNT
  // ============================================================

  count(filters = {}) {
    const adapter = this._requireAdapter();

    if (
      adapter.count &&
      typeof adapter.count === "function"
    ) {
      try {
        return adapter.count(
          this.entity,
          filters
        );
      } catch (e) {
        // The findAll fallback is used below.
      }
    }

    return this.findAll(filters).length;
  },

  getAllCount() {
    return this.count();
  },

  countDeleted() {
    return this.findAll(
      {},
      { includeDeleted: true }
    ).filter(
      (row) => this.isDeleted(row)
    ).length;
  },

  // ============================================================
  // SEARCH
  // ============================================================

  search(field, value) {
    const rows = this.findAll();
    const searchValue =
      String(value).toLowerCase();

    return rows.filter((row) => {
      const fieldValue =
        String(row[field] || "").toLowerCase();

      return fieldValue.includes(searchValue);
    });
  },

  // ============================================================
  // PAGINATE
  // ============================================================

  paginate(page = 1, limit = 50, filters = {}) {
    const rows = this.findAll(filters);
    const start = (page - 1) * limit;

    return {
      page,
      limit,
      total: rows.length,
      data: rows.slice(start, start + limit),
    };
  },

  // ============================================================
  // BULK
  // ============================================================

  bulkCreate(list = []) {
    return this.bulkInsert(list);
  },

  bulkUpdate(ids, data) {
    if (!Array.isArray(ids)) {
      throw new Error(
        "bulkUpdate requires array of ids"
      );
    }

    return ids.map(
      (id) => this.update(id, data)
    );
  },

  // ============================================================
  // BULK INSERT
  // ============================================================

  bulkInsert(entityOrList, list = []) {
    const adapter = this._requireAdapter();

    let entity;
    let rows;

    if (this.entity) {
      entity = this.entity;
      rows = entityOrList;
    } else {
      entity = this.resolveEntity(entityOrList);
      rows = list;
    }

    this._requireEntity(entity, "bulkInsert");

    if (!Array.isArray(rows)) {
      throw new Error(
        "bulkInsert requires array of items"
      );
    }

    if (!rows.length) {
      return [];
    }

    /*
     * If the adapter has no native bulkInsert(), create every row through
     * the correct public API form. This was broken for bound repositories
     * in v6.3.0 because create(entity, item) was used there as well.
     */
    if (
      !adapter.bulkInsert ||
      typeof adapter.bulkInsert !== "function"
    ) {
      return rows.map((item) => {
        return this.entity
          ? this.create(item)
          : this.create(entity, item);
      });
    }

    /*
     * Native bulk insert must preserve the same invariants as create():
     * IDs, timestamps, organization context and validation.
     */
    const preparedRows = rows.map((item) => {
      return this._prepareCreatePayload(
        entity,
        item
      );
    });

    const payloads = preparedRows.map(
      (item) => item.payload
    );

    let results = adapter.bulkInsert(
      entity,
      payloads
    );

    if (
      !Array.isArray(results) ||
      results.length !== payloads.length
    ) {
      results = payloads.map(
        (payload) => ({ ...payload })
      );
    }

    results.forEach((result, index) => {
      const prepared = preparedRows[index];

      this.emit(
        prepared.meta.events?.created,
        null,
        result,
        "CREATE",
        entity
      );

      this.audit(
        "CREATE",
        entity,
        prepared.payload[prepared.idField],
        null,
        result
      );
    });

    return results;
  },

  // ============================================================
  // TRANSACTION
  // ============================================================

  transaction(callback) {
    const adapter = this._requireAdapter();

    if (typeof callback !== "function") {
      throw new Error(
        "transaction requires callback"
      );
    }

    if (
      adapter.transaction &&
      typeof adapter.transaction === "function"
    ) {
      return adapter.transaction(callback);
    }

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
        data.CreatedAt =
          data.CreatedAt || now;
      }

      data.UpdatedAt = now;
    }

    if (
      typeof OrganizationContext !== "undefined" &&
      meta.organization !== false &&
      !data.OrganizationID
    ) {
      data.OrganizationID =
        OrganizationContext.get();
    }

    return data;
  },

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

  emit(event, before, after, action, entity = null) {
    if (
      !event ||
      typeof EventBus === "undefined" ||
      !EventBus.emit
    ) {
      return false;
    }

    const entityName = entity || this.entity;
    const meta = this.getEntityMeta(entityName);
    const idField = meta.idField || "ID";
    const entityId =
      after?.[idField] ??
      before?.[idField] ??
      null;

    return EventBus.emit(event, {
      entity: entityName,
      entityId,
      action,
      before,
      after,
      payload: after ?? before ?? null,
      source: "BaseRepository",
      timestamp: new Date().toISOString(),
      metadata: {
        publisher: "BaseRepository",
        repository:
          this.getRepositoryName(),
      },
    }, {
      source: "BaseRepository",
    });
  },

  // ============================================================
  // AUDIT
  // ============================================================

  audit(action, entity, id, before, after) {
    if (
      typeof AuditLog === "undefined" ||
      !AuditLog.write
    ) {
      return;
    }

    AuditLog.write({
      action,
      entity,
      entityId: id,
      before,
      after,
      timestamp: new Date().toISOString(),
    });
  },

  // ============================================================
  // ADAPTER DIAGNOSTICS
  // ============================================================

  adapterMethods() {
    const adapter = this._adapter;

    if (!adapter) {
      return [];
    }

    return Object.keys(adapter).filter(
      (key) => typeof adapter[key] === "function"
    );
  },

  // ============================================================
  // HEALTH
  // ============================================================

  health() {
    const data = {
      version: this.version,
      entity: this.entity,
      initialized: this._initialized,
      adapter: !!this._adapter,
      adapterMethodsCount:
        this.adapterMethods().length,
      databaseReady:
        typeof Database !== "undefined" &&
        Database.initialized === true,
    };

    const status =
      this.ready() ? "OK" : "WARNING";

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
      module: "BaseRepository",
      status,
      ...data,
    };
  },

  // ============================================================
  // DIAGNOSTICS
  // ============================================================

  diagnostics() {
    return {
      version: this.version,
      entity: this.entity,
      initialized: this._initialized,
      adapter: !!this._adapter,
      repositoryName: this.getRepositoryName(),
      adapterMethods: this.adapterMethods(),
      ready: this.ready(),
      dependencies: this.dependencies(),
    };
  },
};

// ============================================================
// GLOBAL EXPORT
// ============================================================

globalThis.BaseRepository = BaseRepository;

Logger.log(
  "BaseRepository GLOBAL READY v" +
    BaseRepository.version
);
