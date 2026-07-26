// ============================================================
// KPIRepository v1.2.0
// TaxControl ERP
//
// Repository for KPI entity
// Compatible:
// - BaseRepository v5.4.3+
// - RepositoryFactory v2.5.8+
// - RepositoryRegistry v1.1.0+
// ============================================================

console.log("KPIRepository v1.2.0");


const KPIRepository = {

  version: "1.2.0",

  entity: "KPI",

  table: "KPIMetrics",


  // ============================================================
  // CREATE
  // ============================================================

  create(data = {}) {

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      throw new Error(
        "KPIRepository.create: data must be an object"
      );
    }

    return BaseRepository.create(
      this.entity,
      data
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
  // GET ALIAS
  // ============================================================

  get(id, options = {}) {

    return this.findById(
      id,
      options
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
  // UPDATE
  // ============================================================

  update(id, data = {}) {

    this.requireId(
      id,
      "update"
    );

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      throw new Error(
        "KPIRepository.update: data must be an object"
      );
    }

    return BaseRepository.update(
      this.entity,
      id,
      data
    );

  },


  // ============================================================
  // DELETE
  // ============================================================

  delete(id) {

    this.requireId(
      id,
      "delete"
    );

    return BaseRepository.delete(
      this.entity,
      id
    );

  },


  // ============================================================
  // RESTORE
  // ============================================================

  restore(id) {

    this.requireId(
      id,
      "restore"
    );

    return BaseRepository.restore(
      this.entity,
      id
    );

  },


  // ============================================================
  // COUNT
  // ============================================================

  count(filters = {}, options = {}) {

    if (
      typeof BaseRepository.count === "function"
    ) {
      return BaseRepository.count(
        this.entity,
        filters || {},
        options || {}
      );
    }

    const rows = this.findAll(
      filters,
      options
    );

    return Array.isArray(rows)
      ? rows.length
      : 0;

  },


  // ============================================================
  // EXISTS BY FIELD
  // ============================================================

  existsBy(field, value, options = {}) {

    if (!field) {
      throw new Error(
        "KPIRepository.existsBy: field required"
      );
    }

    if (
      typeof BaseRepository.existsBy === "function"
    ) {
      return BaseRepository.existsBy(
        this.entity,
        field,
        value,
        options
      );
    }

    const rows = this.findAll(
      {
        [field]: value
      },
      options
    );

    return Array.isArray(rows) &&
      rows.length > 0;

  },


  // ============================================================
  // METADATA
  // ============================================================

  getMeta() {

    if (
      typeof SchemaRegistry !== "undefined" &&
      typeof SchemaRegistry.get === "function"
    ) {
      const schema =
        SchemaRegistry.get(this.entity);

      if (schema) {
        return schema;
      }
    }

    if (
      typeof EntityRegistry !== "undefined" &&
      typeof EntityRegistry.get === "function"
    ) {
      const metadata =
        EntityRegistry.get(this.entity);

      if (metadata) {
        return metadata;
      }
    }

    return {
      entity: this.entity,
      table: this.table
    };

  },


  // ============================================================
  // ID VALIDATION
  // ============================================================

  requireId(id, method) {

    if (
      id === undefined ||
      id === null ||
      id === ""
    ) {
      throw new Error(
        "KPIRepository." +
        method +
        ": id required"
      );
    }

    return true;

  },


  // ============================================================
  // HEALTH
  // ============================================================

  health() {

    let metadata = null;
    let error = null;

    try {
      metadata = this.getMeta();
    } catch (e) {
      error = e.message;
    }

    const details = {

      version: this.version,

      entity: this.entity,

      table:
        metadata && metadata.table
          ? metadata.table
          : this.table,

      baseRepository:
        typeof BaseRepository !== "undefined",

      repositoryFactory:
        typeof RepositoryFactory !== "undefined",

      registered:
        typeof RepositoryFactory !== "undefined" &&
        typeof RepositoryFactory.has === "function"
          ? RepositoryFactory.has(this.entity)
          : false,

      error

    };

    const status =
      details.baseRepository && !error
        ? "OK"
        : "WARNING";

    if (
      typeof HealthContract !== "undefined" &&
      typeof HealthContract.create === "function"
    ) {
      return HealthContract.create(
        "KPIRepository",
        status,
        details
      );
    }

    return {
      module: "KPIRepository",
      status,
      ...details
    };

  }

};


// ============================================================
// GLOBAL EXPORT
// ============================================================

globalThis.KPIRepository =
  KPIRepository;


// ============================================================
// LATE REGISTRATION
// Работает, если RepositoryFactory уже загружена.
// ============================================================

try {

  if (
    typeof RepositoryFactory !== "undefined"
  ) {

    if (
      typeof RepositoryFactory.notifyLoaded === "function"
    ) {
      RepositoryFactory.notifyLoaded(
        KPIRepository.entity,
        KPIRepository
      );
    }

    else if (
      typeof RepositoryFactory.registerLoaded === "function"
    ) {
      RepositoryFactory.registerLoaded(
        KPIRepository.entity,
        KPIRepository
      );
    }

    else if (
      typeof RepositoryFactory.register === "function"
    ) {
      RepositoryFactory.register(
        KPIRepository.entity,
        KPIRepository
      );
    }

  }

} catch (e) {

  Logger.warn(
    "KPIRepository registration deferred: " +
    e.message
  );

}


Logger.log(
  "KPIRepository READY v" +
  KPIRepository.version
);