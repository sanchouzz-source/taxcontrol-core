// ============================================================
// BaseRepository v6.6.0
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
// Fixed in v6.6.0:
// - every CRUD operation requires the real role permission
// - every read is filtered by active OrganizationID
// - foreign OrganizationID values are rejected on create/update
// - delete/restore cannot target a foreign organization
//
// Fixed in v6.5.0:
// - findWhere/findOne/findBy accept options consistently
// - includeDeleted reaches Database and SpreadsheetAdapter
// - count/exists/search/paginate share the same read contract
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

console.log("BaseRepository v6.6.0");

const BaseRepository = {
  version: "6.6.0",

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
  // SECURITY / ORGANIZATION SCOPE
  // ============================================================

  _requireAccess(
    entity,
    action,
    metadata = null
  ) {
    if (
      typeof SecurityGuard ===
        "undefined" ||
      typeof SecurityGuard
        .requireEntity !==
        "function"
    ) {
      return true;
    }

    return SecurityGuard.requireEntity(
      entity,
      action,
      metadata
    );
  },

  _scopeOptions(
    metadata,
    options = {}
  ) {
    return {
      ...options,
      metadata,
    };
  },

  _scopeCreate(
    entity,
    data,
    metadata,
    options = {}
  ) {
    if (
      typeof OrganizationScope ===
        "undefined"
    ) {
      return { ...data };
    }

    return OrganizationScope
      .prepareCreate(
        entity,
        data,
        this._scopeOptions(
          metadata,
          options
        )
      );
  },

  _scopeUpdate(
    entity,
    existing,
    data,
    metadata,
    options = {}
  ) {
    if (
      typeof OrganizationScope ===
        "undefined"
    ) {
      return { ...data };
    }

    return OrganizationScope
      .prepareUpdate(
        entity,
        existing,
        data,
        this._scopeOptions(
          metadata,
          options
        )
      );
  },

  _scopeCriteria(
    entity,
    criteria,
    metadata,
    options = {}
  ) {
    if (
      typeof OrganizationScope ===
        "undefined"
    ) {
      return {
        ...(criteria || {}),
      };
    }

    return OrganizationScope
      .scopeCriteria(
        entity,
        criteria,
        this._scopeOptions(
          metadata,
          options
        )
      );
  },

  _scopeRecord(
    entity,
    record,
    metadata,
    options = {}
  ) {
    if (
      typeof OrganizationScope ===
        "undefined"
    ) {
      return record;
    }

    return OrganizationScope
      .filterRecord(
        entity,
        record,
        this._scopeOptions(
          metadata,
          options
        )
      );
  },

  _scopeRows(
    entity,
    rows,
    metadata,
    options = {}
  ) {
    if (
      typeof OrganizationScope ===
        "undefined"
    ) {
      return Array.isArray(rows)
        ? rows
        : [];
    }

    return OrganizationScope
      .filterRows(
        entity,
        rows,
        this._scopeOptions(
          metadata,
          options
        )
      );
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

  _prepareCreatePayload(
    entity,
    data,
    options = {}
  ) {
    this._requireEntity(entity, "create");
    this._requireData(data, "create");

    const meta = this.getEntityMeta(entity);
    this._requireAccess(
      entity,
      "CREATE",
      meta
    );

    const payload =
      this._scopeCreate(
        entity,
        data,
        meta,
        options
      );
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
    let opts;

    if (this.entity) {
      entity = this.entity;
      data = entityOrData || {};
      opts = dataOrOptions || {};
    } else {
      entity = this.resolveEntity(entityOrData);
      data = dataOrOptions || {};
      opts = options || {};
    }

    const prepared = this._prepareCreatePayload(
      entity,
      data,
      opts
    );

    let result = this._callAdapter(
      "insert",
      entity,
      prepared.payload,
      opts
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

    const meta = this.getEntityMeta(entity);
    this._requireAccess(
      entity,
      "READ",
      meta
    );

    const result = this._callAdapter(
      "find",
      entity,
      id,
      opts
    );

    if (!result) {
      return null;
    }

    const scopedResult =
      this._scopeRecord(
        entity,
        result,
        meta,
        opts
      );

    if (!scopedResult) {
      return null;
    }

    if (
      meta.softDelete !== false &&
      opts.includeDeleted !== true &&
      this.isDeleted(scopedResult)
    ) {
      return null;
    }

    return scopedResult;
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

    const meta = this.getMeta();

    this._requireAccess(
      this.entity,
      "READ",
      meta
    );

    const scopedFilters =
      this._scopeCriteria(
        this.entity,
        filters,
        meta,
        options
      );

    let rows =
      this._callAdapter(
        "query",
        this.entity,
        scopedFilters,
        options
      ) || [];

    rows = this._scopeRows(
      this.entity,
      rows,
      meta,
      options
    );

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

  findWhere(criteria = {}, options = {}) {
    return this.findAll(
      criteria,
      options
    );
  },

  findBy(field, value, options = {}) {
    if (!field) {
      throw new Error(
        "BaseRepository.findBy: field missing"
      );
    }

    return this.findOne(
      {
        [field]: value,
      },
      options
    );
  },

  // ============================================================
  // FIND ONE
  // ============================================================

  findOne(criteria = {}, options = {}) {
    const rows = this.findAll(
      criteria,
      options
    );

    return rows.length ? rows[0] : null;
  },

  // ============================================================
  // UPDATE
  // ============================================================

  update(
    entityOrId,
    idOrData = {},
    data = {},
    options = {}
  ) {
    this._requireAdapter();

    let entity;
    let id;
    let payload;
    let opts;

    if (this.entity) {
      entity = this.entity;
      id = entityOrId;
      payload = idOrData || {};
      opts = data || {};
    } else {
      entity = this.resolveEntity(entityOrId);
      id = idOrData;
      payload = data || {};
      opts = options || {};
    }

    this._requireEntity(entity, "update");
    this._requireId(id, "update");
    this._requireData(payload, "update");

    const meta = this.getEntityMeta(entity);

    this._requireAccess(
      entity,
      "UPDATE",
      meta
    );

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
          {
            ...opts,
            includeDeleted: true,
          }
        )
      : this.findById(
          entity,
          id,
          {
            ...opts,
            includeDeleted: true,
          }
        );

    if (!old) {
      throw new Error(entity + " not found " + id);
    }

    payload = this._scopeUpdate(
      entity,
      old,
      payload,
      meta,
      opts
    );

    this.applySystemFields(meta, payload, true);

    let result = this._callAdapter(
      "update",
      entity,
      id,
      payload,
      opts
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

    return this._scopeRecord(
      entity,
      result,
      meta,
      opts
    );
  },

  // ============================================================
  // DELETE
  // ============================================================

  delete(
    entityOrId,
    id = null,
    options = {}
  ) {
    this._requireAdapter();

    let entity;
    let key;
    let opts;

    if (this.entity) {
      entity = this.entity;
      key = entityOrId;
      opts =
        id &&
        typeof id === "object"
          ? id
          : options;
    } else {
      entity = this.resolveEntity(entityOrId);
      key = id;
      opts = options || {};
    }

    this._requireEntity(entity, "delete");
    this._requireId(key, "delete");

    const meta = this.getEntityMeta(entity);
    this._requireAccess(
      entity,
      "DELETE",
      meta
    );

    const old = this.entity
      ? this.findById(
          key,
          {
            ...opts,
            includeDeleted: true,
          }
        )
      : this.findById(
          entity,
          key,
          {
            ...opts,
            includeDeleted: true,
          }
        );

    if (!old) {
      throw new Error(entity + " not found " + key);
    }

    if (meta.softDelete !== false) {
      const payload =
        this._scopeUpdate(
          entity,
          old,
          {
            Deleted: true,
            DeletedAt:
              new Date().toISOString(),
          },
          meta,
          opts
        );

      this.applySystemFields(
        meta,
        payload,
        true
      );

      let result = this._callAdapter(
        "update",
        entity,
        key,
        payload,
        opts
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

      return this._scopeRecord(
        entity,
        result,
        meta,
        opts
      );
    }

    const result = this._callAdapter(
      "delete",
      entity,
      key,
      opts
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

  restore(
    entityOrId,
    id = null,
    options = {}
  ) {
    this._requireAdapter();

    let entity;
    let key;
    let opts;

    if (this.entity) {
      entity = this.entity;
      key = entityOrId;
      opts =
        id &&
        typeof id === "object"
          ? id
          : options;
    } else {
      entity = this.resolveEntity(entityOrId);
      key = id;
      opts = options || {};
    }

    this._requireEntity(entity, "restore");
    this._requireId(key, "restore");

    const meta = this.getEntityMeta(entity);
    this._requireAccess(
      entity,
      "RESTORE",
      meta
    );
    const old = this.entity
      ? this.findById(
          key,
          {
            ...opts,
            includeDeleted: true,
          }
        )
      : this.findById(
          entity,
          key,
          {
            ...opts,
            includeDeleted: true,
          }
        );

    if (!old) {
      throw new Error(entity + " not found " + key);
    }

    const payload =
      this._scopeUpdate(
        entity,
        old,
        {
          Deleted: false,
          DeletedAt: null,
        },
        meta,
        opts
      );

    this.applySystemFields(
      meta,
      payload,
      true
    );

    let result = this._callAdapter(
      "update",
      entity,
      key,
      payload,
      opts
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

    return this._scopeRecord(
      entity,
      result,
      meta,
      opts
    );
  },

  // ============================================================
  // EXISTS
  // ============================================================

  exists(
    entityOrId,
    id = null,
    options = {}
  ) {
    if (this.entity) {
      const opts =
        id &&
        typeof id === "object"
          ? id
          : options;

      return !!this.findById(
        entityOrId,
        opts
      );
    }

    return !!this.findById(
      entityOrId,
      id,
      options
    );
  },

  existsBy(field, value, options = {}) {
    return !!this.findBy(
      field,
      value,
      options
    );
  },

  // ============================================================
  // COUNT
  // ============================================================

  count(filters = {}, options = {}) {
    this._requireAdapter();
    const meta = this.getMeta();

    this._requireAccess(
      this.entity,
      "READ",
      meta
    );

    return this.findAll(
      filters,
      options
    ).length;
  },

  getAllCount(options = {}) {
    return this.count({}, options);
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

  search(field, value, options = {}) {
    const rows = this.findAll(
      {},
      options
    );
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

  paginate(
    page = 1,
    limit = 50,
    filters = {},
    options = {}
  ) {
    const rows = this.findAll(
      filters,
      options
    );
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

  bulkCreate(list = [], options = {}) {
    return this.bulkInsert(
      list,
      options
    );
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

  bulkInsert(
    entityOrList,
    list = [],
    options = {}
  ) {
    const adapter = this._requireAdapter();

    let entity;
    let rows;
    let opts;

    if (this.entity) {
      entity = this.entity;
      rows = entityOrList;
      opts =
        list &&
        !Array.isArray(list)
          ? list
          : options;
    } else {
      entity = this.resolveEntity(entityOrList);
      rows = list;
      opts = options || {};
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
          ? this.create(item, opts)
          : this.create(
              entity,
              item,
              opts
            );
      });
    }

    /*
     * Native bulk insert must preserve the same invariants as create():
     * IDs, timestamps, organization context and validation.
     */
    const preparedRows = rows.map((item) => {
      return this._prepareCreatePayload(
        entity,
        item,
        opts
      );
    });

    const payloads = preparedRows.map(
      (item) => item.payload
    );

    let results = adapter.bulkInsert(
      entity,
      payloads,
      opts
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
      typeof OrganizationScope !==
        "undefined" &&
      meta.organizationScope ===
        "FIELD" &&
      !data.OrganizationID
    ) {
      data.OrganizationID =
        SecurityContext
          .getOrganizationId();
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
