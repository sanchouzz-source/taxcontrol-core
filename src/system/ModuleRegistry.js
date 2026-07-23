// ============================================================
// ModuleRegistry v1.5.0 – Модульный диспетчер с приоритетами и async
// ============================================================
console.log("ModuleRegistry v1.5.0");

const ModuleRegistry = {
  version: "1.5.0",
  apiVersion: "1.0",
  modules: {},
  started: {},
  failed: [],
  failedHistory: [],
  initialized: false,
  eventBus: null,          // внешний bus (устанавливается из SystemInit)

  // ---- УСТАНОВКА ВНЕШНЕГО BUS (убирает прямую зависимость) ----
  setEventBus(bus) {
    this.eventBus = bus;
    Logger.log("ModuleRegistry: EventBus attached");
  },

  // ---- ИНИЦИАЛИЗАЦИЯ ----
  init() {
    Logger.log("ModuleRegistry INITIALIZING");
  },

  // ---- РЕГИСТРАЦИЯ МОДУЛЯ (с приоритетом) ----
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
      phase: definition.phase || "DOMAIN",
      dependencies: definition.dependencies || [],
      versionDependencies: definition.versionDependencies || [],
      priority: definition.priority || 100,        // чем выше, тем раньше
      enabled: definition.enabled !== false,
      status: "REGISTERED",
      startedAt: null,
      error: null,
      register: definition.register || null,
      init: definition.init || null,
      start: definition.start || null,
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

  // ---- ЗАПУСК ВСЕХ МОДУЛЕЙ ПО ФАЗЕ (глобальная сортировка) ----
  startAll(phaseFilter, options = {}) {
    const reset = options.reset === true;
    if (reset) {
      this.failed = [];
      this.started = {};
      this.failedHistory = [];
    }

    // Все зарегистрированные модули (для построения полного графа)
    const allModules = Object.values(this.modules).filter(m => m.enabled);
    // Строим глобальный порядок
    const sortedAll = this._topologicalSort(allModules);

    // Фильтруем только те, что соответствуют фазе и ещё не запущены
    const toStart = sortedAll.filter(m =>
      (!phaseFilter || m.phase === phaseFilter) && !this.started[m.name]
    );

    for (const mod of toStart) {
      this._startModule(mod);
    }
    Logger.log(`ModuleRegistry: phase ${phaseFilter || 'all'} processed, started: ${toStart.length}, failed: ${this.failed.length}`);
  },

  // ---- ЗАВЕРШЕНИЕ ЗАГРУЗКИ ----
  finish() {
    this.initialized = this.failed.length === 0;
    if (this.initialized) {
      Logger.log("ModuleRegistry: all modules successfully started");
    } else {
      Logger.warn(`ModuleRegistry: ${this.failed.length} modules failed to start`);
    }
  },

  // ---- ЗАПУСК ОДНОГО МОДУЛЯ (асинхронный) ----
  async _startModule(mod) {
    if (this.started[mod.name]) return;
    mod.status = "STARTING";
    this._emitModuleEvent("MODULE_STARTING", mod);

    // Проверка зависимостей – ищем среди всех модулей
    for (const dep of mod.dependencies) {
      const depMod = this.modules[dep];
      if (!depMod) {
        mod.status = "BLOCKED";
        mod.error = `Dependency ${dep} not registered`;
        this._failModule(mod);
        return;
      }
      if (!depMod.enabled) {
        mod.status = "BLOCKED";
        mod.error = `Dependency ${dep} is disabled`;
        this._failModule(mod);
        return;
      }
      // Зависимость должна быть уже READY (неважно, в какой фазе)
      if (depMod.status !== "READY") {
        mod.status = "BLOCKED";
        mod.error = `Dependency ${dep} is not ready (status=${depMod.status})`;
        this._failModule(mod);
        return;
      }
    }

    // Версионные зависимости
    for (const vdep of mod.versionDependencies) {
      const depMod = this.modules[vdep.module];
      if (!depMod) {
        mod.status = "BLOCKED";
        mod.error = `Version dependency ${vdep.module} not found`;
        this._failModule(mod);
        return;
      }
      if (!this._versionSatisfies(depMod.version, vdep.minVersion)) {
        mod.status = "BLOCKED";
        mod.error = `${mod.name} requires ${vdep.module} >= ${vdep.minVersion}, found ${depMod.version}`;
        this._failModule(mod);
        return;
      }
    }

    // Подготовка контекста для модуля
    const context = {
      EventBus: this.eventBus,
      Database: Database,
      Registry: EntityRegistry,
      Logger: Logger,
      Config: Config || {}
    };

    try {
      const start = Date.now();
      if (mod.register && typeof mod.register === "function") {
        if (mod.register.length > 0) await mod.register(context);
        else await mod.register();
      }
      if (mod.init && typeof mod.init === "function") {
        if (mod.init.length > 0) await mod.init(context);
        else await mod.init();
      }
      if (mod.start && typeof mod.start === "function") {
        if (mod.start.length > 0) await mod.start(context);
        else await mod.start();
      }
      mod.startedAt = new Date().toISOString();
      mod.status = "READY";
      this.started[mod.name] = true;
      Logger.log(`ModuleRegistry: ${mod.name} READY (${Date.now() - start}ms)`);
      this._emitModuleEvent("MODULE_READY", mod);
    } catch (e) {
      mod.status = "FAILED";
      mod.error = e.message;
      // Вызов rollback, если есть
      if (mod.rollback && typeof mod.rollback === "function") {
        try {
          if (mod.rollback.length > 0) await mod.rollback(context);
          else await mod.rollback();
          Logger.log(`ModuleRegistry: ${mod.name} rollback executed`);
        } catch (rbError) {
          Logger.error(`ModuleRegistry: ${mod.name} rollback FAILED – ${rbError.message}`);
        }
      }
      this._failModule(mod);
    }
  },

  _failModule(mod) {
    Logger.error(`ModuleRegistry: ${mod.name} FAILED – ${mod.error}`);
    this.failed.push(mod.name);
    this.failedHistory.push({
      module: mod.name,
      phase: mod.phase,
      error: mod.error,
      timestamp: new Date().toISOString()
    });
    this._emitModuleEvent("MODULE_FAILED", mod);
  },

  // ---- ГЕНЕРАЦИЯ СОБЫТИЙ (через внешний bus) ----
  _emitModuleEvent(eventName, mod) {
    try {
      if (this.eventBus && typeof this.eventBus.emit === "function") {
        this.eventBus.emit(eventName, {
          moduleName: mod.name,
          version: mod.version,
          status: mod.status,
          error: mod.error || null,
          timestamp: new Date().toISOString()
        }, { source: "ModuleRegistry" });
      }
    } catch (e) {
      // безопасное игнорирование
    }
  },

  // ---- СРАВНЕНИЕ ВЕРСИЙ (SemVer) ----
  _versionSatisfies(version, minVersion) {
    try {
      const normalize = v => {
        const parts = v.split('.').map(Number);
        while (parts.length < 3) parts.push(0);
        return parts.slice(0, 3);
      };
      const a = normalize(version);
      const b = normalize(minVersion);
      for (let i = 0; i < 3; i++) {
        if (a[i] !== b[i]) return a[i] > b[i];
      }
      return true;
    } catch {
      return false;
    }
  },

  // ---- ТОПОЛОГИЧЕСКАЯ СОРТИРОВКА (с учётом приоритетов) ----
  _topologicalSort(modules) {
    const nameMap = {};
    modules.forEach(m => { nameMap[m.name] = m; });

    for (const m of modules) {
      for (const dep of m.dependencies) {
        if (!nameMap[dep]) {
          throw new Error(`Unknown dependency '${dep}' required by '${m.name}'`);
        }
      }
    }

    const graph = {};
    const inDegree = {};
    for (const m of modules) {
      const deps = m.dependencies.filter(d => nameMap[d]);
      graph[m.name] = deps;
      inDegree[m.name] = deps.length;
    }

    // Начальные узлы с нулевой степенью, сортируем по приоритету (по убыванию)
    let queue = modules.filter(m => inDegree[m.name] === 0)
                       .sort((a, b) => b.priority - a.priority)
                       .map(m => m.name);
    const result = [];

    while (queue.length) {
      const current = queue.shift();
      result.push(nameMap[current]);
      // Уменьшаем степени для зависимых
      for (const m of modules) {
        if (m.dependencies.includes(current)) {
          inDegree[m.name]--;
          if (inDegree[m.name] === 0) queue.push(m.name);
        }
      }
      // После добавления новых узлов, пересортировать очередь по приоритету
      queue = queue.filter(name => inDegree[name] === 0)
                   .sort((a, b) => nameMap[b].priority - nameMap[a].priority);
    }

    if (result.length !== modules.length) {
      const remaining = modules.filter(m => !result.includes(m)).map(m => m.name);
      throw new Error(`Circular module dependency detected: ${remaining.join(', ')}`);
    }
    return result;
  },

  // ---- ОСТАНОВКА МОДУЛЯ ----
  stop(name, options = {}) {
    const mod = this.modules[name];
    if (!mod || mod.status !== "READY") return false;
    try {
      mod.status = "STOPPING";
      this._emitModuleEvent("MODULE_STOPPING", mod);
      if (mod.stop && typeof mod.stop === "function") {
        if (mod.stop.length > 0) mod.stop({ EventBus: this.eventBus, Database, Registry, Logger });
        else mod.stop();
      }
      mod.status = "STOPPED";
      delete this.started[name];
      this._emitModuleEvent("MODULE_STOPPED", mod);
      Logger.log(`ModuleRegistry: ${name} STOPPED`);
      return true;
    } catch (e) {
      Logger.error(`ModuleRegistry: ${name} STOP FAILED – ${e.message}`);
      return false;
    }
  },

  // ---- ПЕРЕЗАГРУЗКА (с каскадом) ----
  reload(name, options = {}) {
    const cascade = options.cascade === true;
    const mod = this.modules[name];
    if (!mod) return false;

    let dependents = [];
    if (cascade) {
      dependents = Object.values(this.modules)
        .filter(m => m.dependencies.includes(name) && m.status === "READY")
        .map(m => m.name);
    }
    for (const depName of dependents) {
      this.stop(depName);
    }
    this.stop(name);
    mod.status = "REGISTERED";
    mod.error = null;
    this._startModule(mod);
    for (const depName of dependents) {
      const depMod = this.modules[depName];
      if (depMod) {
        depMod.status = "REGISTERED";
        depMod.error = null;
        this._startModule(depMod);
      }
    }
    Logger.log(`ModuleRegistry: ${name} RELOADED${cascade ? ' with dependents' : ''}`);
    return true;
  },

  // ---- УНИЧТОЖЕНИЕ ----
  destroy(name) {
    const mod = this.modules[name];
    if (!mod) return false;
    this.stop(name);
    try {
      if (mod.destroy && typeof mod.destroy === "function") {
        if (mod.destroy.length > 0) mod.destroy({ EventBus: this.eventBus, Database, Registry, Logger });
        else mod.destroy();
      }
      mod.status = "DESTROYED";
      delete this.modules[name];
      delete this.started[name];
      Logger.log(`ModuleRegistry: ${name} DESTROYED`);
      return true;
    } catch (e) {
      Logger.error(`ModuleRegistry: ${name} DESTROY FAILED – ${e.message}`);
      return false;
    }
  },

  // ---- РЕГИСТРАЦИЯ МАНИФЕСТА ----
  registerManifest(manifest) {
    for (const [name, def] of Object.entries(manifest)) {
      this.register(name, def);
    }
  },

  // ---- ГРАФ ЗАВИСИМОСТЕЙ ----
  getDependencyGraph() {
    const graph = {};
    for (const [name, mod] of Object.entries(this.modules)) {
      graph[name] = mod.dependencies;
    }
    return graph;
  },

  // ---- ЗДОРОВЬЕ ВСЕХ МОДУЛЕЙ ----
  healthAll() {
    const result = {};
    for (const [name, mod] of Object.entries(this.modules)) {
      try {
        if (mod.health && typeof mod.health === "function") {
          const h = mod.health();
          result[name] = h || { status: "UNKNOWN" };
        } else {
          result[name] = { status: mod.status };
        }
      } catch (e) {
        result[name] = { status: "ERROR", error: e.message };
      }
    }
    return result;
  },

  // ---- ДИАГНОСТИКА ----
  diagnostics() {
    const statuses = {};
    for (const [name, mod] of Object.entries(this.modules)) {
      statuses[name] = {
        status: mod.status,
        version: mod.version,
        phase: mod.phase,
        priority: mod.priority,
        startedAt: mod.startedAt,
        error: mod.error || null
      };
    }
    return {
      version: this.version,
      apiVersion: this.apiVersion,
      initialized: this.initialized,
      failed: this.failed,
      failedHistory: this.failedHistory,
      modules: statuses,
      dependencyGraph: this.getDependencyGraph()
    };
  },

  // ---- HEALTH ----
  health() {
    const total = Object.keys(this.modules).length;
    const started = Object.keys(this.started).length;
    return HealthContract.create(
      "ModuleRegistry",
      this.initialized && this.failed.length === 0 ? "OK" : "WARNING",
      {
        version: this.version,
        apiVersion: this.apiVersion,
        totalModules: total,
        startedModules: started,
        failedModules: this.failed,
        modules: Object.keys(this.modules)
      }
    );
  }
};

globalThis.ModuleRegistry = ModuleRegistry;
Logger.log("ModuleRegistry READY v" + ModuleRegistry.version);