// ============================================================
// VersionRepository v1.0.0
// TaxControl ERP
//
// Системный репозиторий истории версий.
//
// Важно:
// - версия является историческим снимком;
// - записи версий неизменяемые;
// - update/delete/restore запрещены;
// - create не запускает Versioning.save повторно.
// ============================================================

console.log("VersionRepository v1.0.0");


const VersionRepository = {

  version: "1.0.0",

  entity: "VERSION",

  table: "Versions",

  architecture: "Append-Only Version Repository",


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
      {
        ...options,
        skipVersioning: true
      }
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
  // НАЙТИ ВЕРСИИ СУЩНОСТИ
  // ============================================================

  findByEntity(
    entity,
    entityId,
    options = {}
  ) {

    if (!entity) {
      throw new Error(
        "VersionRepository.findByEntity: entity required"
      );
    }

    this.requireId(
      entityId,
      "findByEntity"
    );

    const entityField =
      options.entityField ||
      "Entity";

    const entityIdField =
      options.entityIdField ||
      "EntityID";

    return this.findAll(
      {
        [entityField]: entity,
        [entityIdField]: entityId
      },
      options
    );

  },


  // ============================================================
  // ПОСЛЕДНЯЯ ВЕРСИЯ
  // ============================================================

  findLatest(
    entity,
    entityId,
    options = {}
  ) {

    const rows =
      this.findByEntity(
        entity,
        entityId,
        options
      );

    if (!rows.length) {
      return null;
    }

    const versionField =
      options.versionField ||
      "Version";

    const timestampField =
      options.timestampField ||
      "CreatedAt";

    return rows
      .slice()
      .sort(
        (a, b) => {

          const versionA =
            Number(a[versionField]) || 0;

          const versionB =
            Number(b[versionField]) || 0;

          if (versionA !== versionB) {
            return versionB - versionA;
          }

          const dateA =
            new Date(
              a[timestampField] || 0
            ).getTime();

          const dateB =
            new Date(
              b[timestampField] || 0
            ).getTime();

          return dateB - dateA;

        }
      )[0];

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
      "VersionRepository.update: version records are immutable"
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
      "VersionRepository.delete: version records cannot be deleted"
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
      "VersionRepository.restore: restore is not supported"
    );

  },


  // ============================================================
  // BULK CREATE
  // ============================================================

  bulkCreate(items = [], options = {}) {

    if (!Array.isArray(items)) {
      throw new Error(
        "VersionRepository.bulkCreate: items must be an array"
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
      "VersionRepository.bulkUpdate: version records are immutable"
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
      idField: "VersionID",
      softDelete: false
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
        "VersionRepository." +
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
        "VersionRepository." +
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
        "VersionRepository." +
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
        "VersionID",

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
        "FindByEntity",
        "FindLatest",
        "Count",
        "Exists",
        "Pagination",
        "BulkCreate",
        "ImmutableRecords",
        "Diagnostics"
      ]

    };

    if (
      typeof HealthContract !== "undefined" &&
      typeof HealthContract.create === "function"
    ) {
      return HealthContract.create(
        "VersionRepository",
        status,
        details
      );
    }

    return {
      module: "VersionRepository",
      status,
      ...details
    };

  }

};


// ============================================================
// GLOBAL EXPORT
// ============================================================

globalThis.VersionRepository =
  VersionRepository;


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
        VersionRepository.entity,
        VersionRepository
      );

    } else if (
      typeof RepositoryFactory.registerLoaded === "function"
    ) {

      RepositoryFactory.registerLoaded(
        VersionRepository.entity,
        VersionRepository
      );

    } else if (
      typeof RepositoryFactory.register === "function"
    ) {

      RepositoryFactory.register(
        VersionRepository.entity,
        VersionRepository
      );

    }

  }

} catch (error) {

  Logger.warn(
    "VersionRepository registration deferred: " +
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
      VersionRepository.entity,
      VersionRepository
    );

  }

} catch (error) {

  Logger.warn(
    "VersionRepository registry sync deferred: " +
    error.message
  );

}


// ============================================================
// READY
// ============================================================

Logger.log(
  "VersionRepository READY v" +
  VersionRepository.version
);