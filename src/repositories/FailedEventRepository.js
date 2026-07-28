// ============================================================
// FailedEventRepository v3.0.0
// Durable Failed-Event Queue Repository
// TaxControl ERP Core
//
// Rules:
// - failed events can be created and read
// - only retry-state fields can be updated
// - records cannot be deleted or restored
// - failed-event persistence must not emit another business event
//   or create another audit record
//
// Fixed in v3.0.0:
// - uses entity FAILED_EVENT instead of table name FailedEvents
// - uses a bound BaseRepository compatible with v6.3.1
// - supports lowercase BusinessEventProcessor field aliases
// - increments Attempts as a number instead of storing {increment: 1}
// - treats PENDING, FAILED and RETRY as retryable queue states
// - supports safe late registration in Factory and Registry
//
// Compatible:
// EntityMetadata v3.3+
// EntityRegistry v2.6+
// BaseRepository v6.3.1+
// RepositoryFactory v3.1.1+
// RepositoryRegistry v2.1+
// ============================================================

console.log("FailedEventRepository v3.0.0");

const FailedEventRepository = {
  version: "3.0.0",

  entity: "FAILED_EVENT",
  table: "FailedEvents",

  architecture:
    "EventRetryQueue -> FailedEventRepository -> Bound BaseRepository -> Database",

  initialized: false,
  registered: false,
  _base: null,

  retryableStatuses: [
    "PENDING",
    "FAILED",
    "RETRY",
  ],

  mutableFields: [
    "Attempts",
    "Status",
    "Error",
    "LastAttemptAt",
    "NextRetryAt",
    "Processor",
    "UpdatedAt",
  ],

  // ============================================================
  // INIT
  // ============================================================

  init() {
    if (!this.initialized || !this._base) {
      this._base =
        this.createBaseRepository();

      this.initialized = true;
    }

    this.register();

    Logger.log(
      "FailedEventRepository INIT READY v" +
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
     * A failure while processing an event is a terminal error path.
     * Emitting/auditing it through BaseRepository could recursively
     * invoke the same failed-event path.
     */
    base.audit = function () {};
    base.emit = function () {};

    return base;
  },

  useAdapterForTest(adapter) {
    if (
      !adapter ||
      typeof adapter !== "object"
    ) {
      throw new Error(
        "FailedEventRepository.useAdapterForTest: adapter required"
      );
    }

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
        "FailedEventRepository REGISTERED"
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
      this.normalizeCreateData(
        data,
        options
      );

    return this.ensureReady().create(
      payload
    );
  },

  save(event, error, options = {}) {
    if (
      !event ||
      typeof event !== "object"
    ) {
      throw new Error(
        "FailedEventRepository.save: event required"
      );
    }

    return this.create({
      ID:
        options.id,
      EventID:
        event.id ||
        event.eventId ||
        "",
      Entity:
        event.entity ||
        "UNKNOWN",
      Type:
        event.type ||
        "UNKNOWN",
      Payload: event,
      Error:
        error?.message ||
        String(error || "Unknown error"),
      Attempts:
        options.attempts ?? 0,
      Status:
        options.status ||
        "FAILED",
      Processor:
        options.processor ||
        "EventRetryQueue",
      OrganizationID:
        options.organizationId,
      NextRetryAt:
        options.nextRetryAt,
    });
  },

  bulkCreate(items = [], options = {}) {
    if (!Array.isArray(items)) {
      throw new Error(
        "FailedEventRepository.bulkCreate: items must be an array"
      );
    }

    return items.map(
      (item) => this.create(item, options)
    );
  },

  normalizeCreateData(
    data,
    options = {}
  ) {
    const payload = {
      ...data,
    };

    this.copyAlias(payload, "ID", "id");
    this.copyAlias(
      payload,
      "OrganizationID",
      "organizationId"
    );
    this.copyAlias(
      payload,
      "EventID",
      "eventId"
    );
    this.copyAlias(
      payload,
      "Entity",
      "entity"
    );
    this.copyAlias(
      payload,
      "Type",
      "type"
    );
    this.copyAlias(
      payload,
      "Payload",
      "payload"
    );
    this.copyAlias(
      payload,
      "Error",
      "error"
    );
    this.copyAlias(
      payload,
      "Attempts",
      "attempts"
    );
    this.copyAlias(
      payload,
      "Status",
      "status"
    );
    this.copyAlias(
      payload,
      "Processor",
      "processor"
    );
    this.copyAlias(
      payload,
      "LastAttemptAt",
      "lastAttemptAt"
    );
    this.copyAlias(
      payload,
      "NextRetryAt",
      "nextRetryAt"
    );
    this.copyAlias(
      payload,
      "CreatedAt",
      "timestamp"
    );
    this.copyAlias(
      payload,
      "CreatedAt",
      "createdAt"
    );
    this.copyAlias(
      payload,
      "UpdatedAt",
      "updatedAt"
    );

    if (
      payload.Status === undefined &&
      options.status !== undefined
    ) {
      payload.Status =
        options.status;
    }

    payload.EventID =
      String(payload.EventID || "");

    payload.Entity =
      String(payload.Entity || "UNKNOWN");

    payload.Type =
      String(payload.Type || "UNKNOWN");

    payload.Payload =
      this.serializePayload(
        payload.Payload
      );

    payload.Error =
      this.errorMessage(
        payload.Error
      );

    payload.Attempts =
      this.normalizeAttempts(
        payload.Attempts
      );

    payload.Status =
      this.normalizeStatus(
        payload.Status || "FAILED"
      );

    payload.Processor =
      String(
        payload.Processor ||
        options.processor ||
        "ERP"
      );

    payload.CreatedAt =
      this.toIsoString(
        payload.CreatedAt
      );

    payload.UpdatedAt =
      this.toIsoString(
        payload.UpdatedAt ||
        payload.CreatedAt
      );

    if (payload.LastAttemptAt) {
      payload.LastAttemptAt =
        this.toIsoString(
          payload.LastAttemptAt
        );
    }

    if (payload.NextRetryAt) {
      payload.NextRetryAt =
        this.toIsoString(
          payload.NextRetryAt
        );
    }

    [
      "id",
      "organizationId",
      "eventId",
      "entity",
      "type",
      "payload",
      "error",
      "attempts",
      "status",
      "processor",
      "lastAttemptAt",
      "nextRetryAt",
      "timestamp",
      "createdAt",
      "updatedAt",
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
    if (!field) {
      throw new Error(
        "FailedEventRepository.findWhere: field required"
      );
    }

    return this.findAll(
      { [field]: value },
      options
    );
  },

  findByEventId(
    eventId,
    options = {}
  ) {
    this.requireId(
      eventId,
      "findByEventId"
    );

    return this.findWhere(
      "EventID",
      eventId,
      options
    );
  },

  findByStatus(
    status,
    options = {}
  ) {
    return this.findWhere(
      "Status",
      this.normalizeStatus(status),
      options
    );
  },

  getPending(options = {}) {
    const allowed =
      this.retryableStatuses;

    return this.findAll(
      {},
      options
    ).filter((row) => {
      return allowed.includes(
        this.normalizeStatus(
          row.Status
        )
      );
    });
  },

  findRetryable(
    maxAttempts = 5,
    options = {}
  ) {
    const limit =
      Math.max(
        1,
        Number(maxAttempts) || 5
      );

    return this.getPending(options)
      .filter((row) => {
        return (
          Number(row.Attempts || 0) <
          limit
        );
      });
  },

  count(filters = {}, options = {}) {
    return this.findAll(
      filters,
      options
    ).length;
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
  // RETRY STATE
  // ============================================================

  increaseAttempts(id, options = {}) {
    const row =
      this.findById(id);

    if (!row) {
      throw new Error(
        "FAILED_EVENT not found " + id
      );
    }

    return this.updateStatus(id, {
      Attempts:
        Number(row.Attempts || 0) + 1,
      Status:
        options.status ||
        "RETRY",
      Error:
        options.error !== undefined
          ? this.errorMessage(
              options.error
            )
          : row.Error,
      Processor:
        options.processor ||
        row.Processor,
      LastAttemptAt:
        options.lastAttemptAt ||
        new Date().toISOString(),
      NextRetryAt:
        options.nextRetryAt ||
        null,
    });
  },

  markCompleted(id, options = {}) {
    return this.updateStatus(id, {
      Status: "DONE",
      Processor:
        options.processor,
      LastAttemptAt:
        options.completedAt ||
        new Date().toISOString(),
      NextRetryAt: null,
    });
  },

  markFailed(
    id,
    error,
    options = {}
  ) {
    return this.updateStatus(id, {
      Status: "FAILED",
      Error:
        this.errorMessage(error),
      Processor:
        options.processor,
      LastAttemptAt:
        options.failedAt ||
        new Date().toISOString(),
      NextRetryAt:
        options.nextRetryAt ||
        null,
    });
  },

  updateStatus(id, data = {}) {
    this.requireId(
      id,
      "updateStatus"
    );

    this.requireObject(
      data,
      "updateStatus"
    );

    const payload = {};

    Object.keys(data)
      .forEach((field) => {
        if (
          !this.mutableFields.includes(
            field
          )
        ) {
          throw new Error(
            "FailedEventRepository.updateStatus: field forbidden " +
              field
          );
        }

        if (data[field] !== undefined) {
          payload[field] =
            data[field];
        }
      });

    if (
      payload.Attempts !== undefined
    ) {
      payload.Attempts =
        this.normalizeAttempts(
          payload.Attempts
        );
    }

    if (
      payload.Status !== undefined
    ) {
      payload.Status =
        this.normalizeStatus(
          payload.Status
        );
    }

    if (
      payload.Error !== undefined
    ) {
      payload.Error =
        this.errorMessage(
          payload.Error
        );
    }

    [
      "LastAttemptAt",
      "NextRetryAt",
      "UpdatedAt",
    ].forEach((field) => {
      if (payload[field]) {
        payload[field] =
          this.toIsoString(
            payload[field]
          );
      }
    });

    payload.UpdatedAt =
      new Date().toISOString();

    return this.ensureReady().update(
      id,
      payload
    );
  },

  archiveCompleted(options = {}) {
    return this.findByStatus(
      "DONE",
      options
    );
  },

  // ============================================================
  // PROTECTED MUTATIONS
  // ============================================================

  update() {
    throw new Error(
      "FailedEventRepository.update forbidden: use updateStatus"
    );
  },

  delete() {
    throw new Error(
      "FailedEventRepository.delete forbidden: durable queue"
    );
  },

  restore() {
    throw new Error(
      "FailedEventRepository.restore forbidden"
    );
  },

  bulkUpdate() {
    throw new Error(
      "FailedEventRepository.bulkUpdate forbidden"
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
        "FailedEventRepository requires BaseRepository"
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
        "FailedEventRepository." +
          method +
          ": id required"
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
        "FailedEventRepository." +
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
      payload[target] =
        payload[source];
    }
  },

  normalizeAttempts(value) {
    const attempts =
      Number(value || 0);

    if (
      !Number.isFinite(attempts) ||
      attempts < 0
    ) {
      throw new Error(
        "FailedEventRepository: invalid Attempts"
      );
    }

    return Math.floor(attempts);
  },

  normalizeStatus(value) {
    const status =
      String(value || "")
        .trim()
        .toUpperCase();

    if (!status) {
      throw new Error(
        "FailedEventRepository: Status required"
      );
    }

    return status;
  },

  serializePayload(value) {
    if (value === undefined) {
      return "{}";
    }

    if (typeof value === "string") {
      return value;
    }

    try {
      return JSON.stringify(value);
    } catch (error) {
      throw new Error(
        "FailedEventRepository: Payload is not serializable"
      );
    }
  },

  errorMessage(error) {
    if (
      error &&
      typeof error === "object" &&
      error.message
    ) {
      return String(error.message);
    }

    return String(
      error || "Unknown error"
    );
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
        "FailedEventRepository: invalid timestamp"
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
    } catch (error) {
      // Diagnostics remains available during early loading.
    }

    return {
      module:
        "FailedEventRepository",
      version: this.version,
      entity: this.entity,
      table:
        meta?.table || this.table,
      architecture:
        this.architecture,
      durable: true,
      deleteAllowed: false,
      retryableStatuses:
        this.retryableStatuses.slice(),
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
      timestamp:
        new Date().toISOString(),
    };
  },

  health() {
    const data =
      this.diagnostics();

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
        "FailedEventRepository",
        status,
        data
      );
    }

    return {
      module:
        "FailedEventRepository",
      status,
      ...data,
    };
  },
};

globalThis.FailedEventRepository =
  FailedEventRepository;

try {
  FailedEventRepository.init();
} catch (error) {
  Logger.warn(
    "FailedEventRepository deferred: " +
      error.message
  );
}

Logger.log(
  "FailedEventRepository GLOBAL READY v" +
    FailedEventRepository.version
);
