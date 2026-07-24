// ============================================================
// RepositoryFactory v2.1.0
// Enterprise Repository Dependency Container
// ERP Core
// ============================================================

console.log("RepositoryFactory v2.1.0");

const RepositoryFactory = {
  version: "2.1.0",
  apiVersion: "2.0",

  repositories: {},
  pending: {},
  metadata: {},
  initialized: false,

  // ============================================================
  // INIT
  // ============================================================

  init() {
    if (this.initialized) {
      Logger.debug("RepositoryFactory already initialized");
      return;
    }

    Logger.log("RepositoryFactory INIT");

    // Загружаем репозитории из RepositoryRegistry (если есть)
    this.loadFromRegistry();

    // Автоматическая регистрация из EntityRegistry
    this.autoRegister();

    // Синхронизируем наши репозитории обратно в RepositoryRegistry
    this.syncRegistry();

    // Проверяем ожидающие (pending) репозитории
    this.checkPending();

    this.initialized = true;

    Logger.log(
      "RepositoryFactory READY v" +
        this.version +
        " count=" +
        this.count()
    );
  },

  // ============================================================
  // LOAD FROM RepositoryRegistry
  // ============================================================

  loadFromRegistry() {
    if (typeof RepositoryRegistry === "undefined") {
      Logger.warn("RepositoryRegistry unavailable");
      return;
    }

    RepositoryRegistry.list().forEach(entity => {
      const repo = RepositoryRegistry.get(entity);
      this.register(entity, repo);
    });
  },

  // ============================================================
  // SYNC WITH RepositoryRegistry (новый метод)
  // ============================================================

  syncRegistry() {
    if (typeof RepositoryRegistry === "undefined") {
      Logger.warn("RepositoryRegistry unavailable, sync skipped");
      return;
    }

    let count = 0;
    Object.entries(this.repositories).forEach(([name, repo]) => {
      if (RepositoryRegistry.register) {
        RepositoryRegistry.register(name, repo);
        count++;
      }
    });

    Logger.log(`RepositoryFactory SYNC REGISTRY COMPLETE (${count} repositories)`);
  },

  // ============================================================
  // AUTO REGISTER FROM EntityRegistry
  // ============================================================

  autoRegister() {
    if (typeof EntityRegistry === "undefined") {
      throw new Error("EntityRegistry unavailable");
    }

    EntityRegistry.list().forEach(entity => {
      const meta = EntityRegistry.get(entity);
      if (!meta.repository) {
        return;
      }

      const repo = globalThis[meta.repository];

      if (repo) {
        this.register(entity, repo);
      } else {
        this.pending[entity] = {
          repository: meta.repository,
          created: new Date()
        };
        Logger.debug("Repository pending " + entity);
      }
    });
  },

  // ============================================================
  // REGISTER
  // ============================================================

  register(entity, repository) {
    if (!entity) {
      throw new Error("Repository entity required");
    }
    if (!repository) {
      throw new Error("Repository missing " + entity);
    }

    if (this.repositories[entity]) {
      Logger.debug("Repository already exists " + entity);
      return false;
    }

    const contract = this.validate(entity, repository);

    this.repositories[entity] = repository;
    this.metadata[entity] = {
      version: repository.version || "unknown",
      contract: contract,
      registeredAt: new Date()
    };

    Logger.log("RepositoryFactory REGISTER " + entity);
    return true;
  },

  // ============================================================
  // CONTRACT VALIDATION
  // ============================================================

  validate(entity, repository) {
    const required = [
      "create",
      "findById",
      "findAll",
      "update",
      "delete",
      "restore",
      "exists"
    ];

    const missing = [];

    required.forEach(method => {
      if (typeof repository[method] !== "function") {
        missing.push(method);
      }
    });

    if (missing.length && typeof BaseRepository !== "undefined") {
      this.attachBaseAdapter(entity, repository, missing);
      return {
        status: "ADAPTED",
        methods: Object.keys(repository),
        warnings: ["BaseRepository adapter applied"]
      };
    }

    if (missing.length) {
      throw new Error(
        "Repository contract failed " +
          entity +
          ": " +
          missing.join(",")
      );
    }

    return {
      status: "OK",
      methods: required,
      warnings: []
    };
  },

  // ============================================================
  // BASE ADAPTER
  // ============================================================

  attachBaseAdapter(entity, repository, methods) {
    methods.forEach(method => {
      if (typeof repository[method] !== "function") {
        repository[method] = function (...args) {
          return BaseRepository[method](entity, ...args);
        };
      }
    });
  },

  // ============================================================
  // LAZY REGISTER
  // ============================================================

  registerLazy(entity, getter) {
    Object.defineProperty(this.repositories, entity, {
      configurable: true,
      get() {
        const repo = getter();
        if (!repo) {
          throw new Error("Lazy repository unavailable " + entity);
        }
        return repo;
      }
    });
  },

  // ============================================================
  // LOADED
  // ============================================================

  registerLoaded(entity, repository) {
    delete this.pending[entity];
    return this.register(entity, repository);
  },

  // ============================================================
  // PENDING CHECK
  // ============================================================

  checkPending() {
    let loaded = 0;
    Object.entries(this.pending).forEach(([entity, item]) => {
      const repo = globalThis[item.repository];
      if (repo) {
        this.registerLoaded(entity, repo);
        loaded++;
      }
    });
    return loaded;
  },

  // ============================================================
  // ACCESS
  // ============================================================

  get(entity) {
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
    return !!this.repositories[entity];
  },

  list() {
    return Object.keys(this.repositories);
  },

  count() {
    return this.list().length;
  },

  // ============================================================
  // DIAGNOSTICS
  // ============================================================

  diagnostics() {
    return {
      version: this.version,
      repositories: this.metadata,
      pending: this.pending,
      count: this.count()
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
        repositories: this.list(),
        count: this.count(),
        pending: Object.keys(this.pending)
      }
    );
  }
};

globalThis.RepositoryFactory = RepositoryFactory;

Logger.log("RepositoryFactory GLOBAL READY v" + RepositoryFactory.version);