// ============================================================
// RepositoryFactory v2.5.8
// Enterprise Repository Dependency Container
// TaxControl ERP Core
// ============================================================

console.log("RepositoryFactory v2.5.8");

const RepositoryFactory = {
  version: "2.5.8",
  apiVersion: "2.2",

  repositories: {},
  pending: {},
  metadata: {},

  initialized: false,
  initializing: false,

  // ============================================================
  // INIT
  // ============================================================

  init() {
    if (this.initialized) {
      Logger.debug("RepositoryFactory already initialized");
      return;
    }

    if (this.initializing) {
      Logger.debug("RepositoryFactory initialization already in progress");
      return;
    }

    this.initializing = true;

    try {
      Logger.log("RepositoryFactory INIT");

      this.loadFromRegistry();
      this.registerAllRepositories();
      this.autoRegister();
      this.refreshPending();
      this.syncRegistry();

      this.initialized = true;

      Logger.log(
        "RepositoryFactory READY v" + this.version + " count=" + this.count()
      );
    } catch (e) {
      this.initialized = false;
      Logger.error("RepositoryFactory INIT FAILED " + e.message);
      throw e;
    } finally {
      this.initializing = false;
    }
  },

  // ============================================================
  // LOAD EXISTING REGISTRY
  // ============================================================

  loadFromRegistry() {
    if (typeof RepositoryRegistry === "undefined") return;

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
  // registerAllRepositories – с корректным преобразованием имени
  // ============================================================

  registerAllRepositories() {
    const list = [
      "ClientRepository",
      "TripRepository",
      "VehicleRepository",
      "RouteRepository",
      "TransportOrderRepository",
      "CarrierRepository",
      "DriverRepository",
      "CargoRepository",
      "FinancialTransactionRepository",
      "ClientFinanceProfileRepository",
      "KPIRepository",
    ];

    let count = 0;

    list.forEach((name) => {
      const repo = this.resolveRepository(name);
      if (repo) {
        const entity = this.buildEntityName(name);
        // Исправлено: увеличиваем счетчик только при успешной регистрации
        if (this.register(entity, repo)) {
          count++;
        }
      }
    });

    Logger.log("Manual repositories registered " + count);
    return count;
  },

  // ============================================================
  // buildEntityName – оставлен без изменений (работает корректно)
  // ============================================================

  buildEntityName(repositoryName) {
    return repositoryName
      .replace("Repository", "")
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .toUpperCase();
  },

  // ============================================================
  // buildRepositoryName – преобразует код сущности в имя класса
  // ============================================================

  buildRepositoryName(entity) {
    // Словарь исключений
    const special = {
      KPI: "KPIRepository",
      CRM: "CRMRepository",
      API: "APIRepository",
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
  // AUTO REGISTER
  // ============================================================

  autoRegister() {
    if (typeof EntityRegistry === "undefined") {
      throw new Error("EntityRegistry unavailable");
    }

    EntityRegistry.list().forEach((entity) => {
      const meta = EntityRegistry.get(entity);
      if (!meta) return;

      const isSystem = meta.system || entity.startsWith("__TEST_");
      if (isSystem) {
        this.registerSystemRepository(entity);
        return;
      }

      const repoName = meta.repository || this.buildRepositoryName(entity);
      const repo = this.resolveRepository(repoName);

      if (repo) {
        this.register(entity, repo);
      } else {
        if (!this.pending[entity]) {
          this.pending[entity] = {
            repository: repoName,
            system: false,
            created: new Date(),
          };
          Logger.debug("Repository pending " + entity + " -> " + repoName);
        }
      }
    });
  },

  // ============================================================
  // SYSTEM REPOSITORY
  // ============================================================

  registerSystemRepository(entity) {
    if (this.repositories[entity]) {
      Logger.debug(
        "System repository skipped, already registered " + entity
      );
      return;
    }

    if (typeof BaseRepository === "undefined") {
      if (!this.pending[entity]) {
        this.pending[entity] = {
          repository: "BaseRepository",
          system: true,
          created: new Date(),
        };
      }
      return;
    }

    this.register(entity, BaseRepository);
    Logger.log("System repository registered " + entity);
  },

  // ============================================================
  // REGISTER – с защитой от случайной перезаписи
  // ============================================================

  register(entity, repository, options = {}) {
    if (!entity) throw new Error("Repository entity required");
    if (!repository) throw new Error("Repository missing " + entity);

    if (
      this.repositories[entity] &&
      this.repositories[entity] !== repository &&
      !options.force
    ) {
      Logger.warn(
        "Repository overwrite blocked for " + entity +
        " (existing differs from new)"
      );
      return false;
    }

    if (this.repositories[entity] && !options.force) {
      Logger.debug("Repository already exists " + entity);
      return false;
    }

    const contract = this.validate(entity, repository);

    this.repositories[entity] = repository;
    this.metadata[entity] = {
      version: repository.version || "unknown",
      contract,
      crud: this.detectCRUD(repository),
      registeredAt: new Date(),
    };

    Logger.log("RepositoryFactory REGISTER " + entity);
    return true;
  },

  // ============================================================
  // registerLoaded – с корректным управлением pending
  // ============================================================

  registerLoaded(entity, repository) {
    if (this.repositories[entity]) {
      Logger.debug("Repository already loaded " + entity);
      delete this.pending[entity];
      return true;
    }

    delete this.pending[entity];
    return this.register(entity, repository);
  },

  // ============================================================
  // notifyLoaded – ручное уведомление
  // ============================================================

  notifyLoaded(entity, repository) {
    Logger.log("RepositoryFactory NOTIFY LOADED " + entity);
    return this.registerLoaded(entity, repository);
  },

  // ============================================================
  // autoNotify – универсальный вызов из репозитория
  // ============================================================

  autoNotify(entity, repository) {
    if (typeof RepositoryFactory === "undefined") {
      Logger.warn("RepositoryFactory not available, autoNotify skipped");
      return;
    }
    RepositoryFactory.notifyLoaded(entity, repository);
  },

  // ============================================================
  // VALIDATE CONTRACT
  // ============================================================

  validate(entity, repository) {
    const required = [
      "create",
      "findById",
      "findAll",
      "update",
      "delete",
      "restore",
      "exists",
    ];

    const missing = [];

    required.forEach((method) => {
      if (typeof repository[method] !== "function") {
        missing.push(method);
      }
    });

    if (missing.length && typeof BaseRepository !== "undefined") {
      this.attachBaseAdapter(entity, repository, missing);
      return {
        status: "ADAPTED",
        missing,
        warnings: ["BaseRepository adapter applied"],
      };
    }

    if (missing.length) {
      throw new Error(
        "Repository contract failed " + entity + ": " + missing.join(",")
      );
    }

    return { status: "OK", missing: [], warnings: [] };
  },

  // ============================================================
  // BASE ADAPTER
  // ============================================================

  attachBaseAdapter(entity, repository, methods) {
    methods.forEach((method) => {
      if (typeof repository[method] !== "function") {
        repository[method] = function (...args) {
          return BaseRepository[method](entity, ...args);
        };
      }
    });
  },

  // ============================================================
  // refreshPending – использует resolveRepository
  // ============================================================

  refreshPending() {
    let loaded = 0;

    Object.entries(this.pending).forEach(([entity, item]) => {
      const repo = this.resolveRepository(item.repository);
      if (repo) {
        try {
          this.registerLoaded(entity, repo);
          loaded++;
          Logger.log("Pending repository resolved " + entity);
        } catch (e) {
          Logger.error(
            "Pending repository failed " + entity + " " + e.message
          );
        }
      }
    });

    if (loaded) {
      this.syncRegistry();
      Logger.log("Repository pending loaded " + loaded);
    }

    return loaded;
  },

  // Алиас
  checkPending() {
    return this.refreshPending();
  },

  // ============================================================
  // resolveRepository – с проверкой на object или function
  // ============================================================

  resolveRepository(name) {
    if (
      globalThis[name] &&
      (typeof globalThis[name] === "object" ||
       typeof globalThis[name] === "function")
    ) {
      return globalThis[name];
    }

    const normalized = name.toUpperCase();
    for (const key of Object.keys(globalThis)) {
      if (key.toUpperCase() === normalized) {
        const candidate = globalThis[key];
        if (
          candidate &&
          (typeof candidate === "object" || typeof candidate === "function")
        ) {
          return candidate;
        }
      }
    }

    return null;
  },

  // ============================================================
  // pendingReport
  // ============================================================

  pendingReport() {
    return Object.entries(this.pending).map(([entity, item]) => ({
      entity,
      repository: item.repository,
      available: !!this.resolveRepository(item.repository),
    }));
  },

  // ============================================================
  // pendingHealth
  // ============================================================

  pendingHealth() {
    const pending = this.pendingReport();
    return {
      status: pending.length === 0 ? "OK" : "WARNING",
      pending,
    };
  },

  // ============================================================
  // REGISTRY SYNC
  // ============================================================

  syncRegistry() {
    if (typeof RepositoryRegistry === "undefined") return;
    if (typeof RepositoryRegistry.register !== "function") return;

    Object.entries(this.repositories).forEach(([entity, repo]) => {
      try {
        RepositoryRegistry.register(entity, repo);
      } catch (e) {
        Logger.warn(
          "Registry sync failed " + entity + " " + e.message
        );
      }
    });
  },

  // ============================================================
  // CRUD ANALYSIS
  // ============================================================

  detectCRUD(repo) {
    const methods = ["create", "findById", "findAll", "update", "delete"];
    let ok = 0;
    methods.forEach((m) => {
      if (typeof repo[m] === "function") ok++;
    });
    return {
      available: ok,
      total: methods.length,
      percent: Math.round((ok / methods.length) * 100),
    };
  },

  // ============================================================
  // ACCESS
  // ============================================================

  get(entity) {
    if (
      !this.repositories[entity] &&
      Object.keys(this.pending).length
    ) {
      this.refreshPending();
    }

    const repo = this.repositories[entity];
    if (!repo) {
      throw new Error("Repository not found " + entity);
    }
    return repo;
  },

  getByEntity(entity) {
    return this.get(entity);
  },

  has(entity) {
    if (
      !this.repositories[entity] &&
      Object.keys(this.pending).length
    ) {
      this.refreshPending();
    }
    return !!this.repositories[entity];
  },

  list() {
    return Object.keys(this.repositories);
  },

  count() {
    return this.list().length;
  },

  // ============================================================
  // LAZY
  // ============================================================

  registerLazy(entity, getter) {
    Object.defineProperty(this.repositories, entity, {
      configurable: true,
      get() {
        const repo = getter();
        if (!repo) throw new Error("Lazy repository unavailable " + entity);
        return repo;
      },
    });
  },

  // ============================================================
  // FULL REFRESH
  // ============================================================

  refresh() {
    Logger.log("RepositoryFactory FULL REFRESH");

    this.registerAllRepositories();
    this.autoRegister();

    const loaded = this.refreshPending();

    this.syncRegistry();

    return {
      repositories: this.count(),
      pending: Object.keys(this.pending),
      loaded,
    };
  },

  // ============================================================
  // RESET
  // ============================================================

  reset() {
    this.repositories = {};
    this.pending = {};
    this.metadata = {};
    this.initialized = false;
    this.initializing = false;

    if (
      typeof RepositoryRegistry !== "undefined" &&
      typeof RepositoryRegistry.clear === "function"
    ) {
      RepositoryRegistry.clear();
    } else if (
      typeof RepositoryRegistry !== "undefined" &&
      typeof RepositoryRegistry.reset === "function"
    ) {
      RepositoryRegistry.reset();
    }

    Logger.log("RepositoryFactory RESET");
  },

  // ============================================================
  // STATUS
  // ============================================================

  status() {
    return {
      version: this.version,
      initialized: this.initialized,
      repositoryCount: this.count(),
      repositories: this.list(),
      pending: this.pendingReport(),
      pendingHealth: this.pendingHealth(),
      timestamp: new Date().toISOString(),
    };
  },

  // ============================================================
  // entityMap
  // ============================================================

  entityMap() {
    if (typeof EntityRegistry === "undefined") return [];

    return EntityRegistry.list().map((entity) => {
      const repo = this.repositories[entity];
      return {
        entity,
        repository: repo ? repo.version || "loaded" : null,
        exists: !!repo,
        crud: repo ? this.detectCRUD(repo) : null,
      };
    });
  },

  // ============================================================
  // VALIDATE ALL
  // ============================================================

  validateAll() {
    const result = [];

    Object.entries(this.repositories).forEach(([entity, repo]) => {
      try {
        const contract = this.validate(entity, repo);
        result.push({
          entity,
          status: contract.status,
          crud: this.detectCRUD(repo),
        });
      } catch (e) {
        result.push({
          entity,
          status: "FAILED",
          error: e.message,
        });
      }
    });

    return result;
  },

  // ============================================================
  // missingRepositories – ИСПРАВЛЕНА (чистая проверка без побочных эффектов)
  // ============================================================

  missingRepositories() {
    if (typeof EntityRegistry === "undefined") return [];

    return EntityRegistry.list().filter((entity) => {
      // Проверяем только фактическое наличие в репозитории, не вызывая refreshPending
      return !this.repositories[entity];
    });
  },

  // ============================================================
  // DIAGNOSTICS
  // ============================================================

  diagnostics() {
    return {
      version: this.version,
      initialized: this.initialized,
      repositories: this.metadata,
      pending: this.pending,
      count: this.count(),
    };
  },

  // ============================================================
  // HEALTH
  // ============================================================

  health() {
    return HealthContract.create(
      "RepositoryFactory",
      this.initialized ? "OK" : "WARNING",
      {
        version: this.version,
        count: this.count(),
        repositories: this.list(),
        pending: Object.keys(this.pending),
      }
    );
  },
};

globalThis.RepositoryFactory = RepositoryFactory;

Logger.log("RepositoryFactory GLOBAL READY v" + RepositoryFactory.version);