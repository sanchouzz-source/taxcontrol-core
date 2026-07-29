// ============================================================
// AuditRepository v2.0.1
// Append-Only System Repository
// TaxControl ERP Core
//
// Rules:
// - records can be created and read
// - records cannot be updated, deleted or restored
// - BaseRepository.audit() is disabled only for this bound repository
//   to prevent recursive AuditLog.write() calls
//
// Fixed in v2.0.0:
// - uses a bound BaseRepository for AUDIT
// - Database receives entity AUDIT instead of table name AuditLog
// - read/count/paginate follow the BaseRepository v6.3.1 contract
// - early loading no longer leaves a false initialized state
// - Factory and Registry registration can be safely retried
//
// Compatible:
// EntityMetadata v3.2+
// EntityRegistry v2.6+
// BaseRepository v6.3.1+
// RepositoryFactory v3.1.1+
// RepositoryRegistry v2.1+
// ============================================================

console.log("AuditRepository v2.0.1");

const AuditRepository = {
  version: "2.0.1",

  entity: "AUDIT",
  table: "AuditLog",

  architecture:
    "AuditLog -> AuditRepository -> Bound BaseRepository -> Database",

  initialized: false,
  registered: false,
  _base: null,

  // ============================================================
  // INIT
  // ============================================================

  init() {
    if (!this.initialized || !this._base) {
      this._base = this.createBaseRepository();
      this.initialized = true;
    }

    this.register();

    Logger.log(
      "AuditRepository INIT READY v" +
        this.version
    );

    return true;
  },

  ensureReady() {
    if (!this.initialized || !this._base) {
      this.init();
    } else if (!this.registered) {
      this.register();
    }

    return this._base;
  },

  // ============================================================
  // BOUND BASE
  // ============================================================

  createBaseRepository(adapter = null) {
    this.requireBase();

    const base =
      BaseRepository.createRepository(
        this.entity
      );

    if (adapter) {
      base._adapter = adapter;
      base._initialized = true;
    }

    /*
     * Creating an AUDIT row through a normal BaseRepository would call
     * BaseRepository.audit(), which writes another AUDIT row and causes
     * infinite recursion. The override is local to this bound instance.
     */
    base.audit = function () {};

    /*
     * Audit events are intentionally disabled here as well. The audit row
     * is the terminal system record, not the start of another event chain.
     */
    base.emit = function () {};

    return base;
  },

  useAdapterForTest(adapter) {
    this._base =
      this.createBaseRepository(adapter);

    this.initialized = true;

    return this._base;
  },

  // ============================================================
  // REGISTER
  // ============================================================

  register() {
    let factory = false;
    let registry = false;

    if (
      typeof RepositoryFactory !== "undefined" &&
      typeof RepositoryFactory.register === "function"
    ) {
      RepositoryFactory.register(
        this.entity,
        this,
        { force: true }
      );

      factory = true;
    }

    if (
      typeof RepositoryRegistry !== "undefined" &&
      typeof RepositoryRegistry.register === "function"
    ) {
      RepositoryRegistry.register(
        this.entity,
        this,
        { force: true }
      );

      registry = true;
    }

    this.registered =
      factory && registry;

    if (this.registered) {
      Logger.log(
        "AuditRepository REGISTERED"
      );
    }

    return this.registered;
  },

  // ============================================================
  // CREATE
  // ============================================================

  create(data = {}, options = {}) {
    this.requireObject(data, "create");

    const payload =
      this.normalizeCreateData(data);

    /*
     * options is accepted for API compatibility. Validation is deliberately
     * not bypassed: system audit rows must obey EntityMetadata v3.2.
     */
    void options;

    return this.ensureReady().create(
      payload
    );
  },

  bulkCreate(items = [], options = {}) {
    if (!Array.isArray(items)) {
      throw new Error(
        "AuditRepository.bulkCreate: items must be an array"
      );
    }

    return items.map(
      (item) => this.create(item, options)
    );
  },

  normalizeCreateData(data) {
    const payload = {
      ...data,
    };

    this.copyAlias(
      payload,
      "AuditID",
      "id"
    );
    this.copyAlias(
      payload,
      "OrganizationID",
      "organizationId"
    );
    this.copyAlias(
      payload,
      "Entity",
      "entity"
    );
    this.copyAlias(
      payload,
      "EntityID",
      "entityId"
    );
    this.copyAlias(
      payload,
      "Action",
      "action"
    );
    this.copyAlias(
      payload,
      "UserID",
      "userId"
    );
    this.copyAlias(
      payload,
      "EventID",
      "eventId"
    );
    this.copyAlias(
      payload,
      "Before",
      "before"
    );
    this.copyAlias(
      payload,
      "After",
      "after"
    );
    this.copyAlias(
      payload,
      "Source",
      "source"
    );
    this.copyAlias(
      payload,
      "Version",
      "version"
    );
    this.copyAlias(
      payload,
      "EntityVersion",
      "entityVersion"
    );
    this.copyAlias(
      payload,
      "CreatedAt",
      "timestamp"
    );

    payload.Action =
      payload.Action || "SYSTEM";

    payload.Entity =
      payload.Entity || "";

    payload.EntityID =
      payload.EntityID || "";

    payload.UserID =
      payload.UserID || "SYSTEM";

    payload.Source =
      payload.Source || "ERP";

    payload.Version = Number(
      payload.Version || 1
    );

    payload.EntityVersion = Number(
      payload.EntityVersion || 1
    );

    payload.CreatedAt =
      this.toIsoString(
        payload.CreatedAt
      );

    [
      "id",
      "organizationId",
      "entity",
      "entityId",
      "action",
      "userId",
      "eventId",
      "before",
      "after",
      "source",
      "version",
      "entityVersion",
      "timestamp",
    ].forEach((field) => {
      delete payload[field];
    });

    return payload;
  },

  // ============================================================
  // READ
  // ============================================================

  findById(id, options = {}) {
    this.requireId(id, "findById");

    return this.ensureReady().findById(
      id,
      {
        ...options,
        includeDeleted: true,
      }
    );
  },

  get(id, options = {}) {
    return this.findById(id, options);
  },

  findAll(filters = {}, options = {}) {
    this.requireObject(
      filters,
      "findAll"
    );

    return this.ensureReady().findAll(
      filters,
      {
        ...options,
        includeDeleted: true,
      }
    );
  },

  findWhere(
    field,
    value,
    options = {}
  ) {
    this.requireField(
      field,
      "findWhere"
    );

    return this.findAll(
      { [field]: value },
      options
    );
  },

  findByEntity(
    entity,
    entityId = null,
    options = {}
  ) {
    if (!entity) {
      throw new Error(
        "AuditRepository entity required"
      );
    }

    const filters = {
      Entity: entity,
    };

    if (
      entityId !== undefined &&
      entityId !== null &&
      entityId !== ""
    ) {
      filters.EntityID = entityId;
    }

    return this.findAll(
      filters,
      options
    );
  },

  findByUser(userId, options = {}) {
    this.requireId(
      userId,
      "findByUser"
    );

    return this.findWhere(
      "UserID",
      userId,
      options
    );
  },

  findByAction(action, options = {}) {
    this.requireId(
      action,
      "findByAction"
    );

    return this.findWhere(
      "Action",
      action,
      options
    );
  },

  findByEvent(eventId, options = {}) {
    this.requireId(
      eventId,
      "findByEvent"
    );

    return this.findWhere(
      "EventID",
      eventId,
      options
    );
  },

  count(filters = {}, options = {}) {
    return this.findAll(
      filters,
      options
    ).length;
  },

  exists(id, options = {}) {
    return !!this.findById(id, options);
  },

  paginate(
    page = 1,
    limit = 50,
    filters = {},
    options = {}
  ) {
    const rows =
      this.findAll(filters, options);

    const normalizedPage =
      Math.max(1, Number(page) || 1);

    const normalizedLimit =
      Math.max(1, Number(limit) || 50);

    const start =
      (normalizedPage - 1) *
      normalizedLimit;

    return {
      page: normalizedPage,
      limit: normalizedLimit,
      total: rows.length,
      data: rows.slice(
        start,
        start + normalizedLimit
      ),
    };
  },

  // ============================================================
  // IMMUTABLE
  // ============================================================

  update() {
    throw new Error(
      "AuditRepository.update forbidden: immutable records"
    );
  },

  delete() {
    throw new Error(
      "AuditRepository.delete forbidden: immutable records"
    );
  },

  restore() {
    throw new Error(
      "AuditRepository.restore forbidden"
    );
  },

  bulkUpdate() {
    throw new Error(
      "AuditRepository.bulkUpdate forbidden: immutable records"
    );
  },

  // ============================================================
  // HELPERS
  // ============================================================

  getMeta() {
    this.requireBase();

    return BaseRepository.getMeta(
      this.entity
    );
  },

  requireBase() {
    if (typeof BaseRepository === "undefined") {
      throw new Error(
        "AuditRepository requires BaseRepository"
      );
    }
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
  },

  requireField(field, method) {
    if (!field) {
      throw new Error(
        "AuditRepository." +
          method +
          ": field required"
      );
    }
  },

  requireObject(object, method) {
    if (
      !object ||
      typeof object !== "object" ||
      Array.isArray(object)
    ) {
      throw new Error(
        "AuditRepository." +
          method +
          ": object required"
      );
    }
  },

  copyAlias(payload, target, source) {
    if (
      payload[target] === undefined &&
      payload[source] !== undefined
    ) {
      payload[target] = payload[source];
    }
  },

  toIsoString(value) {
    if (!value) {
      return new Date().toISOString();
    }

    const date =
      value instanceof Date
        ? value
        : new Date(value);

    if (isNaN(date.getTime())) {
      throw new Error(
        "AuditRepository: invalid timestamp"
      );
    }

    return date.toISOString();
  },

  // ============================================================
  // DIAGNOSTICS / HEALTH
  // ============================================================

  diagnostics() {
    let meta = null;

    try {
      meta = this.getMeta();
    } catch (e) {
      // Diagnostics remains available during early loading.
    }

    return {
      module: "AuditRepository",
      version: this.version,
      entity: this.entity,
      table:
        meta?.table || this.table,
      architecture:
        this.architecture,
      appendOnly: true,
      immutable: true,
      initialized: this.initialized,
      registered: this.registered,
      baseReady:
        !!this._base &&
        this._base.ready(),
      baseVersion:
        typeof BaseRepository !== "undefined"
          ? BaseRepository.version
          : null,
      factory:
        typeof RepositoryFactory !== "undefined" &&
        typeof RepositoryFactory.has === "function"
          ? RepositoryFactory.has(this.entity)
          : false,
      registry:
        typeof RepositoryRegistry !== "undefined" &&
        typeof RepositoryRegistry.has === "function"
          ? RepositoryRegistry.has(this.entity)
          : false,
      metadata: !!meta,
      timestamp: new Date().toISOString(),
    };
  },

  health() {
    const data = this.diagnostics();

    const status =
      data.baseReady &&
      data.metadata &&
      data.factory &&
      data.registry
        ? "OK"
        : "WARNING";

    if (
      typeof HealthContract !== "undefined" &&
      typeof HealthContract.create === "function"
    ) {
      return HealthContract.create(
        "AuditRepository",
        status,
        data
      );
    }

    return {
      module: "AuditRepository",
      status,
      ...data,
    };
  },
};

globalThis.AuditRepository =
  AuditRepository;

Logger.log(
  "AuditRepository GLOBAL READY v" +
    AuditRepository.version
);
