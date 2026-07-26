// ============================================================
// ClientRepository v2.1.0
// TaxControl ERP
//
// Repository for CLIENT entity
//
// Layer:
// EntityService
//      |
// ClientRepository
//      |
// BaseRepository
//      |
// Database
//      |
// SpreadsheetAdapter
// ============================================================

console.log("ClientRepository v2.1.0");


const ClientRepository = {

  version: "2.1.0",

  entity: "CLIENT",

  table: "Clients",


  // ============================================================
  // CREATE
  // ============================================================

  create(data = {}) {

    return BaseRepository.create(
      this.entity,
      data
    );

  },


  // ============================================================
  // FIND BY ID
  // ============================================================

  findById(id, options = {}) {

    if (
      id === undefined ||
      id === null ||
      id === ""
    ) {
      throw new Error(
        "ClientRepository.findById: id required"
      );
    }

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

  findWhere(field, value, options = {}) {

    if (!field) {
      throw new Error(
        "ClientRepository.findWhere: field required"
      );
    }

    return this.findAll(
      {
        [field]: value
      },
      options
    );

  },


  // ============================================================
  // UPDATE
  // ============================================================

  update(id, data = {}) {

    if (
      id === undefined ||
      id === null ||
      id === ""
    ) {
      throw new Error(
        "ClientRepository.update: id required"
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

    if (
      id === undefined ||
      id === null ||
      id === ""
    ) {
      throw new Error(
        "ClientRepository.delete: id required"
      );
    }

    return BaseRepository.delete(
      this.entity,
      id
    );

  },


  // ============================================================
  // RESTORE
  // ============================================================

  restore(id) {

    if (
      id === undefined ||
      id === null ||
      id === ""
    ) {
      throw new Error(
        "ClientRepository.restore: id required"
      );
    }

    return BaseRepository.restore(
      this.entity,
      id
    );

  },


  // ============================================================
  // EXISTS
  // ============================================================

  exists(id, options = {}) {

    return !!this.findById(
      id,
      options
    );

  },


  // ============================================================
  // EXISTS BY
  // ============================================================

  existsBy(field, value, options = {}) {

    if (!field) {
      throw new Error(
        "ClientRepository.existsBy: field required"
      );
    }

    const rows = this.findAll(
      {
        [field]: value
      },
      options
    );

    return rows.length > 0;

  },


  // ============================================================
  // COUNT
  // ============================================================

  count(filters = {}, options = {}) {

    return this.findAll(
      filters,
      options
    ).length;

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
      filters,
      options
    );

  },


  // ============================================================
  // BULK CREATE
  // ============================================================

  bulkCreate(items = [], options = {}) {

    if (!Array.isArray(items)) {
      throw new Error(
        "ClientRepository.bulkCreate: items must be array"
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

  bulkUpdate(ids = [], data = {}, options = {}) {

    if (!Array.isArray(ids)) {
      throw new Error(
        "ClientRepository.bulkUpdate: ids must be array"
      );
    }

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
        "ClientRepository.transaction: callback required"
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

      return EntityRegistry.get(
        this.entity
      );

    }

    return {
      entity: this.entity,
      table: this.table,
      idField: "ClientID"
    };

  },


  // ============================================================
  // HEALTH
  // ============================================================

  health() {

    let meta = null;
    let error = null;

    try {
      meta = this.getMeta();
    } catch (e) {
      error = e.message;
    }

    const data = {

      version: this.version,

      entity: this.entity,

      table:
        meta && meta.table
          ? meta.table
          : this.table,

      idField:
        meta && meta.idField
          ? meta.idField
          : "ClientID",

      baseRepository:
        typeof BaseRepository !== "undefined",

      registered:
        typeof RepositoryFactory !== "undefined" &&
        typeof RepositoryFactory.has === "function"
          ? RepositoryFactory.has(this.entity)
          : false,

      error: error

    };


    const status =
      data.baseRepository && !error
        ? "OK"
        : "WARNING";


    if (
      typeof HealthContract !== "undefined" &&
      typeof HealthContract.create === "function"
    ) {

      return HealthContract.create(
        "ClientRepository",
        status,
        data
      );

    }


    return {

      module: "ClientRepository",

      status: status,

      ...data

    };

  }

};


// ============================================================
// GLOBAL EXPORT
// ============================================================

globalThis.ClientRepository =
  ClientRepository;


// ============================================================
// LATE REGISTRATION
// ============================================================

try {

  if (
    typeof RepositoryFactory !== "undefined"
  ) {

    if (
      typeof RepositoryFactory.notifyLoaded === "function"
    ) {

      RepositoryFactory.notifyLoaded(
        ClientRepository.entity,
        ClientRepository
      );

    }
    else if (
      typeof RepositoryFactory.registerLoaded === "function"
    ) {

      RepositoryFactory.registerLoaded(
        ClientRepository.entity,
        ClientRepository
      );

    }
    else if (
      typeof RepositoryFactory.register === "function"
    ) {

      RepositoryFactory.register(
        ClientRepository.entity,
        ClientRepository
      );

    }

  }

}
catch (e) {

  Logger.warn(
    "ClientRepository registration deferred: " +
    e.message
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
      ClientRepository.entity,
      ClientRepository
    );

  }

}
catch (e) {

  Logger.warn(
    "ClientRepository registry sync deferred: " +
    e.message
  );

}


Logger.log(
  "ClientRepository READY v" +
  ClientRepository.version
);
if(typeof RepositoryFactory!=="undefined"){

RepositoryFactory.registerLoaded(
"CLIENT",
ClientRepository
);

}