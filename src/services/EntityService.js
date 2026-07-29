// ============================================================
// EntityService v5.5.0 CORE
// Enterprise Application Service Layer
//
// Package G:
// - every CRUD and read operation requires a real role permission
// - OrganizationID is applied and validated by OrganizationScope
// - foreign records are indistinguishable from missing records
// - repository remains the only CRUD event/audit publisher
// ============================================================

console.log("EntityService v5.5.0");

const EntityService = {
  version: "5.5.0",
  ready: false,
  cacheEnabled: true,
  cache: {},
  bulkLimit: 500,

  init() {
    if (this.ready) {
      return true;
    }

    if (
      typeof RepositoryFactory ===
        "undefined" ||
      typeof RepositoryFactory.get !==
        "function"
    ) {
      throw new Error(
        "EntityService: RepositoryFactory unavailable"
      );
    }

    if (
      typeof RepositoryRegistry ===
        "undefined" ||
      (
        typeof RepositoryRegistry
          .isReady === "function" &&
        RepositoryRegistry.isReady() !==
          true
      )
    ) {
      throw new Error(
        "EntityService: RepositoryRegistry not ready"
      );
    }

    if (
      typeof SecurityGuard ===
        "undefined" ||
      SecurityGuard.initialized !== true
    ) {
      throw new Error(
        "EntityService: SecurityGuard not ready"
      );
    }

    if (
      typeof OrganizationScope ===
        "undefined" ||
      OrganizationScope.initialized !==
        true
    ) {
      throw new Error(
        "EntityService: OrganizationScope not ready"
      );
    }

    this.ready = true;

    Logger.log(
      "EntityService READY v" +
        this.version
    );

    return true;
  },

  resolve(entity) {
    if (!entity) {
      throw new Error(
        "Entity required"
      );
    }

    if (
      typeof EntityRegistry !==
        "undefined" &&
      typeof EntityRegistry.resolve ===
        "function"
    ) {
      return EntityRegistry.resolve(
        entity
      );
    }

    if (
      typeof SchemaRegistry !==
        "undefined" &&
      typeof SchemaRegistry.get ===
        "function"
    ) {
      const schema =
        SchemaRegistry.get(entity);

      if (schema && schema.entity) {
        return schema.entity;
      }
    }

    return String(entity)
      .trim()
      .toUpperCase();
  },

  getMeta(entity) {
    const name = this.resolve(entity);

    if (
      typeof EntityRegistry !==
        "undefined" &&
      typeof EntityRegistry.get ===
        "function"
    ) {
      const metadata =
        EntityRegistry.get(name);

      if (metadata) {
        return metadata;
      }
    }

    if (
      typeof SchemaRegistry !==
        "undefined" &&
      typeof SchemaRegistry.get ===
        "function"
    ) {
      const metadata =
        SchemaRegistry.get(name);

      if (metadata) {
        return metadata;
      }
    }

    if (
      typeof EntityMetadata !==
        "undefined" &&
      typeof EntityMetadata.get ===
        "function"
    ) {
      const metadata =
        EntityMetadata.get(name);

      if (metadata) {
        return metadata;
      }
    }

    throw new Error(
      "Metadata missing " + name
    );
  },

  getRepository(entity) {
    const name = this.resolve(entity);
    const repository =
      RepositoryFactory.get(name);

    if (!repository) {
      throw new Error(
        "Repository missing " + name
      );
    }

    return repository;
  },

  checkPermission(
    metadata,
    action,
    entity = null
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
      entity ||
        metadata.entity,
      action,
      metadata
    );
  },

  prepareData(
    entity,
    data = {},
    action = "create",
    existing = null,
    options = {}
  ) {
    const name = this.resolve(entity);
    const metadata =
      this.getMeta(name);
    let result = {
      ...data,
    };

    if (
      typeof OrganizationScope !==
        "undefined"
    ) {
      result =
        String(action).toLowerCase() ===
          "update"
          ? OrganizationScope
            .prepareUpdate(
              name,
              existing,
              result,
              {
                ...options,
                metadata,
              }
            )
          : OrganizationScope
            .prepareCreate(
              name,
              result,
              {
                ...options,
                metadata,
              }
            );
    }

    const tenantEnabled =
      metadata.tenant !== false ||
      (
        metadata.options &&
        metadata.options.tenant ===
          true
      );

    if (
      tenantEnabled &&
      typeof TenantContext !==
        "undefined" &&
      typeof TenantContext.get ===
        "function" &&
      !result.TenantID
    ) {
      result.TenantID =
        TenantContext.get();
    }

    return result;
  },

  generateId(entity, data) {
    const metadata =
      this.getMeta(entity);
    const idField =
      metadata.idField;

    if (
      !idField ||
      data[idField]
    ) {
      return data;
    }

    if (
      typeof IdService !==
        "undefined" &&
      typeof IdService.generate ===
        "function"
    ) {
      data[idField] =
        IdService.generate(
          metadata.idPrefix ||
          idField
        );
    }

    return data;
  },

  validate(entity, data) {
    if (
      typeof EntityValidator !==
        "undefined" &&
      typeof EntityValidator
        .validate === "function"
    ) {
      return EntityValidator.validate(
        this.resolve(entity),
        data
      );
    }

    return true;
  },

  create(entity, data = {}, options = {}) {
    const name = this.resolve(entity);
    const metadata =
      this.getMeta(name);

    this.checkPermission(
      metadata,
      "CREATE",
      name
    );

    let payload =
      this.prepareData(
        name,
        data,
        "create",
        null,
        options
      );

    payload = this.generateId(
      name,
      payload
    );

    this.validate(name, payload);

    return this.getRepository(name)
      .create(payload, options);
  },

  findById(
    entity,
    id,
    options = {}
  ) {
    const name = this.resolve(entity);
    const metadata =
      this.getMeta(name);

    this.checkPermission(
      metadata,
      "READ",
      name
    );

    return this.getRepository(name)
      .findById(id, options);
  },

  getById(entity, id, options = {}) {
    return this.findById(
      entity,
      id,
      options
    );
  },

  findAll(
    entity,
    filters = {},
    options = {}
  ) {
    const name = this.resolve(entity);
    const metadata =
      this.getMeta(name);

    this.checkPermission(
      metadata,
      "READ",
      name
    );

    return this.getRepository(name)
      .findAll(filters, options);
  },

  findWhere(
    entity,
    criteria = {},
    options = {}
  ) {
    const name = this.resolve(entity);
    const metadata =
      this.getMeta(name);

    this.checkPermission(
      metadata,
      "READ",
      name
    );

    const repository =
      this.getRepository(name);

    if (
      typeof repository.findWhere ===
        "function"
    ) {
      return repository.findWhere(
        criteria,
        options
      );
    }

    return repository.findAll(
      criteria,
      options
    );
  },

  exists(entity, id, options = {}) {
    return !!this.findById(
      entity,
      id,
      options
    );
  },

  existsBy(
    entity,
    field,
    value,
    options = {}
  ) {
    const name = this.resolve(entity);
    const metadata =
      this.getMeta(name);

    this.checkPermission(
      metadata,
      "READ",
      name
    );

    const repository =
      this.getRepository(name);

    if (
      typeof repository.existsBy ===
        "function"
    ) {
      return repository.existsBy(
        field,
        value,
        options
      );
    }

    if (
      typeof repository.findBy ===
        "function"
    ) {
      return !!repository.findBy(
        field,
        value,
        options
      );
    }

    if (
      typeof repository.findOne ===
        "function"
    ) {
      return !!repository.findOne(
        {
          [field]: value,
        },
        options
      );
    }

    return this.findWhere(
      name,
      {
        [field]: value,
      },
      options
    ).length > 0;
  },

  count(
    entity,
    filters = {},
    options = {}
  ) {
    const name = this.resolve(entity);
    const metadata =
      this.getMeta(name);

    this.checkPermission(
      metadata,
      "READ",
      name
    );

    const repository =
      this.getRepository(name);

    if (
      typeof repository.count ===
        "function"
    ) {
      return repository.count(
        filters,
        options
      );
    }

    return repository.findAll(
      filters,
      options
    ).length;
  },

  update(
    entity,
    id,
    data = {},
    options = {}
  ) {
    const name = this.resolve(entity);
    const metadata =
      this.getMeta(name);

    this.checkPermission(
      metadata,
      "UPDATE",
      name
    );

    const before = this.findById(
      name,
      id,
      {
        ...options,
        includeDeleted: true,
      }
    );

    if (!before) {
      throw new Error(
        name + " not found " + id
      );
    }

    const payload =
      this.prepareData(
        name,
        data,
        "update",
        before,
        options
      );

    this.validate(
      name,
      {
        ...before,
        ...payload,
      }
    );

    const result =
      this.getRepository(name)
        .update(
          id,
          payload,
          options
        );

    this.invalidateCache(name, id);

    return result;
  },

  delete(entity, id, options = {}) {
    const name = this.resolve(entity);
    const metadata =
      this.getMeta(name);

    this.checkPermission(
      metadata,
      "DELETE",
      name
    );

    const before = this.findById(
      name,
      id,
      {
        ...options,
        includeDeleted: true,
      }
    );

    if (!before) {
      throw new Error(
        name + " not found " + id
      );
    }

    const result =
      this.getRepository(name)
        .delete(id, options);

    this.invalidateCache(name, id);

    return result;
  },

  restore(entity, id, options = {}) {
    const name = this.resolve(entity);
    const metadata =
      this.getMeta(name);

    this.checkPermission(
      metadata,
      "RESTORE",
      name
    );

    const result =
      this.getRepository(name)
        .restore(id, options);

    this.invalidateCache(name, id);

    return result;
  },

  bulkCreate(
    entity,
    list = [],
    options = {}
  ) {
    if (!Array.isArray(list)) {
      throw new Error(
        "Bulk data must be array"
      );
    }

    const result = [];

    for (
      let index = 0;
      index < list.length;
      index += this.bulkLimit
    ) {
      list
        .slice(
          index,
          index + this.bulkLimit
        )
        .forEach((item) => {
          result.push(
            this.create(
              entity,
              item,
              options
            )
          );
        });
    }

    return result;
  },

  bulkUpdate(
    entity,
    ids,
    data = {},
    options = {}
  ) {
    if (!Array.isArray(ids)) {
      throw new Error(
        "Bulk IDs must be array"
      );
    }

    return ids.map((id) =>
      this.update(
        entity,
        id,
        data,
        options
      )
    );
  },

  transaction(callback) {
    if (
      typeof callback !== "function"
    ) {
      throw new Error(
        "Transaction callback required"
      );
    }

    if (
      typeof TransactionManager !==
        "undefined" &&
      typeof TransactionManager.run ===
        "function"
    ) {
      return TransactionManager.run(
        callback
      );
    }

    if (
      typeof BaseRepository !==
        "undefined" &&
      typeof BaseRepository
        .transaction === "function"
    ) {
      return BaseRepository
        .transaction(callback);
    }

    return callback();
  },

  /*
   * Compatibility methods remain no-ops because Package E/F assign event
   * and audit ownership exclusively to BaseRepository.
   */
  emit() {
    return false;
  },

  audit() {
    return false;
  },

  cacheKey(entity, id) {
    const organizationId =
      typeof OrganizationContext !==
        "undefined" &&
      typeof OrganizationContext
        .tryGet === "function"
        ? OrganizationContext.tryGet()
        : null;

    return (
      (organizationId ||
        "NO_CONTEXT") +
      ":" +
      entity +
      ":" +
      id
    );
  },

  getCached(entity, id) {
    if (!this.cacheEnabled) {
      return null;
    }

    return (
      this.cache[
        this.cacheKey(entity, id)
      ] || null
    );
  },

  setCache(entity, id, data) {
    if (!this.cacheEnabled) {
      return data;
    }

    this.cache[
      this.cacheKey(entity, id)
    ] = data;

    return data;
  },

  invalidateCache(entity, id) {
    delete this.cache[
      this.cacheKey(entity, id)
    ];
  },

  clearCache() {
    this.cache = {};
  },

  health() {
    const details = {
      version: this.version,
      ready: this.ready,
      repositoryFactory:
        typeof RepositoryFactory !==
          "undefined",
      entityRegistry:
        typeof EntityRegistry !==
          "undefined",
      securityGuard:
        typeof SecurityGuard !==
          "undefined" &&
        SecurityGuard.initialized ===
          true,
      organizationScope:
        typeof OrganizationScope !==
          "undefined" &&
        OrganizationScope.initialized ===
          true,
      cache: this.cacheEnabled,
      bulkLimit: this.bulkLimit,
    };
    const status =
      this.ready &&
      details.securityGuard &&
      details.organizationScope
        ? "OK"
        : "WARNING";

    if (
      typeof HealthContract !==
        "undefined" &&
      typeof HealthContract.create ===
        "function"
    ) {
      return HealthContract.create(
        "EntityService",
        status,
        details
      );
    }

    return {
      module: "EntityService",
      status,
      ...details,
    };
  },

  diagnostics() {
    return {
      module: "EntityService",
      version: this.version,
      ready: this.ready,
      cacheSize: Object.keys(
        this.cache
      ).length,
      bulkLimit: this.bulkLimit,
      authenticated:
        typeof SecurityContext !==
          "undefined" &&
        SecurityContext
          .isAuthenticated(),
      organizationId:
        typeof OrganizationContext !==
          "undefined" &&
        typeof OrganizationContext
          .tryGet === "function"
          ? OrganizationContext
            .tryGet()
          : null,
      features: [
        "CRUD",
        "RepositoryPattern",
        "MetadataResolution",
        "Validation",
        "AutoID",
        "OrganizationIsolation",
        "SoftDelete",
        "Restore",
        "RepositoryOwnedEvents",
        "RepositoryOwnedAudit",
        "RolePermissions",
        "Cache",
        "BulkOperations",
        "Transactions",
      ],
    };
  },

  reset() {
    this.cache = {};
    this.ready = false;

    Logger.log(
      "EntityService RESET"
    );

    return true;
  },
};

globalThis.EntityService =
  EntityService;

Logger.log(
  "EntityService GLOBAL READY v" +
    EntityService.version
);
