// ============================================================
// RepositoryFactory v2.7.3
// Enterprise Repository Dependency Container
// TaxControl ERP Core
//
// Compatible:
// BaseRepository v5.6+
// EntityService v5.x
// SystemInit v2.5+
// ============================================================

console.log("RepositoryFactory v2.7.3");

const RepositoryFactory = {
  version: "2.7.3",
  apiVersion: "2.5",

  repositories: {},
  metadata: {},
  pending: {},

  initialized: false,
  initializing: false,

  discoveryRuns: 0,

  // ============================================================
  // INIT
  // ============================================================

  init() {
    if (this.initialized) {
      Logger.debug("RepositoryFactory already initialized");
      return true;
    }

    this.initializing = true;

    try {
      Logger.log("RepositoryFactory INIT");

      this.loadRegistry();
      this.discovery();
      this.autoRegister();
      this.refreshPending();
      this.syncRegistry();

      this.initialized = true;

      Logger.log(
        "RepositoryFactory READY v" +
          this.version +
          " count=" +
          this.count()
      );

      return true;
    } catch (e) {
      Logger.error("RepositoryFactory FAILED " + e.message);
      throw e;
    } finally {
      this.initializing = false;
    }
  },

  // ============================================================
  // LOAD REGISTRY
  // ============================================================

  loadRegistry() {
    if (typeof RepositoryRegistry === "undefined") {
      return;
    }

    try {
      RepositoryRegistry.list().forEach((entity) => {
        const repo = RepositoryRegistry.get(entity);
        if (repo) {
          this.register(entity, repo);
        }
      });
    } catch (e) {
      Logger.warn("RepositoryRegistry load failed " + e.message);
    }
  },

  // ============================================================
  // DISCOVERY
  // ============================================================

  discovery() {
    this.discoveryRuns++;

    Object.keys(globalThis)
      .filter((x) => x.endsWith("Repository"))
      .forEach((name) => {
        const repo = globalThis[name];
        if (!repo) {
          return;
        }
        const entity = this.resolveEntity(repo, name);
        if (entity) {
          this.register(entity, repo);
        }
      });
  },

  // ============================================================
  // ENTITY RESOLVE
  // ============================================================

  resolveEntity(repo, name) {
    if (repo.entity) {
      return repo.entity;
    }
    return name
      .replace("Repository", "")
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .toUpperCase();
  },

  // ============================================================
  // AUTO REGISTER
  // ============================================================

  autoRegister() {
    if (typeof EntityRegistry === "undefined") {
      return;
    }

    EntityRegistry.list().forEach((entity) => {
      if (entity.startsWith("__TEST_")) {
        return;
      }
      if (this.repositories[entity]) {
        return;
      }

      const meta = EntityRegistry.get(entity);
      const repoName = meta.repository || this.buildRepositoryName(entity);
      let repo = this.resolveRepository(repoName);

      if (!repo) {
        repo = this.createFallbackRepository(entity);
      }

      if (repo) {
        this.register(entity, repo);
      }
    });
  },

  // ============================================================
  // BUILD NAME
  // ============================================================

  buildRepositoryName(entity) {
    const special = {
      KPI: "KPIRepository",
      AUDIT: "AuditRepository",
      VERSION: "VersionRepository",
      FINANCIAL_TRANSACTION: "FinancialTransactionRepository",
    };

    if (special[entity]) {
      return special[entity];
    }

    return entity
      .split("_")
      .map((x) => x.charAt(0) + x.slice(1).toLowerCase())
      .join("") + "Repository";
  },

  // ============================================================
  // FALLBACK
  // ============================================================

  createFallbackRepository(entity) {
    if (typeof BaseRepository === "undefined") {
      return null;
    }

    const base = BaseRepository;

    const proxy = {
      entity,
      version: "BaseRepository-" + base.version,
      repositoryType: "BASE",

      create(data) {
        return base.create(entity, data);
      },
      findById(id) {
        return base.findById(entity, id);
      },
      findAll(filters) {
        return base.findAll(entity, filters);
      },
      update(id, data) {
        return base.update(entity, id, data);
      },
      delete(id) {
        return base.delete(entity, id);
      },
      restore(id) {
        return base.restore(entity, id);
      },
      exists(id) {
        return base.exists(entity, id);
      },
      count(filters) {
        return base.count(entity, filters);
      },
    };

    return proxy;
  },

  // ============================================================
  // REGISTER (с applyCompatibility)
  // ============================================================

  register(entity, repo, options = {}) {
    if (!entity || !repo) {
      return false;
    }

    if (this.repositories[entity] && !options.force) {
      return false;
    }

    const contract = this.validate(repo);

    // Применяем совместимость и сохраняем обновлённый репозиторий
    const adaptedRepo = this.applyCompatibility(repo);
    this.repositories[entity] = adaptedRepo;

    this.metadata[entity] = {
      version: repo.version || "unknown",
      type: repo.repositoryType || "CUSTOM",
      contract,
      registered: new Date().toISOString(),
    };

    delete this.pending[entity];

    Logger.log(
      "RepositoryFactory REGISTER " +
        entity +
        " [" +
        this.metadata[entity].type +
        "]"
    );

    return true;
  },

  // ============================================================
  // COMPATIBILITY (добавляет getById, getAll, save)
  // ============================================================

  applyCompatibility(repo) {
    if (!repo) return repo;

    // getById -> findById
    if (!repo.getById && repo.findById) {
      repo.getById = repo.findById.bind(repo);
    }

    // getAll -> findAll
    if (!repo.getAll && repo.findAll) {
      repo.getAll = repo.findAll.bind(repo);
    }

    // save -> create / update
    if (!repo.save) {
      repo.save = function (data) {
        let idField = null;
        if (typeof EntityRegistry !== "undefined" && EntityRegistry.get) {
          const meta = EntityRegistry.get(repo.entity);
          if (meta && meta.idField) {
            idField = meta.idField;
          }
        }
        if (!idField && repo.entity) {
          idField = repo.entity + "ID";
        }

        if (idField && data && data[idField]) {
          return repo.update(data[idField], data);
        }
        return repo.create(data);
      };
    }

    return repo;
  },

  // ============================================================
  // VALIDATE
  // ============================================================

  validate(repo) {
    const required = [
      "create",
      "findById",
      "findAll",
      "update",
      "delete",
      "restore",
      "exists",
    ];

    return {
      status: required.every((x) => typeof repo[x] === "function")
        ? "OK"
        : "WARNING",
      missing: required.filter((x) => typeof repo[x] !== "function"),
    };
  },

  // ============================================================
  // RESOLVE
  // ============================================================

  resolveRepository(name) {
    if (globalThis[name]) {
      return globalThis[name];
    }

    const key = Object.keys(globalThis).find(
      (k) => k.toUpperCase() === name.toUpperCase()
    );

    return key ? globalThis[key] : null;
  },

  // ============================================================
  // LEGACY COMPATIBILITY
  // ============================================================

  registerLoaded(name, repository) {
    if (!name || !repository) {
      Logger.warn("RepositoryFactory.registerLoaded invalid");
      return false;
    }

    const entity = this.resolveEntity(repository, name);
    return this.register(entity, repository);
  },

  // ============================================================
  // PENDING
  // ============================================================

  refreshPending() {
    let loaded = 0;

    Object.entries(this.pending).forEach(([entity, item]) => {
      const repo = this.resolveRepository(item.repository);
      if (repo) {
        this.register(entity, repo);
        loaded++;
      }
    });

    return loaded;
  },

  // ============================================================
  // ACCESS
  // ============================================================

  get(entity) {
    if (!this.repositories[entity]) {
      this.discovery();
      this.autoRegister();
    }

    const repo = this.repositories[entity];
    if (!repo) {
      throw new Error("Repository not found " + entity);
    }

    return repo;
  },

  has(entity) {
    return !!this.repositories[entity];
  },

  list() {
    return Object.keys(this.repositories);
  },

  count() {
    return this.list().length;
  },

  // ============================================================
  // SYNC
  // ============================================================

  syncRegistry() {
    if (typeof RepositoryRegistry === "undefined") {
      return;
    }

    if (!RepositoryRegistry.register) {
      return;
    }

    Object.entries(this.repositories).forEach(([entity, repo]) => {
      try {
        RepositoryRegistry.register(entity, repo);
      } catch (e) {}
    });
  },

  // ============================================================
  // HEALTH
  // ============================================================

  health() {
    const entities =
      typeof EntityRegistry !== "undefined"
        ? EntityRegistry.list().filter((e) => !e.startsWith("__TEST_"))
        : [];

    const loaded = entities.filter((e) => this.has(e));

    return HealthContract.create(
      "RepositoryFactory",
      "OK",
      {
        version: this.version,
        loaded: this.count(),
        entities: entities.length,
        coverage: entities.length
          ? Math.round((loaded.length / entities.length) * 100)
          : 0,
        repositories: this.list(),
        types: this.metadata,
      }
    );
  },

  // ============================================================
  // DIAGNOSTICS
  // ============================================================

  diagnostics() {
    return {
      version: this.version,
      count: this.count(),
      repositories: this.metadata,
      discoveryRuns: this.discoveryRuns,
      pending: this.pending,
    };
  },

  reset() {
    this.repositories = {};
    this.metadata = {};
    this.pending = {};
    this.initialized = false;
    Logger.log("RepositoryFactory RESET");
  },
};

globalThis.RepositoryFactory = RepositoryFactory;

Logger.log(
  "RepositoryFactory GLOBAL READY v" + RepositoryFactory.version
);