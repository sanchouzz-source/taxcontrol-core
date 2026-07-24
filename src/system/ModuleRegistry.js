// ============================================================
// ModuleRegistry v1.9.3
// Enterprise Module Lifecycle Manager
// ============================================================

console.log("ModuleRegistry v1.9.3");

const ModuleRegistry = {
  version: "1.9.3",
  apiVersion: "1.0",

  modules: {},
  started: {},
  failed: [],
  failedHistory: [],
  initialized: false,
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
        status: module.status
      });
    } catch (e) {
      Logger.warn("ModuleRegistry event error: " + e.message);
    }
  },

  // ============================================================
  // INIT (не удаляет уже зарегистрированные модули)
  // ============================================================

  init() {
    if (this.initialized) {
      Logger.warn("ModuleRegistry already initialized");
      return;
    }
    // Не трогаем this.modules – они уже зарегистрированы
    this.started = {};
    this.failed = [];
    this.failedHistory = [];
    this.initialized = true;
    Logger.log("ModuleRegistry INITIALIZED v" + this.version);
  },

  // ============================================================
  // REGISTER
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
      name,
      version: definition.version || "1.0.0",
      description: definition.description || "",
      owner: definition.owner || "CORE",
      phase: definition.phase || "DOMAIN",
      priority: definition.priority ?? 100,
      dependencies: definition.dependencies || [],
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
  // START ALL MODULES (по приоритету)
  // ============================================================

  async startAll() {
    if (!this.initialized) {
      Logger.warn("ModuleRegistry not initialized, call init() first");
      // Можно автоматически инициализировать, но не сбрасывая модули
      this.init();
    }

    Logger.log("ModuleRegistry START ALL");

    const modules = Object.values(this.modules)
      .filter(m => m.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const mod of modules) {
      try {
        await this._startModule(mod);
      } catch (e) {
        mod.status = "FAILED";
        mod.error = e.message;
        this.failed.push({
          name: mod.name,
          error: e.message,
          timestamp: new Date()
        });
        Logger.error(`ModuleRegistry: ${mod.name} FAILED ${e.message}`);
      }
    }

    Logger.log(
      `ModuleRegistry START COMPLETE OK=${modules.length - this.failed.length} FAILED=${this.failed.length}`
    );

    return {
      total: modules.length,
      failed: this.failed.length
    };
  },

  // ============================================================
  // START SINGLE MODULE
  // ============================================================

  async _startModule(mod) {
    if (mod.starting) return;
    mod.starting = true;

    Logger.log(`MODULE START ${mod.name}`);

    try {
      if (typeof mod.register === "function") {
        await mod.register();
      }
      if (typeof mod.init === "function") {
        await mod.init();
      }
      if (typeof mod.start === "function") {
        await mod.start();
      }

      mod.status = "STARTED";
      mod.startedAt = new Date();

      if (typeof mod.ready === "function") {
        await mod.ready();
      }

      mod.status = "READY";
      Logger.log(`MODULE READY ${mod.name}`);
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
  // STOP ALL (опционально)
  // ============================================================

  async stopAll() {
    for (const mod of Object.values(this.modules)) {
      try {
        if (typeof mod.stop === "function") {
          await mod.stop();
        }
        mod.status = "STOPPED";
      } catch (e) {
        Logger.warn(`STOP ERROR ${mod.name}: ${e.message}`);
      }
    }
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
      modules: Object.values(this.modules).map(m => ({
        name: m.name,
        version: m.version,
        phase: m.phase,
        priority: m.priority,
        status: m.status
      })),
      failed: this.failed
    };
  }
};

globalThis.ModuleRegistry = ModuleRegistry;
Logger.log("ModuleRegistry READY v" + ModuleRegistry.version);