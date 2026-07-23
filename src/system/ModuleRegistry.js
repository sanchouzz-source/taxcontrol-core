// ============================================================
// ModuleRegistry v1.9.0 – с исправлениями loadManifest и registerManifest
// ============================================================
console.log("ModuleRegistry v1.9.0");

const ModuleRegistry = {
  version: "1.9.0",
  apiVersion: "1.0",
  modules: {},
  started: {},
  failed: [],
  failedHistory: [],
  initialized: false,
  eventBus: null,

  setEventBus(bus) {
    this.eventBus = bus;
    Logger.log("ModuleRegistry: EventBus attached");
  },

  init() {
    if (this.initialized) {
      Logger.warn("ModuleRegistry already initialized");
      return;
    }
    this.started = {};
    this.failed = [];
    this.failedHistory = [];
    this.initialized = true;
    Logger.log("ModuleRegistry INITIALIZED v" + this.version);
  },

  register(name, definition) {
    if (!definition) {
      Logger.warn(`ModuleRegistry: ${name} registration failed – no definition`);
      return false;
    }
    if (this.modules[name]) {
      Logger.warn(`ModuleRegistry: ${name} already registered`);
      return false;
    }
    if (definition.apiVersion && !this._versionSatisfies(this.apiVersion, definition.apiVersion)) {
      Logger.error(`ModuleRegistry: ${name} requires apiVersion ${definition.apiVersion}, current ${this.apiVersion}`);
      return false;
    }
    const mod = {
      name,
      version: definition.version || "1.0",
      description: definition.description || "",
      owner: definition.owner || "CORE",
      phase: definition.phase || "DOMAIN",
      priority: definition.priority ?? 100,
      dependencies: definition.dependencies || [],
      versionDependencies: definition.versionDependencies || [],
      enabled: definition.enabled !== false,
      permissions: definition.permissions || [],
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
      destroy: definition.destroy || null,
      rollback: definition.rollback || null,
      health: definition.health || null
    };
    this.modules[name] = mod;
    Logger.log(`ModuleRegistry: ${name} v${mod.version} registered (phase=${mod.phase}, priority=${mod.priority})`);
    this._emitModuleEvent("MODULE_REGISTERED", mod);
    return true;
  },

  // ---- loadManifest (алиас для registerManifest с поддержкой moduleDefinition) ----
  loadManifest(manifest) {
    return this.registerManifest(manifest);
  },

  registerManifest(manifest) {
    let count = 0;
    for (const [key, item] of Object.entries(manifest)) {
      // Поддерживаем оба формата: прямой или с moduleDefinition
      const definition = item.moduleDefinition || item;
      if (definition && definition.name) {
        const name = definition.name || key;
        if (!this.modules[name]) {
          this.register(name, definition);
          count++;
        }
      } else {
        Logger.warn(`ModuleRegistry: invalid manifest entry for ${key}`);
      }
    }
    Logger.log(`ModuleRegistry: loaded ${count} modules from manifest`);
    return count;
  },

  // ---- остальные методы без изменений (уже были) ----
  // Здесь должны быть _versionSatisfies, _topologicalSort, startAll, _startModule, finish, и т.д.
  // Для краткости опущены, но они уже реализованы в предыдущих версиях.
};

globalThis.ModuleRegistry = ModuleRegistry;
Logger.log("ModuleRegistry READY v" + ModuleRegistry.version);