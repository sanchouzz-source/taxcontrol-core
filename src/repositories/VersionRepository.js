// ============================================================
// VersionRepository v2.0.1
// Append-Only Version History Repository
// TaxControl ERP Core
//
// Rules:
// - version rows can be created and read
// - version rows cannot be updated, deleted or restored
//
// Fixed in v2.0.0:
// - uses a bound BaseRepository for VERSION
// - read/count/paginate follow the BaseRepository v6.3.1 contract
// - findLatest uses VersionNumber and supports legacy Version/Timestamp
// - canonical and legacy field aliases are normalized on create
// - Factory and Registry registration can be safely retried
//
// Compatible:
// EntityMetadata v3.2+
// EntityRegistry v2.6+
// BaseRepository v6.3.1+
// RepositoryFactory v3.1.1+
// RepositoryRegistry v2.1+
// ============================================================

console.log("VersionRepository v2.0.1");

const VersionRepository = {
  version: "2.0.1",

  entity: "VERSION",
  table: "Versions",

  architecture:
    "Versioning -> VersionRepository -> Bound BaseRepository -> Database",

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
      "VersionRepository INIT READY v" +
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

    return base;
  },

  useAdapterForTest(adapter) {
    this._base =
      this.createBaseRepository(adapter);

    /*
     * Unit tests verify repository behavior without writing a second
     * audit row through the real AuditLog.
     */
    this._base.audit = function () {};
    this._base.emit = function () {};

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
        "VersionRepository REGISTERED"
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

  createVersion(
    entity,
    entityId,
    snapshot,
    options = {}
  ) {
    if (!entity) {
      throw new Error(
        "VersionRepository.createVersion: entity required"
      );
    }

    this.requireId(
      entityId,
      "createVersion"
    );

    const versionNumber =
      options.versionNumber ||
      this.nextVersionNumber(
        entity,
        entityId
      );

    return this.create({
      Entity: entity,
      EntityID: entityId,
      VersionNumber:
        versionNumber,
      Snapshot: snapshot,
      Hash: options.hash,
      Source:
        options.source ||
        "VersionRepository",
      OrganizationID:
        options.organizationId,
      CreatedAt:
        options.createdAt,
    });
  },

  bulkCreate(items = [], options = {}) {
    if (!Array.isArray(items)) {
      throw new Error(
        "VersionRepository.bulkCreate: items must be an array"
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

    this.copyAlias(
      payload,
      "VersionID",
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
      "VersionNumber",
      "versionNumber"
    );
    this.copyAlias(
      payload,
      "VersionNumber",
      "Version"
    );
    this.copyAlias(
      payload,
      "Snapshot",
      "snapshot"
    );
    this.copyAlias(
      payload,
      "Hash",
      "hash"
    );
    this.copyAlias(
      payload,
      "Source",
      "source"
    );
    this.copyAlias(
      payload,
      "CreatedAt",
      "timestamp"
    );
    this.copyAlias(
      payload,
      "CreatedAt",
      "Timestamp"
    );

    if (
      payload.VersionNumber ===
        undefined &&
      options.versionNumber !==
        undefined
    ) {
      payload.VersionNumber =
        options.versionNumber;
    }

    payload.VersionNumber = Number(
      payload.VersionNumber || 1
    );

    payload.Source =
      payload.Source ||
      options.source ||
      "VersionRepository";

    payload.CreatedAt =
      this.toIsoString(
        payload.CreatedAt
      );

    [
      "id",
      "organizationId",
      "entity",
      "entityId",
      "versionNumber",
      "Version",
      "snapshot",
      "hash",
      "source",
      "timestamp",
      "Timestamp",
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
    entityId,
    options = {}
  ) {
    if (!entity) {
      throw new Error(
        "VersionRepository entity required"
      );
    }

    this.requireId(
      entityId,
      "findByEntity"
    );

    return this.findAll(
      {
        Entity: entity,
        EntityID: entityId,
      },
      options
    );
  },

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

    return rows
      .slice()
      .sort((a, b) => {
        const versionDifference =
          this.readVersionNumber(b) -
          this.readVersionNumber(a);

        if (versionDifference) {
          return versionDifference;
        }

        return (
          this.readTimestamp(b) -
          this.readTimestamp(a)
        );
      })[0];
  },

  findByHash(hash, options = {}) {
    this.requireId(
      hash,
      "findByHash"
    );

    return this.findWhere(
      "Hash",
      hash,
      options
    );
  },

  nextVersionNumber(
    entity,
    entityId
  ) {
    const latest =
      this.findLatest(
        entity,
        entityId
      );

    return latest
      ? this.readVersionNumber(latest) + 1
      : 1;
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
      "VersionRepository.update forbidden: immutable history"
    );
  },

  delete() {
    throw new Error(
      "VersionRepository.delete forbidden: immutable history"
    );
  },

  restore() {
    throw new Error(
      "VersionRepository.restore forbidden"
    );
  },

  bulkUpdate() {
    throw new Error(
      "VersionRepository.bulkUpdate forbidden: immutable history"
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
        "VersionRepository requires BaseRepository"
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
        "VersionRepository." +
          method +
          ": id required"
      );
    }
  },

  requireField(field, method) {
    if (!field) {
      throw new Error(
        "VersionRepository." +
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
        "VersionRepository." +
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
        "VersionRepository: invalid timestamp"
      );
    }

    return date.toISOString();
  },

  readVersionNumber(row) {
    return Number(
      row?.VersionNumber ??
      row?.Version ??
      row?.versionNumber ??
      0
    );
  },

  readTimestamp(row) {
    const value =
      row?.CreatedAt ??
      row?.Timestamp ??
      row?.timestamp ??
      0;

    const parsed =
      Date.parse(value);

    return isNaN(parsed) ? 0 : parsed;
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
      module: "VersionRepository",
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
        "VersionRepository",
        status,
        data
      );
    }

    return {
      module: "VersionRepository",
      status,
      ...data,
    };
  },
};

globalThis.VersionRepository =
  VersionRepository;

Logger.log(
  "VersionRepository GLOBAL READY v" +
    VersionRepository.version
);
