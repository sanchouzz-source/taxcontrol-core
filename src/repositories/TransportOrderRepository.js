// ============================================================
// TransportOrderRepository v3.0.1
// Enterprise Transport Order Repository
// TaxControl ERP Core
//
// Entity:
// TRANSPORT_ORDER
//
// Architecture:
//
// EntityService
//      |
// TransportOrderRepository
//      |
// BaseRepository.createRepository("TRANSPORT_ORDER")
//      |
// Database
//
// Compatible:
// EntityMetadata v3.1+
// EntityRegistry v2.6+
// BaseRepository v6.3.1+
// RepositoryFactory v3.1+
// RepositoryRegistry v2.1+
//
// Changed in v3.0.0:
// - migrated from the old direct BaseRepository API
// - uses one bound BaseRepository instance
// - added input checks and metadata diagnostics
// - added findWhere, findOne, pagination and bulk operations
// - preserved transport-order assignment methods
// - emits all four TRANSPORT_ORDER lifecycle events
// - reports the real repository architecture and base version
// ============================================================

console.log(
  "TransportOrderRepository v3.0.1"
);

const TransportOrderRepository = {
  // ============================================================
  // META
  // ============================================================

  version: "3.0.1",

  entity: "TRANSPORT_ORDER",

  table: "TransportOrders",

  initialized: false,

  base: null,

  architecture:
    "Enterprise Transport Repository -> Bound BaseRepository",

  // ============================================================
  // INIT
  // ============================================================

  init() {
    if (this.initialized) {
      return true;
    }

    if (typeof BaseRepository === "undefined") {
      throw new Error(
        "TransportOrderRepository: BaseRepository unavailable"
      );
    }

    if (
      typeof BaseRepository.createRepository !==
      "function"
    ) {
      throw new Error(
        "TransportOrderRepository: " +
          "BaseRepository.createRepository unavailable"
      );
    }

    this.base =
      BaseRepository.createRepository(
        this.entity
      );

    this.initialized = true;

    Logger.log(
      "TransportOrderRepository INIT READY v" +
        this.version
    );

    return true;
  },

  // ============================================================
  // BASE ACCESS
  // ============================================================

  getBase() {
    if (!this.initialized || !this.base) {
      this.init();
    }

    return this.base;
  },

  // ============================================================
  // CREATE
  // ============================================================

  create(data = {}, options = {}) {
    this.requireObject(
      data,
      "create"
    );

    const result =
      this.getBase().create(
        data,
        options
      );

    this.emit(
      this.getEventName("CREATED"),
      null,
      result,
      "CREATE"
    );

    return result;
  },

  // ============================================================
  // READ
  // ============================================================

  findById(id, options = {}) {
    this.requireId(
      id,
      "findById"
    );

    return this.getBase().findById(
      id,
      options
    );
  },

  get(id, options = {}) {
    return this.findById(
      id,
      options
    );
  },

  getById(id, options = {}) {
    return this.findById(
      id,
      options
    );
  },

  findAll(
    filters = {},
    options = {}
  ) {
    this.requireObject(
      filters,
      "findAll"
    );

    return this.getBase().findAll(
      filters,
      options
    );
  },

  findWhere(
    criteria = {},
    options = {}
  ) {
    this.requireObject(
      criteria,
      "findWhere"
    );

    return this.findAll(
      criteria,
      options
    );
  },

  findOne(
    criteria = {},
    options = {}
  ) {
    const rows =
      this.findAll(
        criteria,
        options
      );

    return rows.length
      ? rows[0]
      : null;
  },

  search(field, value) {
    this.requireField(
      field,
      "search"
    );

    const searchValue =
      String(value || "")
        .toLowerCase();

    return this.findAll().filter(
      (row) => {
        return String(
          row[field] || ""
        )
          .toLowerCase()
          .includes(searchValue);
      }
    );
  },

  // ============================================================
  // COUNT AND EXISTS
  // ============================================================

  count(
    filters = {},
    options = {}
  ) {
    return this.findAll(
      filters,
      options
    ).length;
  },

  exists(id, options = {}) {
    this.requireId(
      id,
      "exists"
    );

    return !!this.findById(
      id,
      options
    );
  },

  existsBy(
    field,
    value,
    options = {}
  ) {
    this.requireField(
      field,
      "existsBy"
    );

    return this.findAll(
      {
        [field]: value,
      },
      options
    ).length > 0;
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

    const before =
      this.findById(
        id,
        {
          includeDeleted: true,
        }
      );

    if (!before) {
      throw new Error(
        "TransportOrderRepository.update: " +
          "order not found " +
          id
      );
    }

    const result =
      this.getBase().update(
        id,
        data,
        options
      );

    this.emit(
      this.getEventName("UPDATED"),
      before,
      result,
      "UPDATE"
    );

    return result;
  },

  // ============================================================
  // DELETE
  // ============================================================

  delete(id, options = {}) {
    this.requireId(
      id,
      "delete"
    );

    const before =
      this.findById(
        id,
        {
          includeDeleted: true,
        }
      );

    if (!before) {
      throw new Error(
        "TransportOrderRepository.delete: " +
          "order not found " +
          id
      );
    }

    const result =
      this.getBase().delete(
        id,
        options
      );

    this.emit(
      this.getEventName("DELETED"),
      before,
      result,
      "DELETE"
    );

    return result;
  },

  // ============================================================
  // RESTORE
  // ============================================================

  restore(id, options = {}) {
    this.requireId(
      id,
      "restore"
    );

    const before =
      this.findById(
        id,
        {
          includeDeleted: true,
        }
      );

    if (!before) {
      throw new Error(
        "TransportOrderRepository.restore: " +
          "order not found " +
          id
      );
    }

    const result =
      this.getBase().restore(
        id,
        options
      );

    this.emit(
      this.getEventName("RESTORED"),
      before,
      result,
      "RESTORE"
    );

    return result;
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
    const safePage =
      Math.max(
        1,
        Number(page) || 1
      );

    const safeLimit =
      Math.max(
        1,
        Number(limit) || 50
      );

    const rows =
      this.findAll(
        filters,
        options
      );

    const start =
      (safePage - 1) *
      safeLimit;

    return {
      page: safePage,
      limit: safeLimit,
      total: rows.length,
      data: rows.slice(
        start,
        start + safeLimit
      ),
    };
  },

  // ============================================================
  // BULK OPERATIONS
  // ============================================================

  bulkCreate(
    items = [],
    options = {}
  ) {
    if (!Array.isArray(items)) {
      throw new Error(
        "TransportOrderRepository.bulkCreate: " +
          "items must be an array"
      );
    }

    items.forEach(
      (item) => {
        this.requireObject(
          item,
          "bulkCreate"
        );
      }
    );

    const results =
      this.getBase().bulkCreate(
        items,
        options
      );

    results.forEach(
      (result) => {
        this.emit(
          this.getEventName("CREATED"),
          null,
          result,
          "CREATE"
        );
      }
    );

    return results;
  },

  bulkUpdate(
    ids = [],
    data = {},
    options = {}
  ) {
    if (!Array.isArray(ids)) {
      throw new Error(
        "TransportOrderRepository.bulkUpdate: " +
          "ids must be an array"
      );
    }

    this.requireObject(
      data,
      "bulkUpdate"
    );

    return ids.map(
      (id) => {
        return this.update(
          id,
          data,
          options
        );
      }
    );
  },

  // ============================================================
  // TRANSACTION
  // ============================================================

  transaction(callback) {
    if (
      typeof callback !== "function"
    ) {
      throw new Error(
        "TransportOrderRepository.transaction: " +
          "callback required"
      );
    }

    return this.getBase().transaction(
      () => callback(this)
    );
  },

  // ============================================================
  // BUSINESS QUERIES
  // ============================================================

  findByClient(clientId) {
    this.requireId(
      clientId,
      "findByClient"
    );

    return this.findWhere({
      ClientID: clientId,
    });
  },

  findByTrip(tripId) {
    this.requireId(
      tripId,
      "findByTrip"
    );

    return this.findWhere({
      TripID: tripId,
    });
  },

  findByStatus(status) {
    this.requireId(
      status,
      "findByStatus"
    );

    return this.findWhere({
      Status: status,
    });
  },

  findByCarrier(carrierId) {
    this.requireId(
      carrierId,
      "findByCarrier"
    );

    return this.findWhere({
      CarrierID: carrierId,
    });
  },

  findByVehicle(vehicleId) {
    this.requireId(
      vehicleId,
      "findByVehicle"
    );

    return this.findWhere({
      VehicleID: vehicleId,
    });
  },

  findByDriver(driverId) {
    this.requireId(
      driverId,
      "findByDriver"
    );

    return this.findWhere({
      DriverID: driverId,
    });
  },

  findByOrganization(
    organizationId
  ) {
    this.requireId(
      organizationId,
      "findByOrganization"
    );

    return this.findWhere({
      OrganizationID:
        organizationId,
    });
  },

  findActive() {
    const inactiveStatuses = [
      "COMPLETED",
      "CANCELLED",
      "CANCELED",
    ];

    return this.findAll().filter(
      (order) => {
        return !inactiveStatuses.includes(
          String(
            order.Status || ""
          ).toUpperCase()
        );
      }
    );
  },

  // ============================================================
  // ASSIGNMENTS
  // ============================================================

  assignCarrier(
    orderId,
    carrierId
  ) {
    this.requireId(
      carrierId,
      "assignCarrier"
    );

    return this.update(
      orderId,
      {
        CarrierID: carrierId,
      }
    );
  },

  assignVehicle(
    orderId,
    vehicleId
  ) {
    this.requireId(
      vehicleId,
      "assignVehicle"
    );

    return this.update(
      orderId,
      {
        VehicleID: vehicleId,
      }
    );
  },

  assignDriver(
    orderId,
    driverId
  ) {
    this.requireId(
      driverId,
      "assignDriver"
    );

    return this.update(
      orderId,
      {
        DriverID: driverId,
      }
    );
  },

  assignTrip(
    orderId,
    tripId
  ) {
    this.requireId(
      tripId,
      "assignTrip"
    );

    return this.update(
      orderId,
      {
        TripID: tripId,
      }
    );
  },

  // ============================================================
  // STATUS
  // ============================================================

  changeStatus(
    orderId,
    status
  ) {
    this.requireId(
      status,
      "changeStatus"
    );

    return this.update(
      orderId,
      {
        Status: status,
      }
    );
  },

  // ============================================================
  // EVENTS
  // ============================================================

  getEventName(action) {
    const fallback = {
      CREATED:
        "TRANSPORT_ORDER_CREATED",
      UPDATED:
        "TRANSPORT_ORDER_UPDATED",
      DELETED:
        "TRANSPORT_ORDER_DELETED",
      RESTORED:
        "TRANSPORT_ORDER_RESTORED",
    };

    try {
      if (
        typeof EntityEvents !==
          "undefined" &&
        EntityEvents.TRANSPORT_ORDER &&
        EntityEvents.TRANSPORT_ORDER[
          action
        ]
      ) {
        return EntityEvents
          .TRANSPORT_ORDER[action];
      }
    } catch (error) {
      // The stable fallback below is used.
    }

    return fallback[action] || null;
  },

  emit(
    event,
    before,
    after,
    action
  ) {
    if (
      !event ||
      typeof EventBus === "undefined" ||
      typeof EventBus.emit !== "function"
    ) {
      return false;
    }

    try {
      EventBus.emit(
        event,
        {
          entity: this.entity,
          action,
          entityId:
            after?.TransportOrderID ||
            before?.TransportOrderID ||
            null,
          before:
            before || null,
          after:
            after || null,
          data:
            after ||
            before ||
            null,
          source:
            "TransportOrderRepository",
          timestamp:
            new Date().toISOString(),
        }
      );

      return true;
    } catch (error) {
      Logger.warn(
        "TransportOrderRepository event skipped " +
          event +
          ": " +
          error.message
      );

      return false;
    }
  },

  // ============================================================
  // METADATA
  // ============================================================

  getMeta() {
    if (
      typeof EntityRegistry !==
        "undefined" &&
      typeof EntityRegistry.get ===
        "function"
    ) {
      const meta =
        EntityRegistry.get(
          this.entity
        );

      if (meta) {
        return meta;
      }
    }

    if (
      typeof EntityMetadata !==
        "undefined" &&
      typeof EntityMetadata.get ===
        "function"
    ) {
      const meta =
        EntityMetadata.get(
          this.entity
        );

      if (meta) {
        return meta;
      }
    }

    return {
      entity: this.entity,
      table: this.table,
      idField:
        "TransportOrderID",
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
        "TransportOrderRepository." +
          method +
          ": value required"
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
        "TransportOrderRepository." +
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
        "TransportOrderRepository." +
          method +
          ": object required"
      );
    }

    return true;
  },

  // ============================================================
  // REGISTRATION
  // ============================================================

  register() {
    let registered = false;

    if (
      typeof RepositoryFactory !==
        "undefined" &&
      typeof RepositoryFactory.register ===
        "function"
    ) {
      RepositoryFactory.register(
        this.entity,
        this,
        {
          force: true,
        }
      );

      registered = true;
    }

    if (
      typeof RepositoryRegistry !==
        "undefined" &&
      typeof RepositoryRegistry.register ===
        "function" &&
      (
        !RepositoryRegistry.has ||
        !RepositoryRegistry.has(
          this.entity
        )
      )
    ) {
      RepositoryRegistry.register(
        this.entity,
        this,
        {
          force: true,
        }
      );

      registered = true;
    }

    return registered;
  },

  // ============================================================
  // DIAGNOSTICS
  // ============================================================

  diagnostics() {
    let meta = null;
    let metadataError = null;

    try {
      meta = this.getMeta();
    } catch (error) {
      metadataError =
        error.message;
    }

    const base =
      this.base;

    const baseReady =
      !!base &&
      (
        typeof base.ready !==
          "function" ||
        base.ready()
      );

    const factoryRegistered =
      typeof RepositoryFactory !==
        "undefined" &&
      typeof RepositoryFactory.has ===
        "function"
        ? RepositoryFactory.has(
            this.entity
          )
        : false;

    const registryRegistered =
      typeof RepositoryRegistry !==
        "undefined" &&
      typeof RepositoryRegistry.has ===
        "function"
        ? RepositoryRegistry.has(
            this.entity
          )
        : false;

    return {
      module:
        "TransportOrderRepository",
      version:
        this.version,
      entity:
        this.entity,
      table:
        meta?.table ||
        this.table,
      idField:
        meta?.idField ||
        "TransportOrderID",
      architecture:
        this.architecture,
      initialized:
        this.initialized,
      baseRepository: {
        available:
          typeof BaseRepository !==
          "undefined",
        version:
          typeof BaseRepository !==
          "undefined"
            ? BaseRepository.version ||
              null
            : null,
        bound:
          !!base &&
          base.entity ===
            this.entity,
        ready:
          baseReady,
      },
      repositoryFactory: {
        available:
          typeof RepositoryFactory !==
          "undefined",
        registered:
          factoryRegistered,
      },
      repositoryRegistry: {
        available:
          typeof RepositoryRegistry !==
          "undefined",
        registered:
          registryRegistered,
      },
      metadata: {
        available:
          !!meta,
        error:
          metadataError,
      },
      events: {
        created:
          this.getEventName(
            "CREATED"
          ),
        updated:
          this.getEventName(
            "UPDATED"
          ),
        deleted:
          this.getEventName(
            "DELETED"
          ),
        restored:
          this.getEventName(
            "RESTORED"
          ),
      },
      timestamp:
        new Date().toISOString(),
    };
  },

  // ============================================================
  // HEALTH
  // ============================================================

  health() {
    const diagnostics =
      this.diagnostics();

    const healthy =
      diagnostics.initialized &&
      diagnostics.baseRepository
        .available &&
      diagnostics.baseRepository
        .bound &&
      diagnostics.baseRepository
        .ready &&
      diagnostics.metadata.available &&
      diagnostics.repositoryFactory
        .registered;

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
        diagnostics
          .repositoryFactory,
      repositoryRegistry:
        diagnostics
          .repositoryRegistry,
      metadata:
        diagnostics.metadata,
      events:
        diagnostics.events,
      features: [
        "CRUD",
        "SoftDelete",
        "Restore",
        "FindWhere",
        "Search",
        "Pagination",
        "BulkCreate",
        "BulkUpdate",
        "Transactions",
        "Assignments",
        "StatusWorkflow",
        "LifecycleEvents",
        "Diagnostics",
      ],
    };

    if (
      typeof HealthContract !==
        "undefined" &&
      typeof HealthContract.create ===
        "function"
    ) {
      return HealthContract.create(
        "TransportOrderRepository",
        status,
        details
      );
    }

    return {
      module:
        "TransportOrderRepository",
      status,
      ...details,
    };
  },
};

// ============================================================
// GLOBAL EXPORT
// ============================================================

globalThis.TransportOrderRepository =
  TransportOrderRepository;

// ============================================================
// READY
// ============================================================

Logger.log(
  "TransportOrderRepository READY v" +
    TransportOrderRepository.version
);
