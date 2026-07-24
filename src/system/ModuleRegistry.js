// ============================================================
// ModuleRegistry v1.10.0
// Enterprise Module Lifecycle Manager
// ERP Core
// ============================================================

console.log("ModuleRegistry v1.10.0");

const ModuleRegistry = {
  version: "1.10.0",
  apiVersion: "1.0",

  modules: {},
  started: {},
  failed: [],
  failedHistory: [],
  initialized: false,
  startedAll: false,
  eventBus: null,

  // ============================================================
  // EVENT BUS
  // ============================================================

  setEventBus(bus) {
    this.eventBus = bus;
    Logger.log("ModuleRegistry: EventBus attached");
  },

  _emitModuleEvent(type, module) {
    if (!this.eventBus) return;
    if (typeof this.eventBus.emit !== "function") {
      Logger.warn("ModuleRegistry: EventBus emit unavailable");
      return;
    }
    try {
      this.eventBus.emit(type, {
        module: module.name,
        version: module.version,
        status: module.status,
        timestamp: new Date()
      });
      Logger.log(`EVENT ${type} ${module.name}`);
    } catch (e) {
      Logger.warn("ModuleRegistry event error: " + e.message);
    }
  },

  // ============================================================
  // INIT
  // ============================================================

  init() {
    if (this.initialized) {
      Logger.warn("ModuleRegistry already initialized");
      return;
    }
    this.started = {};
    this.failed = [];
    this.startedAll = false;
    this.initialized = true;
    Logger.log("ModuleRegistry INITIALIZED v" + this.version);
  },

  // ============================================================
  // REGISTER (с разделением зависимостей)
  // ============================================================

  register(name, definition) {
    if (!definition) {
      Logger.warn(`ModuleRegistry ${name} no definition`);
      return false;
    }
    if (this.modules[name]) {
      Logger.warn(`ModuleRegistry ${name} already exists`);
      return false;
    }

    const mod = {
      name: name,
      version: definition.version || "1.0.0",
      description: definition.description || "",
      owner: definition.owner || "CORE",
      phase: definition.phase || "DOMAIN",
      priority: definition.priority ?? 100,
      // ---- НОВОЕ: разделение зависимостей ----
      services: definition.services || [],       // инфраструктурные сервисы
      modules: definition.modules || [],         // другие ERP-модули
      // для обратной совместимости можно оставить dependencies, но мы будем использовать services+modules
      versionDependencies: definition.versionDependencies || [],
      enabled: definition.enabled !== false,
      api: definition.api || { entities: [], events: [], services: [] },
      status: "REGISTERED",
      startedAt: null,
      error: null,
      starting: false,
      register: definition.register || null,
      init: definition.init || null,
      start: definition.start || null,
      ready: definition.ready || null,
      stop: definition.stop || null,
      health: definition.health || null
    };

    this.modules[name] = mod;
    Logger.log(`ModuleRegistry: ${name} v${mod.version} registered`);
    this._emitModuleEvent("MODULE_REGISTERED", mod);
    return true;
  },

  // ============================================================
  // MANIFEST
  // ============================================================

  loadManifest(manifest) {
    return this.registerManifest(manifest);
  },

  registerManifest(manifest) {
    let count = 0;
    for (const [key, item] of Object.entries(manifest || {})) {
      const definition = item.moduleDefinition || item;
      const name = definition.name || key;
      if (!this.modules[name]) {
        this.register(name, definition);
        count++;
      }
    }
    Logger.log(`ModuleRegistry: loaded ${count} modules`);
    return count;
  },

  // ============================================================
  // DEPENDENCY RESOLVER (глобальные сервисы)
  // ============================================================

  resolveDependency(name) {
    switch (name) {
      case "Database":
        return globalThis.Database;
      case "EventBus":
        return globalThis.EventBus;
      case "RepositoryFactory":
        return globalThis.RepositoryFactory;
      case "EntityService":
        return globalThis.EntityService;
      case "Logger":
        return globalThis.Logger;
      default:
        return globalThis[name];
    }
  },

  // ============================================================
  // ТОПОЛОГИЧЕСКАЯ СОРТИРОВКА (возвращает порядок модулей)
  // ============================================================

  _topologicalSort() {
    const graph = {};
    const inDegree = {};
    const modules = Object.values(this.modules).filter(m => m.enabled);

    modules.forEach(m => {
      graph[m.name] = m.modules || [];
      inDegree[m.name] = graph[m.name].length;
    });

    const queue = modules.filter(m => inDegree[m.name] === 0).sort((a, b) => b.priority - a.priority);
    const result = [];

    while (queue.length) {
      const current = queue.shift();
      result.push(current);
      // уменьшаем inDegree для модулей, которые зависят от current
      for (const m of modules) {
        if ((m.modules || []).includes(current.name)) {
          inDegree[m.name]--;
          if (inDegree[m.name] === 0) {
            queue.push(m);
            queue.sort((a, b) => b.priority - a.priority);
          }
        }
      }
    }

    if (result.length !== modules.length) {
      const remaining = modules.filter(m => !result.includes(m)).map(m => m.name);
      throw new Error(`Circular module dependency detected: ${remaining.join(', ')}`);
    }
    return result;
  },

  // ============================================================
  // START ALL (с защитой от повторного запуска)
  // ============================================================

  async startAll() {
    if (this.startedAll) {
      Logger.warn("ModuleRegistry already started, skipping");
      return { total: 0, started: 0, failed: 0 };
    }

    // Очищаем ошибки при каждом запуске
    this.failed = [];
    this.failedHistory = [];

    if (!this.initialized) {
      this.init();
    }

    Logger.log("ModuleRegistry START ALL");

    // Получаем порядок через топологическую сортировку
    let modulesOrder;
    try {
      modulesOrder = this._topologicalSort();
    } catch (e) {
      Logger.error(`ModuleRegistry topological sort failed: ${e.message}`);
      throw e;
    }

    let success = 0;

    for (const mod of modulesOrder) {
      try {
        await this._startModule(mod);
        success++;
      } catch (e) {
        // Ошибка уже обработана в _startModule (статус FAILED)
        // но мы её логируем и сохраняем в failed
        this.failed.push({
          name: mod.name,
          error: e.message,
          timestamp: new Date()
        });
        this.failedHistory.push({ ...this.failed[this.failed.length - 1] });
        Logger.error(`MODULE FAILED ${mod.name}: ${e.message}`);
      }
    }

    this.startedAll = true;

    Logger.log(
      `ModuleRegistry START COMPLETE OK=${success} FAILED=${this.failed.length}`
    );

    return {
      total: modulesOrder.length,
      started: success,
      failed: this.failed.length
    };
  },

  // ============================================================
  // START MODULE (с разделением проверок)
  // ============================================================

  async _startModule(mod) {
    if (mod.starting) return;
    mod.starting = true;

    Logger.log("MODULE START " + mod.name);

    // ---- Проверка инфраструктурных сервисов ----
    for (const serviceName of (mod.services || [])) {
      const service = this.resolveDependency(serviceName);
      if (!service) {
        throw new Error(`Missing infrastructure service ${serviceName}`);
      }
    }

    // ---- Проверка зависимостей от других модулей (уже должны быть READY) ----
    for (const moduleName of (mod.modules || [])) {
      const depMod = this.modules[moduleName];
      if (!depMod) {
        throw new Error(`Missing module dependency ${moduleName}`);
      }
      if (depMod.status !== "READY") {
        throw new Error(`Module ${moduleName} is not READY`);
      }
    }

    try {
      if (typeof mod.register === "function") await mod.register();
      if (typeof mod.init === "function") await mod.init();
      if (typeof mod.start === "function") await mod.start();

      mod.status = "STARTED";
      mod.startedAt = new Date();

      if (typeof mod.ready === "function") await mod.ready();

      mod.status = "READY";
      this.started[mod.name] = true;

      Logger.log("MODULE READY " + mod.name);
      this._emitModuleEvent("MODULE_READY", mod);
    } catch (e) {
      mod.status = "FAILED";
      mod.error = e.message;
      throw e;
    } finally {
      mod.starting = false;
    }
  },

  // ============================================================
  // GETTERS
  // ============================================================

  getModule(name) {
    return this.modules[name] || null;
  },

  isReady(name) {
    const m = this.modules[name];
    return !!m && m.status === "READY";
  },

  // ============================================================
  // STOP
  // ============================================================

  async stopAll() {
    for (const mod of Object.values(this.modules)) {
      try {
        if (typeof mod.stop === "function") await mod.stop();
        mod.status = "STOPPED";
      } catch (e) {
        Logger.warn(`STOP ERROR ${mod.name}: ${e.message}`);
      }
    }
    this.startedAll = false;
  },

  // ============================================================
  // HEALTH
  // ============================================================

  health() {
    return {
      status: this.failed.length === 0 ? "OK" : "WARNING",
      module: "ModuleRegistry",
      version: this.version,
      initialized: this.initialized,
      startedAll: this.startedAll,
      modules: Object.values(this.modules).map(m => ({
        name: m.name,
        version: m.version,
        phase: m.phase,
        priority: m.priority,
        status: m.status,
        services: m.services,
        modules: m.modules
      })),
      failed: this.failed
    };
  }
};

globalThis.ModuleRegistry = ModuleRegistry;
Logger.log("ModuleRegistry READY v" + ModuleRegistry.version);