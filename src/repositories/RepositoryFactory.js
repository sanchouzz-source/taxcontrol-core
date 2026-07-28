// ============================================================
// RepositoryFactory v3.1.1
// Enterprise Repository Factory + Registry Synchronization
// TaxControl ERP Core
//
// Architecture:
//
// EntityService
//       |
// RepositoryFactory
//       |
// RepositoryRegistry
//       |
// Entity Repository
//       |
// BaseRepository
//
// Fixed in v3.1.1:
// - imports repositories already collected by RepositoryRegistry
// - supports repositories loaded before RepositoryFactory
// - prevents the technical BASE prototype from being registered
// - exposes a registry/factory consistency report
//
// Compatible:
// EntityRegistry v2.5+
// BaseRepository v6.3.1+
// RepositoryRegistry v2.1+
// ============================================================

console.log("RepositoryFactory v3.1.1");

const RepositoryFactory = {
  version: "3.1.1",

  initialized: false,
  repositories: {},
  auditLog: [],

  // ============================================================
  // INIT
  // ============================================================

  init() {
    if (this.initialized) {
      return true;
    }

    Logger.log(
      "RepositoryFactory INIT v" +
        this.version
    );

    /*
     * The factory is loaded after several repository files in the
     * current Apps Script project. RepositoryRegistry has already
     * collected those global repositories by this point.
     *
     * Set initialized before synchronization because registry.register()
     * calls back into RepositoryFactory.register().
     */
    this.initialized = true;

    this.syncRegistry();

    Logger.log(
      "RepositoryFactory READY v" +
        this.version +
        " count=" +
        this.list().length
    );

    return true;
  },

  // ============================================================
  // REGISTER
  // ============================================================

  register(entity, repository, options = {}) {
    const key = this.resolveEntity(entity);

    this.requireBusinessEntity(
      key,
      "register"
    );

    if (!repository) {
      throw new Error(
        "Repository missing for " + key
      );
    }

    if (
      this.repositories[key] &&
      !options.force
    ) {
      return this.repositories[key];
    }

    this.repositories[key] = repository;

    this.auditLog.push({
      entity: key,
      repository:
        repository.constructor?.name ||
        "object",
      time: new Date().toISOString(),
    });

    if (
      options.skipRegistry !== true &&
      typeof RepositoryRegistry !== "undefined" &&
      typeof RepositoryRegistry.register === "function"
    ) {
      RepositoryRegistry.register(
        key,
        repository
      );
    }

    Logger.log(
      "RepositoryFactory REGISTER " + key
    );

    return repository;
  },

  registerLoaded(entity, repository) {
    return this.register(
      entity,
      repository,
      { force: true }
    );
  },

  // ============================================================
  // REGISTRY SYNCHRONIZATION
  // ============================================================

  syncRegistry() {
    if (
      typeof RepositoryRegistry === "undefined"
    ) {
      return {
        available: false,
        imported: 0,
      };
    }

    /*
     * collectGlobals() is safe to repeat and catches repositories
     * loaded before the factory. RepositoryRegistry.register()
     * immediately synchronizes each collected repository back here.
     */
    if (
      typeof RepositoryRegistry.collectGlobals ===
      "function"
    ) {
      RepositoryRegistry.collectGlobals();
    }

    let imported = 0;

    if (
      typeof RepositoryRegistry.list === "function" &&
      typeof RepositoryRegistry.get === "function"
    ) {
      RepositoryRegistry.list().forEach(
        (entity) => {
          const key =
            this.resolveEntity(entity);

          if (key === "BASE") {
            return;
          }

          const repository =
            RepositoryRegistry.get(key);

          this.register(
            key,
            repository,
            {
              force: true,
              skipRegistry: true,
            }
          );

          imported++;
        }
      );
    }

    return {
      available: true,
      imported,
    };
  },

  // ============================================================
  // GET
  // ============================================================

  get(entity) {
    const key = this.resolveEntity(entity);

    this.requireBusinessEntity(
      key,
      "get"
    );

    if (this.repositories[key]) {
      return this.repositories[key];
    }

    /*
     * A late-loaded named repository may already exist in the registry.
     * Prefer it over creating a generic BaseRepository wrapper.
     */
    if (
      typeof RepositoryRegistry !== "undefined" &&
      typeof RepositoryRegistry.has === "function" &&
      RepositoryRegistry.has(key)
    ) {
      const repository =
        RepositoryRegistry.get(key);

      return this.register(
        key,
        repository,
        {
          force: true,
          skipRegistry: true,
        }
      );
    }

    if (typeof BaseRepository === "undefined") {
      throw new Error(
        "BaseRepository unavailable"
      );
    }

    const repository =
      BaseRepository.createRepository(key);

    this.register(key, repository);

    return repository;
  },

  // ============================================================
  // RESOLVE / VALIDATE
  // ============================================================

  resolveEntity(entity) {
    if (
      typeof EntityRegistry !== "undefined" &&
      typeof EntityRegistry.resolve === "function"
    ) {
      try {
        return EntityRegistry.resolve(entity);
      } catch (e) {
        // The normalized value below is used during early loading.
      }
    }

    return String(entity || "")
      .trim()
      .toUpperCase();
  },

  requireBusinessEntity(entity, method) {
    if (!entity) {
      throw new Error(
        "RepositoryFactory." +
          method +
          ": entity missing"
      );
    }

    if (entity === "BASE") {
      throw new Error(
        "RepositoryFactory." +
          method +
          ": BASE is an infrastructure prototype"
      );
    }

    return entity;
  },

  // ============================================================
  // AUDIT / CONSISTENCY
  // ============================================================

  audit() {
    const result = [];

    const entities =
      typeof EntityRegistry !== "undefined" &&
      typeof EntityRegistry.list === "function"
        ? EntityRegistry.list()
        : [];

    entities.forEach((entity) => {
      const repository =
        this.repositories[entity];

      const meta =
        typeof EntityRegistry !== "undefined" &&
        typeof EntityRegistry.get === "function"
          ? EntityRegistry.get(entity)
          : null;

      result.push({
        entity,
        repository:
          repository ? "FOUND" : "MISSING",
        table: meta?.table || null,
        methods:
          repository
            ? this.checkMethods(repository)
            : [],
      });
    });

    return result;
  },

  checkMethods(repository) {
    const required = [
      "create",
      "findById",
      "findAll",
      "update",
      "delete",
    ];

    return required.filter(
      (method) =>
        typeof repository[method] !==
        "function"
    );
  },

  consistency() {
    const factory = this.list()
      .filter((entity) => entity !== "BASE")
      .sort();

    const registry =
      typeof RepositoryRegistry !== "undefined" &&
      typeof RepositoryRegistry.list === "function"
        ? RepositoryRegistry.list()
            .filter(
              (entity) => entity !== "BASE"
            )
            .sort()
        : [];

    return {
      factory,
      registry,
      missingInFactory:
        registry.filter(
          (entity) =>
            !this.repositories[entity]
        ),
      missingInRegistry:
        factory.filter(
          (entity) =>
            !registry.includes(entity)
        ),
      baseRegistered:
        factory.includes("BASE") ||
        registry.includes("BASE"),
    };
  },

  // ============================================================
  // LIST / CHECK
  // ============================================================

  list() {
    return Object.keys(this.repositories);
  },

  has(entity) {
    const key = this.resolveEntity(entity);

    if (key === "BASE") {
      return false;
    }

    return !!this.repositories[key];
  },

  // ============================================================
  // RESET
  // ============================================================

  reset() {
    this.repositories = {};
    this.auditLog = [];
    this.initialized = false;

    return true;
  },

  // ============================================================
  // HEALTH / DIAGNOSTICS
  // ============================================================

  health() {
    const audit = this.audit();

    const errors = audit.filter(
      (item) =>
        item.repository === "MISSING" ||
        item.methods.length
    );

    const consistency =
      this.consistency();

    const status =
      errors.length ||
      consistency.missingInFactory.length ||
      consistency.missingInRegistry.length ||
      consistency.baseRegistered
        ? "WARNING"
        : "OK";

    const data = {
      version: this.version,
      repositories: this.list(),
      count: this.list().length,
      audit: errors,
      consistency,
    };

    if (
      typeof HealthContract !== "undefined" &&
      typeof HealthContract.create === "function"
    ) {
      return HealthContract.create(
        "RepositoryFactory",
        status,
        data
      );
    }

    return {
      module: "RepositoryFactory",
      status,
      ...data,
    };
  },

  diagnostics() {
    return {
      module: "RepositoryFactory",
      version: this.version,
      initialized: this.initialized,
      repositories: this.list(),
      audit: this.audit(),
      consistency: this.consistency(),
    };
  },
};

globalThis.RepositoryFactory =
  RepositoryFactory;

RepositoryFactory.init();

Logger.log(
  "RepositoryFactory GLOBAL READY v" +
    RepositoryFactory.version
);
