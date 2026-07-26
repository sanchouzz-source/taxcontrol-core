// ============================================================
// TripRepository v2.1.0
// TaxControl ERP
//
// Репозиторий сущности TRIP
//
// Совместимость:
// - BaseRepository v5.5.0+
// - RepositoryFactory v2.5.8+
// - RepositoryRegistry
// - HealthContract
// ============================================================

console.log("TripRepository v2.1.0");


const TripRepository = {

  version: "2.1.0",

  entity: "TRIP",

  table: "Trips",

  architecture: "BaseRepository v5.5+",


  // ============================================================
  // CREATE
  // ============================================================

  create(data = {}, options = {}) {

    this.requireObject(
      data,
      "create"
    );

    return BaseRepository.create(
      this.entity,
      data,
      options
    );

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
      options
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

    return BaseRepository.findAll(
      this.entity,
      filters || {},
      options || {}
    );

  },


  // ============================================================
  // FIND WHERE
  // ============================================================

  findWhere(
    field,
    value,
    options = {}
  ) {

    if (!field) {
      throw new Error(
        "TripRepository.findWhere: field required"
      );
    }

    return BaseRepository.findWhere(
      this.entity,
      field,
      value,
      options
    );

  },


  // ============================================================
  // COUNT
  // ============================================================

  count(filters = {}, options = {}) {

    return BaseRepository.count(
      this.entity,
      filters || {},
      options || {}
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
      options
    );

  },


  // ============================================================
  // EXISTS BY
  // ============================================================

  existsBy(
    field,
    value,
    options = {}
  ) {

    if (!field) {
      throw new Error(
        "TripRepository.existsBy: field required"
      );
    }

    return BaseRepository.existsBy(
      this.entity,
      field,
      value,
      options
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

    return BaseRepository.paginate(
      this.entity,
      page,
      limit,
      filters || {},
      options || {}
    );

  },


  // ============================================================
  // UPDATE
  // ============================================================

  update(
    id,
    data = {},
    options = {}
  ) {

    this.requireId(
      id,
      "update"
    );

    this.requireObject(
      data,
      "update"
    );

    return BaseRepository.update(
      this.entity,
      id,
      data,
      options
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

    return BaseRepository.delete(
      this.entity,
      id,
      options
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

    return BaseRepository.restore(
      this.entity,
      id,
      options
    );

  },


  // ============================================================
  // BULK CREATE
  // ============================================================

  bulkCreate(
    items = [],
    options = {}
  ) {

    if (!Array.isArray(items)) {
      throw new Error(
        "TripRepository.bulkCreate: items must be an array"
      );
    }

    return BaseRepository.bulkCreate(
      this.entity,
      items,
      options
    );

  },


  // ============================================================
  // BULK UPDATE
  // ============================================================

  bulkUpdate(
    ids = [],
    data = {},
    options = {}
  ) {

    if (!Array.isArray(ids)) {
      throw new Error(
        "TripRepository.bulkUpdate: ids must be an array"
      );
    }

    this.requireObject(
      data,
      "bulkUpdate"
    );

    return BaseRepository.bulkUpdate(
      this.entity,
      ids,
      data,
      options
    );

  },


  // ============================================================
  // TRANSACTION
  // ============================================================

  transaction(callback) {

    if (typeof callback !== "function") {
      throw new Error(
        "TripRepository.transaction: callback required"
      );
    }

    return BaseRepository.transaction(
      callback
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

      const schema =
        SchemaRegistry.get(
          this.entity
        );

      if (schema) {
        return schema;
      }

    }

    if (
      typeof EntityRegistry !== "undefined" &&
      typeof EntityRegistry.get === "function"
    ) {

      const metadata =
        EntityRegistry.get(
          this.entity
        );

      if (metadata) {
        return metadata;
      }

    }

    return {

      entity: this.entity,

      table: this.table,

      idField: "TripID"

    };

  },


  // ============================================================
  // VALIDATION HELPERS
  // ============================================================

  requireId(id, method) {

    if (
      id === undefined ||
      id === null ||
      id === ""
    ) {
      throw new Error(
        "TripRepository." +
        method +
        ": id required"
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
        "TripRepository." +
        method +
        ": data must be an object"
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

      version:
        this.version,

      entity:
        this.entity,

      table:
        metadata?.table ||
        this.table,

      idField:
        metadata?.idField ||
        metadata?.primaryKey ||
        "TripID",

      architecture:
        this.architecture,

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

        available:
          factoryAvailable,

        registered

      },

      metadata: {

        available:
          !!metadata,

        error:
          metadataError

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

      version:
        this.version,

      entity:
        this.entity,

      table:
        diagnostics.table,

      idField:
        diagnostics.idField,

      architecture:
        this.architecture,

      baseRepository:
        diagnostics.baseRepository,

      repositoryFactory:
        diagnostics.repositoryFactory,

      metadata:
        diagnostics.metadata,

      features: [

        "CRUD",

        "SoftDelete",

        "Restore",

        "Validation",

        "Permissions",

        "AuditLog",

        "Versioning",

        "EventBus",

        "Pagination",

        "BulkOperations",

        "Transactions",

        "Diagnostics"

      ]

    };

    if (
      typeof HealthContract !== "undefined" &&
      typeof HealthContract.create === "function"
    ) {
      return HealthContract.create(
        "TripRepository",
        status,
        details
      );
    }

    return {

      module:
        "TripRepository",

      status,

      ...details

    };

  }

};


// ============================================================
// GLOBAL EXPORT
// ============================================================

globalThis.TripRepository =
  TripRepository;


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
        TripRepository.entity,
        TripRepository
      );

    } else if (
      typeof RepositoryFactory.registerLoaded === "function"
    ) {

      RepositoryFactory.registerLoaded(
        TripRepository.entity,
        TripRepository
      );

    } else if (
      typeof RepositoryFactory.register === "function"
    ) {

      RepositoryFactory.register(
        TripRepository.entity,
        TripRepository
      );

    }

  }

} catch (error) {

  Logger.warn(
    "TripRepository registration deferred: " +
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
      TripRepository.entity,
      TripRepository
    );

  }

} catch (error) {

  Logger.warn(
    "TripRepository registry sync deferred: " +
    error.message
  );

}


// ============================================================
// READY
// ============================================================

Logger.log(
  "TripRepository READY v" +
  TripRepository.version
);