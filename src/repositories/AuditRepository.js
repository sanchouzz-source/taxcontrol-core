// ============================================================
// AuditRepository v1.0.0
// TaxControl ERP
//
// Системный репозиторий журнала аудита.
//
// Важно:
// - записи аудита неизменяемые;
// - create выполняется напрямую через Database adapter;
// - BaseRepository.create не используется, чтобы исключить
//   рекурсивный вызов AuditLog.write();
// - update/delete/restore запрещены.
// ============================================================

console.log("AuditRepository v1.0.0");


const AuditRepository = {

  version: "1.0.0",

  entity: "AUDIT",

  table: "AuditLog",

  architecture: "Append-Only System Repository",


  // ============================================================
  // CREATE
  // ============================================================

  create(data = {}, options = {}) {

    this.requireObject(
      data,
      "create"
    );

    this.requireBaseRepository();

    const meta = this.getMeta();

    BaseRepository._requireAdapter();

    BaseRepository.checkPermission(
      meta,
      "create"
    );

    const payload = {
      ...data
    };

    const idField =
      meta.idField ||
      meta.primaryKey ||
      "AuditID";

    if (!payload[idField]) {

      if (
        typeof IdService === "undefined" ||
        typeof IdService.generate !== "function"
      ) {
        throw new Error(
          "AuditRepository.create: IdService unavailable"
        );
      }

      payload[idField] =
        IdService.generate(this.entity);

    }

    if (
      options.skipValidation !== true &&
      typeof EntityValidator !== "undefined" &&
      typeof EntityValidator.validate === "function"
    ) {
      EntityValidator.validate(
        this.entity,
        payload
      );
    }

    BaseRepository.applySystemFields(
      meta,
      payload,
      false
    );

    const result =
      BaseRepository._adapter.insert(
        meta.table,
        payload
      );

    if (!result) {
      throw new Error(
        "AuditRepository.create: insert failed"
      );
    }

    /*
     * Здесь намеренно не вызываются:
     *
     * BaseRepository.audit()
     * AuditLog.write()
     *
     * Иначе создание записи аудита может вызвать
     * бесконечную рекурсию.
     */

    if (
      options.skipEvents !== true &&
      typeof EventBus !== "undefined" &&
      typeof EventBus.emit === "function" &&
      meta.events?.created
    ) {

      try {

        EventBus.emit(
          meta.events.created,
          {
            entity: this.entity,
            entityId: result[idField] || payload[idField],
            action: "CREATE",
            before: null,
            after: result,
            source: "AuditRepository",
            timestamp: new Date().toISOString()
          }
        );

      } catch (error) {

        Logger.warn(
          "AuditRepository event failed: " +
          error.message
        );

      }

    }

    return result;

  },


  // ============================================================
  // FIND BY ID
  // ============================================================

  findById(id, options = {}) {

    this.requireId(
      id,
      "findById"
    );

    return BaseRepository.findById(
      this.entity,
      id,
      {
        ...options,
        includeDeleted: true
      }
    );

  },


  // ============================================================
  // GET
  // ============================================================

  get(id, options = {}) {

    return this.findById(
      id,
      options
    );

  },


  // ============================================================
  // FIND ALL
  // ============================================================

  findAll(filters = {}, options = {}) {

    this.requireObject(
      filters,
      "findAll"
    );

    return BaseRepository.findAll(
      this.entity,
      filters,
      {
        ...options,
        includeDeleted: true
      }
    );

  },


  // ============================================================
  // FIND WHERE
  // ============================================================

  findWhere(field, value, options = {}) {

    this.requireField(
      field,
      "findWhere"
    );

    return BaseRepository.findWhere(
      this.entity,
      field,
      value,
      {
        ...options,
        includeDeleted: true
      }
    );

  },


  // ============================================================
  // COUNT
  // ============================================================

  count(filters = {}, options = {}) {

    this.requireObject(
      filters,
      "count"
    );

    return BaseRepository.count(
      this.entity,
      filters,
      {
        ...options,
        includeDeleted: true
      }
    );

  },


  // ============================================================
  // EXISTS
  // ============================================================

  exists(id, options = {}) {

    this.requireId(
      id,
      "exists"
    );

    return BaseRepository.exists(
      this.entity,
      id,
      {
        ...options,
        includeDeleted: true
      }
    );

  },


  // ============================================================
  // EXISTS BY
  // ============================================================

  existsBy(field, value, options = {}) {

    this.requireField(
      field,
      "existsBy"
    );

    return BaseRepository.existsBy(
      this.entity,
      field,
      value,
      {
        ...options,
        includeDeleted: true
      }
    );

  },


  // ============================================================
  // PAGINATION
  // ============================================================

  paginate(
    page = 1,
    limit = 50,
    filters = {},
    options = {}
  ) {

    this.requireObject(
      filters,
      "paginate"
    );

    return BaseRepository.paginate(
      this.entity,
      page,
      limit,
      filters,
      {
        ...options,
        includeDeleted: true
      }
    );

  },


  // ============================================================
  // UPDATE
  // ============================================================

  update(id, data = {}, options = {}) {

    this.requireId(
      id,
      "update"
    );

    throw new Error(
      "AuditRepository.update: audit records are immutable"
    );

  },


  // ============================================================
  // DELETE
  // ============================================================

  delete(id, options = {}) {

    this.requireId(
      id,
      "delete"
    );

    throw new Error(
      "AuditRepository.delete: audit records cannot be deleted"
    );

  },


  // ============================================================
  // RESTORE
  // ============================================================

  restore(id, options = {}) {

    this.requireId(
      id,
      "restore"
    );

    throw new Error(
      "AuditRepository.restore: restore is not supported"
    );

  },


  // ============================================================
  // BULK CREATE
  // ============================================================

  bulkCreate(items = [], options = {}) {

    if (!Array.isArray(items)) {
      throw new Error(
        "AuditRepository.bulkCreate: items must be an array"
      );
    }

    if (items.length === 0) {
      return [];
    }

    return items.map(
      item => this.create(
        item,
        options
      )
    );

  },


  // ============================================================
  // BULK UPDATE
  // ============================================================

  bulkUpdate(ids = [], data = {}, options = {}) {

    throw new Error(
      "AuditRepository.bulkUpdate: audit records are immutable"
    );

  },


  // ============================================================
  // METADATA
  // ============================================================

  getMeta() {

    if (
      typeof BaseRepository !== "undefined" &&
      typeof BaseRepository.getMeta === "function"
    ) {
      return BaseRepository.getMeta(
        this.entity
      );
    }

    if (
      typeof SchemaRegistry !== "undefined" &&
      typeof SchemaRegistry.get === "function"
    ) {

      const meta =
        SchemaRegistry.get(
          this.entity
        );

      if (meta) {
        return meta;
      }

    }

    if (
      typeof EntityRegistry !== "undefined" &&
      typeof EntityRegistry.get === "function"
    ) {

      const meta =
        EntityRegistry.get(
          this.entity
        );

      if (meta) {
        return meta;
      }

    }

    return {
      entity: this.entity,
      table: this.table,
      idField: "AuditID",
      softDelete: false
    };

  },


  // ============================================================
  // VALIDATION HELPERS
  // ============================================================

  requireBaseRepository() {

    if (
      typeof BaseRepository === "undefined"
    ) {
      throw new Error(
        "AuditRepository: BaseRepository unavailable"
      );
    }

    return true;

  },


  requireId(id, method) {

    if (
      id === undefined ||
      id === null ||
      id === ""
    ) {
      throw new Error(
        "AuditRepository." +
        method +
        ": id required"
      );
    }

    return true;

  },


  requireField(field, method) {

    if (
      field === undefined ||
      field === null ||
      field === ""
    ) {
      throw new Error(
        "AuditRepository." +
        method +
        ": field required"
      );
    }

    return true;

  },


  requireObject(data, method) {

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      throw new Error(
        "AuditRepository." +
        method +
        ": object required"
      );
    }

    return true;

  },


  // ============================================================
  // DIAGNOSTICS
  // ============================================================

  diagnostics() {

    let metadata = null;
    let metadataError = null;

    try {

      metadata =
        this.getMeta();

    } catch (error) {

      metadataError =
        error.message;

    }

    const factoryAvailable =
      typeof RepositoryFactory !== "undefined";

    const registered =
      factoryAvailable &&
      typeof RepositoryFactory.has === "function"
        ? RepositoryFactory.has(this.entity)
        : false;

    return {

      version: this.version,

      entity: this.entity,

      table:
        metadata?.table ||
        this.table,

      idField:
        metadata?.idField ||
        metadata?.primaryKey ||
        "AuditID",

      architecture:
        this.architecture,

      immutable: true,

      appendOnly: true,

      baseRepository: {

        available:
          typeof BaseRepository !== "undefined",

        initialized:
          typeof BaseRepository !== "undefined"
            ? !!BaseRepository._adapter
            : false,

        version:
          typeof BaseRepository !== "undefined"
            ? BaseRepository.version || null
            : null

      },

      repositoryFactory: {
        available: factoryAvailable,
        registered
      },

      metadata: {
        available: !!metadata,
        error: metadataError
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

    const healthy =
      diagnostics.baseRepository.available &&
      diagnostics.baseRepository.initialized &&
      diagnostics.metadata.available;

    const status =
      healthy
        ? "OK"
        : "WARNING";

    const details = {

      version: this.version,

      entity: this.entity,

      table: diagnostics.table,

      idField: diagnostics.idField,

      architecture:
        this.architecture,

      appendOnly: true,

      immutable: true,

      baseRepository:
        diagnostics.baseRepository,

      repositoryFactory:
        diagnostics.repositoryFactory,

      metadata:
        diagnostics.metadata,

      features: [
        "Create",
        "Read",
        "FindAll",
        "FindWhere",
        "Count",
        "Exists",
        "Pagination",
        "BulkCreate",
        "ImmutableRecords",
        "RecursionProtection",
        "Diagnostics"
      ]

    };

    if (
      typeof HealthContract !== "undefined" &&
      typeof HealthContract.create === "function"
    ) {
      return HealthContract.create(
        "AuditRepository",
        status,
        details
      );
    }

    return {
      module: "AuditRepository",
      status,
      ...details
    };

  }

};


// ============================================================
// GLOBAL EXPORT
// ============================================================

globalThis.AuditRepository =
  AuditRepository;


// ============================================================
// REPOSITORY FACTORY REGISTRATION
// ============================================================

try {

  if (
    typeof RepositoryFactory !== "undefined"
  ) {

    if (
      typeof RepositoryFactory.notifyLoaded === "function"
    ) {

      RepositoryFactory.notifyLoaded(
        AuditRepository.entity,
        AuditRepository
      );

    } else if (
      typeof RepositoryFactory.registerLoaded === "function"
    ) {

      RepositoryFactory.registerLoaded(
        AuditRepository.entity,
        AuditRepository
      );

    } else if (
      typeof RepositoryFactory.register === "function"
    ) {

      RepositoryFactory.register(
        AuditRepository.entity,
        AuditRepository
      );

    }

  }

} catch (error) {

  Logger.warn(
    "AuditRepository registration deferred: " +
    error.message
  );

}


// ============================================================
// REPOSITORY REGISTRY SYNC
// ============================================================

try {

  if (
    typeof RepositoryRegistry !== "undefined" &&
    typeof RepositoryRegistry.register === "function"
  ) {

    RepositoryRegistry.register(
      AuditRepository.entity,
      AuditRepository
    );

  }

} catch (error) {

  Logger.warn(
    "AuditRepository registry sync deferred: " +
    error.message
  );

}


// ============================================================
// READY
// ============================================================

Logger.log(
  "AuditRepository READY v" +
  AuditRepository.version
);
if(typeof RepositoryFactory!=="undefined"){

RepositoryFactory.registerLoaded(
"AUDIT",
AuditRepository
);

}